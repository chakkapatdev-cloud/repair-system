const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const pool = require('../config/db');

// Get dashboard statistics
router.get('/stats', verifyToken, async (req, res) => {
    try {
        // Total requests
        const [totalResult] = await pool.query('SELECT COUNT(*) as count FROM repair_requests');
        
        // Requests by status
        const [statusResult] = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM repair_requests 
            GROUP BY status
        `);

        // Requests by priority
        const [priorityResult] = await pool.query(`
            SELECT priority, COUNT(*) as count 
            FROM repair_requests 
            GROUP BY priority
        `);

        // Requests by category
        const [categoryResult] = await pool.query(`
            SELECT c.name, COUNT(r.id) as count 
            FROM categories c
            LEFT JOIN repair_requests r ON c.id = r.category_id
            GROUP BY c.id, c.name
        `);

        // Today's requests
        const [todayResult] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM repair_requests 
            WHERE DATE(created_at) = CURDATE()
        `);

        // This month's requests
        const [monthResult] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM repair_requests 
            WHERE MONTH(created_at) = MONTH(CURDATE()) 
            AND YEAR(created_at) = YEAR(CURDATE())
        `);

        // Pending count
        const [pendingResult] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM repair_requests 
            WHERE status = 'pending'
        `);

        // In progress count
        const [inProgressResult] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM repair_requests 
            WHERE status = 'in_progress'
        `);

        // Completed this month
        const [completedMonthResult] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM repair_requests 
            WHERE status = 'completed'
            AND MONTH(completed_at) = MONTH(CURDATE()) 
            AND YEAR(completed_at) = YEAR(CURDATE())
        `);

        // Average rating
        const [ratingResult] = await pool.query(`
            SELECT AVG(rating) as average 
            FROM repair_requests 
            WHERE rating IS NOT NULL
        `);

        res.json({
            total: totalResult[0].count,
            today: todayResult[0].count,
            thisMonth: monthResult[0].count,
            pending: pendingResult[0].count,
            inProgress: inProgressResult[0].count,
            completedThisMonth: completedMonthResult[0].count,
            averageRating: ratingResult[0].average ? parseFloat(ratingResult[0].average).toFixed(1) : null,
            byStatus: statusResult,
            byPriority: priorityResult,
            byCategory: categoryResult
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get chart data (requests per day in last 30 days)
router.get('/chart', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM repair_requests
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        res.json(rows);
    } catch (error) {
        console.error('Get chart data error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get recent repairs
router.get('/recent', verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const [rows] = await pool.query(`
            SELECT r.id, r.request_no, r.title, r.status, r.priority, r.created_at,
                   u.full_name as requester_name,
                   c.name as category_name, c.color as category_color
            FROM repair_requests r
            LEFT JOIN users u ON r.requester_id = u.id
            LEFT JOIN categories c ON r.category_id = c.id
            ORDER BY r.created_at DESC
            LIMIT ?
        `, [limit]);

        res.json(rows);
    } catch (error) {
        console.error('Get recent repairs error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Get technician performance
router.get('/technician-stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.full_name,
                   COUNT(r.id) as total_assigned,
                   SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed,
                   SUM(CASE WHEN r.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                   AVG(r.rating) as avg_rating
            FROM users u
            LEFT JOIN repair_requests r ON u.id = r.technician_id
            WHERE u.role = 'technician'
            GROUP BY u.id, u.full_name
        `);

        res.json(rows);
    } catch (error) {
        console.error('Get technician stats error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
