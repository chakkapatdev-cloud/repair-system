const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const RepairRequest = require('../models/RepairRequest');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { verifyToken, isAdmin, isTechnician } = require('../middleware/auth');
const pool = require('../config/db');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพและ PDF เท่านั้น'));
    }
});

// Get all repair requests
router.get('/', verifyToken, async (req, res) => {
    try {
        const filters = { ...req.query };
        if (req.user.role === 'user') filters.requester_id = req.user.id;
        else if (req.user.role === 'technician' && req.query.assigned) filters.technician_id = req.user.id;
        const requests = await RepairRequest.getAll(filters);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get categories
router.get('/categories', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get single repair request with costs
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const repair = await RepairRequest.getById(req.params.id);
        if (!repair) return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อม' });

        const files = await RepairRequest.getFiles(repair.id);
        const history = await RepairRequest.getHistory(repair.id);
        const comments = await Comment.getByRepairId(repair.id);
        const [costs] = await pool.query('SELECT * FROM repair_costs WHERE repair_id = ?', [repair.id]);
        
        let team_name = null;
        if (repair.team_id) {
            const [team] = await pool.query('SELECT name FROM teams WHERE id = ?', [repair.team_id]);
            team_name = team[0]?.name;
        }

        res.json({ ...repair, files, history, comments, costs, team_name });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create repair request
router.post('/', verifyToken, upload.array('files', 5), async (req, res) => {
    try {
        const { title, description, location, category_id, priority, equipment_id } = req.body;

        const result = await RepairRequest.create({
            title, description, location, category_id, priority,
            requester_id: req.user.id,
            equipment_id: equipment_id || null
        });

        if (req.files?.length > 0) {
            for (const file of req.files) {
                await RepairRequest.addFile(result.id, {
                    file_name: file.originalname,
                    file_path: file.filename,
                    file_type: file.mimetype,
                    file_size: file.size
                });
            }
        }

        const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
        for (const admin of admins) {
            await Notification.create({
                user_id: admin.id,
                title: 'มีรายการแจ้งซ่อมใหม่',
                message: `${result.request_no}: ${title}`,
                link: `/repairs/${result.id}`
            });
        }

        res.status(201).json({ message: 'สร้างรายการแจ้งซ่อมสำเร็จ', id: result.id, request_no: result.request_no });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update repair request
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const repair = await RepairRequest.getById(req.params.id);
        if (!repair) return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อม' });
        if (repair.requester_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไข' });
        }
        const { title, description, location, category_id, priority } = req.body;
        await RepairRequest.update(req.params.id, { title, description, location, category_id, priority });
        res.json({ message: 'อัปเดตรายการสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update status with SLA tracking
router.put('/:id/status', verifyToken, isTechnician, async (req, res) => {
    try {
        const { status, note } = req.body;
        const repair = await RepairRequest.getById(req.params.id);
        if (!repair) return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อม' });

        await RepairRequest.updateStatus(req.params.id, status, req.user.id, note);

        // Update SLA fields on accepted
        if (status === 'accepted' && !repair.response_at) {
            const [sla] = await pool.query('SELECT * FROM sla_settings WHERE priority = ?', [repair.priority]);
            if (sla.length > 0) {
                const hoursElapsed = (new Date() - new Date(repair.created_at)) / (1000 * 60 * 60);
                const sla_response_met = hoursElapsed <= sla[0].response_time_hours;
                await pool.query('UPDATE repair_requests SET response_at = NOW(), sla_response_met = ? WHERE id = ?', 
                    [sla_response_met, req.params.id]);
            }
        }

        // Update SLA fields on completed
        if (status === 'completed') {
            const [sla] = await pool.query('SELECT * FROM sla_settings WHERE priority = ?', [repair.priority]);
            if (sla.length > 0) {
                const hoursElapsed = (new Date() - new Date(repair.created_at)) / (1000 * 60 * 60);
                const sla_resolution_met = hoursElapsed <= sla[0].resolution_time_hours;
                await pool.query('UPDATE repair_requests SET completed_at = NOW(), sla_resolution_met = ? WHERE id = ?', 
                    [sla_resolution_met, req.params.id]);
            }
        }

        await Notification.notifyStatusChange(repair, status, req.user.id);
        res.json({ message: 'อัปเดตสถานะสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Assign technician and/or team
router.put('/:id/assign', verifyToken, isAdmin, async (req, res) => {
    try {
        const { technician_id, team_id } = req.body;
        const repair = await RepairRequest.getById(req.params.id);
        if (!repair) return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อม' });

        if (technician_id) {
            await RepairRequest.assignTechnician(req.params.id, technician_id, req.user.id);
            await Notification.create({
                user_id: technician_id,
                title: 'คุณได้รับมอบหมายงานใหม่',
                message: `${repair.request_no}: ${repair.title}`,
                link: `/repairs/${repair.id}`
            });
        }
        if (team_id) {
            await pool.query('UPDATE repair_requests SET team_id = ? WHERE id = ?', [team_id, req.params.id]);
        }

        res.json({ message: 'มอบหมายงานสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Upload after photos (multiple)
router.post('/:id/after-photo', verifyToken, isTechnician, upload.array('after_images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'กรุณาเลือกไฟล์' });
        }
        
        // Save each file to repair_files with file_type 'after'
        for (const file of req.files) {
            await pool.query(
                `INSERT INTO repair_files (repair_id, file_name, file_path, file_type, file_size) 
                 VALUES (?, ?, ?, 'after', ?)`,
                [req.params.id, file.originalname, file.filename, file.size]
            );
        }
        
        // Also update after_image field for backward compatibility (first image)
        await pool.query('UPDATE repair_requests SET after_image = ? WHERE id = ?', 
            [req.files[0].filename, req.params.id]);
        
        res.json({ message: `อัปโหลดรูปสำเร็จ ${req.files.length} รูป` });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Add repair cost
router.post('/:id/costs', verifyToken, isTechnician, async (req, res) => {
    try {
        const { part_id, part_name, quantity, unit_cost, labor_cost, other_cost, note } = req.body;
        
        await pool.query(
            `INSERT INTO repair_costs (repair_id, part_id, part_name, quantity, unit_cost, labor_cost, other_cost, note) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, part_id || null, part_name, quantity, unit_cost, labor_cost || 0, other_cost || 0, note]
        );

        // Update total cost
        const [costs] = await pool.query(
            'SELECT SUM((quantity * unit_cost) + labor_cost + other_cost) as total FROM repair_costs WHERE repair_id = ?',
            [req.params.id]
        );
        await pool.query('UPDATE repair_requests SET total_cost = ? WHERE id = ?', [costs[0].total || 0, req.params.id]);

        // Deduct from spare parts
        if (part_id) {
            await pool.query('UPDATE spare_parts SET quantity = quantity - ? WHERE id = ?', [quantity, part_id]);
        }

        res.status(201).json({ message: 'เพิ่มค่าใช้จ่ายสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Add rating
router.put('/:id/rate', verifyToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const repair = await RepairRequest.getById(req.params.id);
        if (!repair) return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อม' });
        if (repair.requester_id !== req.user.id) return res.status(403).json({ message: 'ไม่มีสิทธิ์ให้คะแนน' });
        await RepairRequest.addRating(req.params.id, rating, comment);
        res.json({ message: 'ให้คะแนนสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Add comment
router.post('/:id/comments', verifyToken, async (req, res) => {
    try {
        await Comment.create({ repair_id: req.params.id, user_id: req.user.id, content: req.body.content });
        res.status(201).json({ message: 'เพิ่มความคิดเห็นสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete repair request
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const repair = await RepairRequest.getById(req.params.id);
        if (!repair) return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อม' });
        if (repair.requester_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์ลบ' });
        }
        await RepairRequest.delete(req.params.id);
        res.json({ message: 'ลบรายการสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
