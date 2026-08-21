import prisma from '../db.js';
import { KNOWLEDGE_BASE } from '../config/supportKnowledgeBase.js';
import { maximumQuoteFor } from './valuation.js';

interface AiResponse {
  response: string;
  intent?: string;
  shouldHandoff: boolean;
  handoffReason?: string;
}

// Call Google Gemini API directly via REST (handles any API key format)
async function callGeminiRestApi(
  apiKey: string,
  history: { role: string; content: string }[],
  userMessage: string
): Promise<AiResponse | null> {
  try {
    const dbModels = await prisma.model.findMany({ where: { hidden: false }, select: { name: true, basePrice128GB: true, category: true } });
    const catalogSummary = dbModels.map(m => {
      const is256Base = m.category === 'flagship' || m.name.includes('15 Pro Max') || m.name.includes('16 Pro') || m.name.includes('17');
      const minGb = is256Base ? 256 : 128;
      const maxGb = is256Base ? 512 : 256;
      return `- ${m.name}: ~₹${maximumQuoteFor(m.basePrice128GB, minGb)} to ₹${maximumQuoteFor(m.basePrice128GB, maxGb)} (Base ${minGb}GB)`;
    }).join('\n');

    const systemPrompt = `${KNOWLEDGE_BASE}

## Live Device Catalog & Price Ranges:
${catalogSummary}
    
CRITICAL INSTRUCTIONS:
1. You are Rephonix's smart AI support assistant. Be warm, humorous, natural, and conversational.
2. If the user introduces themselves, greet them by name.
3. If the user engages in casual chat or banter (e.g. "i love you", "tell me"), respond naturally with personality!
4. Use the Live Device Catalog above to answer price questions for specific models (e.g. iPhone 17 Pro Max, iPhone 16 Pro, Galaxy S25).
5. Return ONLY a JSON object with keys: "response" (string), "intent" (string), "shouldHandoff" (boolean), "handoffReason" (optional string).`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nChat History:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nUser: ${userMessage}` }]
      }
    ];

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (res.ok) {
      const data = await res.json() as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(cleanText);
        if (parsed.response) return parsed;
      }
    } else {
      const errorData = await res.json() as any;
      console.error('Gemini API Error Response:', errorData);
    }
  } catch (err) {
    console.error('Gemini API Fetch Error:', err);
  }
  return null;
}

async function generateAiResponse(
  conversationHistory: { role: string; content: string }[],
  userMessage: string
): Promise<AiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.length > 10) {
    const geminiRes = await callGeminiRestApi(apiKey, conversationHistory, userMessage);
    if (geminiRes) return geminiRes;
  }

  // ── Smart Conversational & Database Search Engine ──────────────────────────
  const lowerMsg = userMessage.toLowerCase().trim();
  let response = "";
  let shouldHandoff = false;
  let handoffReason = undefined;
  let intent = "general";

  // Look back at full history to recall what phone was mentioned
  const fullText = conversationHistory.map(h => h.content).join(' ') + ' ' + userMessage;
  const historyLower = fullText.toLowerCase();

  // 1. Playful / Conversational Banter Handling
  if (lowerMsg.includes('i love you') || lowerMsg.includes('love u') || lowerMsg.includes('marry me')) {
    response = "Aww, thank you! ❤️ I love helping you get the maximum value for your phones! Is there a device you'd like to check a price for today?";
    intent = "banter";
  }
  else if (lowerMsg.includes('fuck') || lowerMsg.includes('shut up') || lowerMsg.includes('stupid') || lowerMsg.includes('idiot')) {
    response = "Haha, fair enough! I'm just an AI trying to help out. Let me know if you ever want to check an instant quote for a device or book a pickup!";
    intent = "banter";
  }
  else if (lowerMsg.includes('not natural') || lowerMsg.includes('robotic') || lowerMsg.includes('bad bot')) {
    response = "Got it, I hear you! I'm constantly learning. Ask me directly about any phone model (like iPhone 15 or Galaxy S24) or payment method, and I'll give you straight answers!";
    intent = "feedback";
  }
  // 2. Personal Introductions (e.g. "i am Dhruv")
  else if (userMessage.match(/(?:i am|i'm|my name is|this is)\s+([a-zA-Z]+)/i)) {
    const match = userMessage.match(/(?:i am|i'm|my name is|this is)\s+([a-zA-Z]+)/i);
    const name = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'friend';
    if (!['Selling', 'Looking', 'Trying', 'Here', 'Just'].includes(name)) {
      response = `Nice to meet you, ${name}! 😊 How can I assist you with Rephonix today? Are you looking to sell a phone or check an order?`;
      intent = "introduction";
    }
  }

  // 3. Device Price Lookup in Database (matches CURRENT userMessage, handling "17 pro", "17 pro max", etc.)
  if (!response) {
    try {
      const models = await prisma.model.findMany({ where: { hidden: false }, include: { brand: true } });
      const msgClean = lowerMsg.replace(/^for\s+/, '').trim();
      
      const matchedModel = models.find(m => {
        const nameLower = m.name.toLowerCase();
        const shortName = nameLower.replace('iphone ', '').trim(); // e.g. "17 pro max"
        if (msgClean === shortName || msgClean === nameLower || msgClean === `iphone ${shortName}`) return true;
        const words = nameLower.split(' ');
        return words.every(w => msgClean.includes(w));
      });

      if (matchedModel) {
        const estMin = maximumQuoteFor(matchedModel.basePrice128GB, 64);
        const estMax = maximumQuoteFor(matchedModel.basePrice128GB, 256);
        const formattedMin = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(estMin);
        const formattedMax = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(estMax);
        
        response = `For the ${matchedModel.name}, our buyback quote currently ranges from ${formattedMin} to ${formattedMax} depending on storage, condition, and original accessories! You can select it on our homepage for a 7-day locked quote.`;
        intent = "device_quote";
      }
    } catch (e) {
      // ignore
    }
  }

  // 4. "Tell me" / "Help me find price" follow-ups
  if (!response && (lowerMsg === 'tell me' || lowerMsg.includes('find my device price') || lowerMsg.includes('what price') || lowerMsg.includes('tell price'))) {
    response = "I can find the exact quote for you! Which phone model do you have (e.g., iPhone 17 Pro, iPhone 16 Pro Max, Samsung S25 Ultra)?";
    intent = "price_followup";
  }

  // 5. Pricing & Valuation Queries
  if (!response && (lowerMsg.includes('price') || lowerMsg.includes('pricing') || lowerMsg.includes('quote') || lowerMsg.includes('worth') || lowerMsg.includes('cost') || lowerMsg.includes('how much'))) {
    response = "Our automated valuation engine calculates your phone's quote based on brand, model, storage, and physical condition. The price is locked for 7 days once calculated on our homepage!";
    intent = "pricing_question";
  }

  // 6. Conversational Declines ("no", "no thanks")
  if (!response && (lowerMsg === 'no' || lowerMsg === 'no thanks' || lowerMsg === 'nope' || lowerMsg.includes('dont want') || lowerMsg.includes("don't want"))) {
    response = "No problem at all! I'm right here whenever you have questions about selling your phone or checking a price!";
    intent = "decline";
  }

  // 7. Human Handoff Request
  if (!response && (lowerMsg.includes('human') || lowerMsg.includes('agent') || lowerMsg.includes('representative') || lowerMsg.includes('talk to someone'))) {
    response = "Got it! I am transferring your chat to a human support agent right now. An executive will join shortly.";
    shouldHandoff = true;
    handoffReason = "User explicitly requested human agent.";
    intent = "human_request";
  }

  // 8. Payment & Payouts
  if (!response && (lowerMsg.includes('pay') || lowerMsg.includes('cash') || lowerMsg.includes('money') || lowerMsg.includes('upi') || lowerMsg.includes('bank'))) {
    response = "Rephonix guarantees instant sub-60-second payouts! Once our doorstep executive verifies your phone, payment is transferred directly via UPI or IMPS before they leave.";
    intent = "payment_question";
  }

  // 9. Pickup & Cities
  if (!response && (lowerMsg.includes('pickup') || lowerMsg.includes('city') || lowerMsg.includes('mumbai') || lowerMsg.includes('delhi') || lowerMsg.includes('bangalore') || lowerMsg.includes('pune'))) {
    response = "We offer free doorstep pickup across Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, and Pune!";
    intent = "coverage_pickup";
  }

  // 10. Greetings
  if (!response && (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey'))) {
    response = "Hello! 👋 Welcome to Rephonix Customer Support. What phone model would you like to check a quote for today?";
    intent = "greeting";
  }

  // Fallback
  if (!response) {
    response = `I'm here to help with all Rephonix services! Tell me your phone model (e.g. iPhone 15 Pro, Samsung S24) and I'll tell you its estimated buyback price.`;
    intent = "general_query";
  }

  return { response, intent, shouldHandoff, handoffReason };
}

export async function processSupportMessage(
  conversationId: string | undefined,
  message: string,
  customerData?: { name?: string; email?: string; customerId?: string }
) {
  let conversation;

  if (conversationId) {
    conversation = await prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: { messages: true }
    });
  }

  if (!conversation) {
    conversation = await prisma.supportConversation.create({
      data: {
        customerName: customerData?.name,
        customerEmail: customerData?.email,
        customerId: customerData?.customerId,
        status: "AI_ACTIVE"
      },
      include: { messages: true }
    });
  }

  // Extract customer name if provided
  const nameMatch = message.match(/(?:i am|i'm|my name is)\s+([a-zA-Z]+)/i);
  if (nameMatch && nameMatch[1] && !conversation.customerName) {
    const name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    await prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { customerName: name }
    });
  }

  // If conversation was resolved, reset to AI_ACTIVE
  if (conversation.status === "RESOLVED" || conversation.status === "CLOSED") {
    conversation = await prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { status: "AI_ACTIVE" },
      include: { messages: true }
    });
  }

  // If in human mode
  if (conversation.status === "WAITING_FOR_HUMAN" || conversation.status === "HUMAN_ACTIVE") {
    const userMsg = await prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message
      }
    });

    const infoResponse = conversation.status === "HUMAN_ACTIVE"
      ? "Your message has been delivered to your assigned support agent. They will reply here shortly."
      : "Your chat is currently queued for a human support agent. An executive will join shortly!";

    return { 
      conversationId: conversation.id, 
      status: conversation.status, 
      response: infoResponse,
      aiMessageId: userMsg.id
    };
  }

  // Append user message
  await prisma.supportMessage.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: message
    }
  });

  const history = conversation.messages.map(m => ({ role: m.role, content: m.content }));
  history.push({ role: 'user', content: message });

  // Get AI Response
  const aiResult = await generateAiResponse(history, message);

  // Append AI message
  const aiMessage = await prisma.supportMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ai",
      content: aiResult.response
    }
  });

  // Update conversation status if handoff is required
  let newStatus = conversation.status;
  if (aiResult.shouldHandoff) {
    newStatus = "WAITING_FOR_HUMAN";
    
    await prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        role: "system",
        content: `--- Conversation escalated to human support ---\nReason: ${aiResult.handoffReason || 'User request'}`
      }
    });
  }

  await prisma.supportConversation.update({
    where: { id: conversation.id },
    data: {
      status: newStatus,
      detectedIntent: aiResult.intent || conversation.detectedIntent,
      handoffReason: aiResult.handoffReason || conversation.handoffReason
    }
  });

  return {
    conversationId: conversation.id,
    status: newStatus,
    response: aiResult.response,
    aiMessageId: aiMessage.id
  };
}
