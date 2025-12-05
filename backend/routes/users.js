const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');
const pool = require('../config/db');

// Get all departments (PUBLIC - for registration)
router.get('/data/departments', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM departments ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get technicians
router.get('/technicians', verifyToken, async (req, res) => {
    try {
        const technicians = await User.getTechnicians();
        res.json(technicians);
    } catch (error) {
        console.error('Get technicians error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get all users (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get user by ID (Admin only)
router.get('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.getById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create user (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { username, password, full_name, email, phone, role, department_id } = req.body;

        const existingUser = await User.getByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
        }

        const userId = await User.create({
            username, password, full_name, email, phone, role, department_id
        });

        res.status(201).json({ message: 'สร้างผู้ใช้สำเร็จ', userId });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update user (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { full_name, email, phone, role, department_id, is_active } = req.body;
        await User.update(req.params.id, { full_name, email, phone, role, department_id, is_active });
        res.json({ message: 'อัปเดตผู้ใช้สำเร็จ' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await User.delete(req.params.id);
        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
