const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isTechnician } = require('../middleware/auth');
const pool = require('../config/db');

// Get all maintenance schedules
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT rm.*, 
                   e.name as equipment_name,
                   t.name as team_name,
                   u.full_name as technician_name
            FROM recurring_maintenance rm
            LEFT JOIN equipment e ON rm.equipment_id = e.id
            LEFT JOIN teams t ON rm.assigned_team_id = t.id
            LEFT JOIN users u ON rm.assigned_technician_id = u.id
            ORDER BY rm.next_due ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get by id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM recurring_maintenance WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, description, equipment_id, frequency, assigned_team_id, assigned_technician_id, next_due } = req.body;
        const [result] = await pool.query(
            `INSERT INTO recurring_maintenance (title, description, equipment_id, frequency, assigned_team_id, assigned_technician_id, next_due) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description, equipment_id || null, frequency, assigned_team_id || null, assigned_technician_id || null, next_due]
        );
        res.status(201).json({ message: 'สร้างสำเร็จ', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, description, equipment_id, frequency, assigned_team_id, assigned_technician_id, next_due, is_active } = req.body;
        await pool.query(
            `UPDATE recurring_maintenance SET title = ?, description = ?, equipment_id = ?, frequency = ?, 
             assigned_team_id = ?, assigned_technician_id = ?, next_due = ?, is_active = ? WHERE id = ?`,
            [title, description, equipment_id || null, frequency, assigned_team_id || null, 
             assigned_technician_id || null, next_due, is_active !== false, req.params.id]
        );
        res.json({ message: 'อัปเดตสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Run now - create repair request from maintenance
router.post('/:id/run', verifyToken, isTechnician, async (req, res) => {
    try {
        const [schedule] = await pool.query('SELECT * FROM recurring_maintenance WHERE id = ?', [req.params.id]);
        if (schedule.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        
        const s = schedule[0];
        
        // Generate request number
        const date = new Date();
        const prefix = `REP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const [count] = await pool.query("SELECT COUNT(*) as c FROM repair_requests WHERE request_no LIKE ?", [`${prefix}%`]);
        const request_no = `${prefix}-${String(count[0].c + 1).padStart(4, '0')}`;

        // Create repair request
        await pool.query(
            `INSERT INTO repair_requests (request_no, title, description, requester_id, technician_id, team_id, equipment_id, priority, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'medium', 'pending')`,
            [request_no, `[PM] ${s.title}`, s.description, req.user.id, s.assigned_technician_id, s.assigned_team_id, s.equipment_id]
        );

        // Calculate next due date
        const nextDue = new Date(s.next_due);
        switch(s.frequency) {
            case 'daily': nextDue.setDate(nextDue.getDate() + 1); break;
            case 'weekly': nextDue.setDate(nextDue.getDate() + 7); break;
            case 'monthly': nextDue.setMonth(nextDue.getMonth() + 1); break;
            case 'quarterly': nextDue.setMonth(nextDue.getMonth() + 3); break;
            case 'yearly': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
        }

        await pool.query('UPDATE recurring_maintenance SET last_done = NOW(), next_due = ? WHERE id = ?', 
            [nextDue.toISOString().split('T')[0], req.params.id]);

        res.json({ message: 'สร้างรายการซ่อมสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM recurring_maintenance WHERE id = ?', [req.params.id]);
        res.json({ message: 'ลบสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
