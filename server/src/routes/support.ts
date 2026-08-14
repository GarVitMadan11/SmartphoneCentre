import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { processSupportMessage } from '../services/aiSupport.js';
import { adminAuth, requireRole, AuthenticatedRequest } from '../middleware/adminAuth.js';

const router = Router();
const prisma = new PrismaClient();

// ── Public Routes ────────────────────────────────────────────────────────

// Send a message (from customer to AI)
router.post('/chat', async (req, res) => {
  try {
    const { conversationId, message, customerData } = req.body;
    
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'Message text is required.' });
      return;
    }

    const result = await processSupportMessage(conversationId, message, customerData);
    res.json(result);
  } catch (err) {
    console.error('POST /api/support/chat error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to process chat message.' });
  }
});

// Fetch full conversation history (for the customer client)
router.get('/chat/:id', async (req, res) => {
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
