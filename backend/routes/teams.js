const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all teams
router.get('/', verifyToken, async (req, res) => {
    try {
        const teams = await Team.getAll();
        res.json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get team by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const team = await Team.getById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'ไม่พบทีม' });
        }
        res.json(team);
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create team (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const id = await Team.create(req.body);
        res.status(201).json({ message: 'สร้างทีมสำเร็จ', id });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update team (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await Team.update(req.params.id, req.body);
        res.json({ message: 'อัปเดตทีมสำเร็จ' });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Add member to team
router.post('/:id/members', verifyToken, isAdmin, async (req, res) => {
    try {
        await Team.addMember(req.params.id, req.body.user_id);
        res.json({ message: 'เพิ่มสมาชิกสำเร็จ' });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Remove member from team
router.delete('/:id/members/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        await Team.removeMember(req.params.id, req.params.userId);
        res.json({ message: 'ลบสมาชิกสำเร็จ' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete team (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await Team.delete(req.params.id);
        res.json({ message: 'ลบทีมสำเร็จ' });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
