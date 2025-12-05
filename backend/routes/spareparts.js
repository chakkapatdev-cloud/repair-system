const express = require('express');
const router = express.Router();
const SparePart = require('../models/SparePart');
const { verifyToken, isAdmin, isTechnician } = require('../middleware/auth');

// Get all spare parts
router.get('/', verifyToken, async (req, res) => {
    try {
        const parts = await SparePart.getAll(req.query);
        res.json(parts);
    } catch (error) {
        console.error('Get spare parts error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get low stock items
router.get('/low-stock', verifyToken, async (req, res) => {
    try {
        const parts = await SparePart.getLowStock();
        res.json(parts);
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get categories
router.get('/categories', verifyToken, async (req, res) => {
    try {
        const categories = await SparePart.getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const part = await SparePart.getById(req.params.id);
        if (!part) {
            return res.status(404).json({ message: 'ไม่พบอะไหล่' });
        }
        res.json(part);
    } catch (error) {
        console.error('Get spare part error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create spare part (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const id = await SparePart.create(req.body);
        res.status(201).json({ message: 'เพิ่มอะไหล่สำเร็จ', id });
    } catch (error) {
        console.error('Create spare part error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update spare part (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await SparePart.update(req.params.id, req.body);
        res.json({ message: 'อัปเดตอะไหล่สำเร็จ' });
    } catch (error) {
        console.error('Update spare part error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Adjust quantity (Technician can adjust)
router.post('/:id/adjust', verifyToken, isTechnician, async (req, res) => {
    try {
        const { adjustment, reason } = req.body;
        await SparePart.adjustQuantity(req.params.id, adjustment, reason);
        res.json({ message: 'ปรับจำนวนสำเร็จ' });
    } catch (error) {
        console.error('Adjust quantity error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete spare part (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await SparePart.delete(req.params.id);
        res.json({ message: 'ลบอะไหล่สำเร็จ' });
    } catch (error) {
        console.error('Delete spare part error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
