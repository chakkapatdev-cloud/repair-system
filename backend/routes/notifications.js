const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// Get user's notifications
router.get('/', verifyToken, async (req, res) => {
    try {
        const notifications = await Notification.getByUserId(req.user.id);
        const unreadCount = await Notification.getUnreadCount(req.user.id);
        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Mark as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        await Notification.markAsRead(req.params.id);
        res.json({ message: 'อ่านแล้ว' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Mark all as read
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ message: 'อ่านทั้งหมดแล้ว' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete notification after reading
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Notification.delete(req.params.id);
        res.json({ message: 'ลบการแจ้งเตือนสำเร็จ' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
