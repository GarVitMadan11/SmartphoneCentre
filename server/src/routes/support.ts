import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../db.js';
import { processSupportMessage } from '../services/aiSupport.js';
import { adminAuth, requireRole, AuthenticatedRequest } from '../middleware/adminAuth.js';
import { customerAuth, AuthenticatedCustomerRequest } from '../middleware/customerAuth.js';
import { sendPilotFeedbackEmail } from '../services/email.js';

const router = Router();

// Maximum allowed length for a single chat message
const MAX_MESSAGE_LENGTH = 2000;

// Per-IP rate limiter for public support chat to prevent:
// - Gemini API cost amplification attacks
// - Conversation/message database flooding
// - Device price enumeration via bulk queries
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many support messages. Please wait 15 minutes before trying again.' },
});

// ── Public Routes ────────────────────────────────────────────────────────

// Send a message (from customer to AI)
router.post('/chat', chatLimiter, async (req, res) => {
  try {
    const { conversationId, message, customerData } = req.body;
    
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'Message text is required.' });
      return;
    }

    // Enforce message length to prevent cost amplification and storage exhaustion
    if (message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        error: 'BadRequest',
        message: `Message is too long. Maximum allowed length is ${MAX_MESSAGE_LENGTH} characters.`,
      });
      return;
    }

    // Validate optional customerData fields
    if (customerData && typeof customerData === 'object') {
      const { name, email } = customerData as Record<string, unknown>;
      if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
        res.status(400).json({ error: 'BadRequest', message: 'customerData.name must be a string under 100 characters.' });
        return;
      }
      if (email !== undefined && (typeof email !== 'string' || email.length > 100)) {
        res.status(400).json({ error: 'BadRequest', message: 'customerData.email must be a string under 100 characters.' });
        return;
      }
    }

    const result = await processSupportMessage(conversationId, message, customerData);
    res.json(result);
  } catch (err) {
    console.error('POST /api/support/chat error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to process chat message.' });
  }
});

// Submit Pilot Program Feedback (Requires Customer Login; Sends email to support@rephonix.in)
router.post('/pilot-feedback', customerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const { name, email, category, feedback } = req.body;
    const customer = req.customer;

    if (!customer) {
      res.status(401).json({ error: 'Unauthorized', message: 'Only logged-in users can submit feedback.' });
      return;
    }

    const userName = (name || customer.name || '').trim();
    const userEmail = (email || customer.email || '').trim().toLowerCase();
    const feedbackText = (feedback || '').trim();
    const feedbackCategory = (category || 'suggestion').trim();

    if (!userName) {
      res.status(400).json({ error: 'ValidationError', message: 'Name is required.' });
      return;
    }

    if (!userEmail || !userEmail.includes('@')) {
      res.status(400).json({ error: 'ValidationError', message: 'A valid Gmail/Email address is required.' });
      return;
    }

    if (!feedbackText || feedbackText.length < 5) {
      res.status(400).json({ error: 'ValidationError', message: 'Please enter a feedback message (at least 5 characters).' });
      return;
    }

    // Deliver directly to support@rephonix.in
    await sendPilotFeedbackEmail(userName, userEmail, feedbackCategory, feedbackText);

    res.json({ success: true, message: 'Thank you! Your feedback has been sent directly to support@rephonix.in.' });
  } catch (err: any) {
    console.error('POST /api/support/pilot-feedback error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to submit feedback. Please try again.' });
  }
});


// Fetch full conversation history (for the customer client).
// Requires admin authentication — conversation history contains customer PII
// (name, email, message content). Without auth, any guessed/leaked UUID would
// expose a full conversation.
router.get('/chat/:id', adminAuth, requireRole(['SUPER_ADMIN', 'OPERATIONS_AGENT']), async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.supportConversation.findUnique({
      where: { id: id as string },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversation) {
      res.status(404).json({ error: 'NotFound', message: 'Conversation not found.' });
      return;
    }

    res.json(conversation);
  } catch (err) {
    console.error('GET /api/support/chat/:id error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch conversation.' });
  }
});

// ── Admin Routes (Protected) ─────────────────────────────────────────────

// Get list of conversations
router.get('/conversations', adminAuth, requireRole(['SUPER_ADMIN', 'OPERATIONS_AGENT']), async (req, res) => {
  try {
    const conversations = await prisma.supportConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { 
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    res.json(conversations);
  } catch (err) {
    console.error('GET /api/support/conversations error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch conversations.' });
  }
});

// Get single conversation with full history
router.get('/conversations/:id', adminAuth, requireRole(['SUPER_ADMIN', 'OPERATIONS_AGENT']), async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.supportConversation.findUnique({
      where: { id: id as string },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    
    if (!conversation) {
      res.status(404).json({ error: 'NotFound', message: 'Conversation not found.' });
      return;
    }
    
    res.json(conversation);
  } catch (err) {
    console.error('GET /api/support/conversations/:id error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch conversation.' });
  }
});

// Update conversation (take over, resolve, add human message)
router.patch('/conversations/:id', adminAuth, requireRole(['SUPER_ADMIN', 'OPERATIONS_AGENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, newMessage } = req.body;

    const conversation = await prisma.supportConversation.findUnique({ where: { id: id as string } });
    if (!conversation) {
      res.status(404).json({ error: 'NotFound', message: 'Conversation not found.' });
      return;
    }

    if (status && ['AI_ACTIVE', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_HUMAN', 'HUMAN_ACTIVE', 'RESOLVED', 'CLOSED'].includes(status)) {
      await prisma.supportConversation.update({
        where: { id: id as string },
        data: { status }
      });
      
      // Log the status change
      await prisma.supportMessage.create({
        data: {
          conversationId: id as string,
          role: "system",
          content: `--- Status changed to ${status} by ${req.user?.username || 'Admin'} ---`
        }
      });
    }

    if (newMessage && typeof newMessage === 'string') {
      // Enforce length limit on agent messages too
      if (newMessage.length > MAX_MESSAGE_LENGTH) {
        res.status(400).json({
          error: 'BadRequest',
          message: `Message is too long. Maximum allowed length is ${MAX_MESSAGE_LENGTH} characters.`,
        });
        return;
      }

      await prisma.supportMessage.create({
        data: {
          conversationId: id as string,
          role: "human_agent",
          content: newMessage
        }
      });
      
      // Ensure status is HUMAN_ACTIVE if they send a message
      if (conversation.status !== "HUMAN_ACTIVE") {
        await prisma.supportConversation.update({
          where: { id: id as string },
          data: { status: "HUMAN_ACTIVE" }
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/support/conversations/:id error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update conversation.' });
  }
});

export default router;
