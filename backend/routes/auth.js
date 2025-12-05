const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

// Multer configuration for avatar upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'));
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, full_name, email, phone, department_id } = req.body;

        // Check if username exists
        const existingUser = await User.getByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
        }

        // Create user
        const userId = await User.create({
            username,
            password,
            full_name,
            email,
            phone,
            department_id,
            role: 'user'
        });

        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', userId });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.getByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Verify password
        const isValid = await User.verifyPassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Check if active
        if (!user.is_active) {
            return res.status(401).json({ message: 'บัญชีนี้ถูกระงับ' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.getById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { full_name, email, phone } = req.body;
        await User.update(req.user.id, { full_name, email, phone });
        res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Upload avatar
router.post('/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
        }
        
        await User.update(req.user.id, { avatar: req.file.filename });
        res.json({ 
            message: 'อัปโหลดรูปโปรไฟล์สำเร็จ', 
            avatar: req.file.filename 
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Change password
router.put('/password', verifyToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        // Get user
        const user = await User.getByUsername(req.user.username);

        // Verify current password
        const isValid = await User.verifyPassword(current_password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        // Update password
        await User.updatePassword(req.user.id, new_password);
        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
