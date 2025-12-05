const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all equipment
router.get('/', verifyToken, async (req, res) => {
    try {
        const equipment = await Equipment.getAll(req.query);
        res.json(equipment);
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get equipment by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const equipment = await Equipment.getById(req.params.id);
        if (!equipment) {
            return res.status(404).json({ message: 'ไม่พบอุปกรณ์' });
        }
        res.json(equipment);
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get equipment by code (for QR scan)
router.get('/code/:code', verifyToken, async (req, res) => {
    try {
        const equipment = await Equipment.getByCode(req.params.code);
        if (!equipment) {
            return res.status(404).json({ message: 'ไม่พบอุปกรณ์' });
        }
        res.json(equipment);
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get repair history for equipment
router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const history = await Equipment.getRepairHistory(req.params.id);
        res.json(history);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create equipment (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const id = await Equipment.create(req.body);
        res.status(201).json({ message: 'เพิ่มอุปกรณ์สำเร็จ', id });
    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update equipment (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await Equipment.update(req.params.id, req.body);
        res.json({ message: 'อัปเดตอุปกรณ์สำเร็จ' });
    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Generate QR Code
router.post('/:id/qrcode', verifyToken, isAdmin, async (req, res) => {
    try {
        const qrCode = await Equipment.generateQRCode(req.params.id);
        if (!qrCode) {
            return res.status(404).json({ message: 'ไม่พบอุปกรณ์' });
        }
        res.json({ qr_code: qrCode });
    } catch (error) {
        console.error('Generate QR error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete equipment (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await Equipment.delete(req.params.id);
        res.json({ message: 'ลบอุปกรณ์สำเร็จ' });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
