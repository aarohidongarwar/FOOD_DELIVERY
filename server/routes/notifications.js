import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', 
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all as read
router.put('/mark-read', authenticateToken, async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Mark single as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;

// Helper to create and emit notification
export async function createNotification(userId, title, message, type = 'info', io) {
  try {
    const id = uuidv4();
    await db.execute(
      'INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
      [id, userId, title, message, type]
    );
    
    // If socket.io is provided, try to emit
    if (io) {
      // Find the user's socket in the connectedUsers map
      import('../state.js').then(({ connectedUsers }) => {
        const socketId = connectedUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit('notification', {
            id,
            title,
            message,
            type,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }).catch(console.error);
    }
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}
