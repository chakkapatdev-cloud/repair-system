const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const pool = require('../config/db');

// Get all checklist templates
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ct.*, c.name as category_name 
            FROM checklist_templates ct
            LEFT JOIN categories c ON ct.category_id = c.id
            ORDER BY ct.created_at DESC
        `);
        res.json(rows.map(r => ({...r, steps: r.steps ? JSON.parse(r.steps) : []})));
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get by id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM checklist_templates WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        const template = rows[0];
        template.steps = template.steps ? JSON.parse(template.steps) : [];
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, description, category_id, steps } = req.body;
        const [result] = await pool.query(
            'INSERT INTO checklist_templates (name, description, category_id, steps) VALUES (?, ?, ?, ?)',
            [name, description, category_id || null, JSON.stringify(steps || [])]
        );
        res.status(201).json({ message: 'สร้างสำเร็จ', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, description, category_id, steps, is_active } = req.body;
        await pool.query(
            'UPDATE checklist_templates SET name = ?, description = ?, category_id = ?, steps = ?, is_active = ? WHERE id = ?',
            [name, description, category_id || null, JSON.stringify(steps || []), is_active !== false, req.params.id]
        );
        res.json({ message: 'อัปเดตสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM checklist_templates WHERE id = ?', [req.params.id]);
        res.json({ message: 'ลบสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
