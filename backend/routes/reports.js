const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { verifyToken, isAdmin } = require('../middleware/auth');
const pool = require('../config/db');

// Export repairs to Excel
router.post('/excel', verifyToken, isAdmin, async (req, res) => {
    try {
        const { start_date, end_date, status } = req.body;
        
        let query = `
            SELECT r.request_no, r.title, r.description, r.location, r.priority, r.status,
                   r.created_at, r.completed_at, r.total_cost,
                   c.name as category_name,
                   u1.full_name as requester_name,
                   u2.full_name as technician_name,
                   r.rating
            FROM repair_requests r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN users u1 ON r.requester_id = u1.id
            LEFT JOIN users u2 ON r.technician_id = u2.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(r.created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(r.created_at) <= ?';
            params.push(end_date);
        }
        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.created_at DESC';

        const [rows] = await pool.query(query, params);

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('รายการแจ้งซ่อม');

        // Add headers
        worksheet.columns = [
            { header: 'เลขที่', key: 'request_no', width: 15 },
            { header: 'หัวข้อ', key: 'title', width: 30 },
            { header: 'หมวดหมู่', key: 'category_name', width: 15 },
            { header: 'สถานที่', key: 'location', width: 20 },
            { header: 'ความเร่งด่วน', key: 'priority', width: 12 },
            { header: 'สถานะ', key: 'status', width: 15 },
            { header: 'ผู้แจ้ง', key: 'requester_name', width: 20 },
            { header: 'ช่าง', key: 'technician_name', width: 20 },
            { header: 'วันที่แจ้ง', key: 'created_at', width: 18 },
            { header: 'วันที่เสร็จ', key: 'completed_at', width: 18 },
            { header: 'ค่าใช้จ่าย', key: 'total_cost', width: 12 },
            { header: 'คะแนน', key: 'rating', width: 10 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4F46E5' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFF' }, bold: true };

        // Add data
        rows.forEach(row => {
            worksheet.addRow({
                ...row,
                created_at: row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '',
                completed_at: row.completed_at ? new Date(row.completed_at).toLocaleString('th-TH') : ''
            });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=repairs_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Excel error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

const path = require('path');
const fs = require('fs');

// ... existing imports ...

// Export repairs to PDF
router.post('/pdf', verifyToken, isAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.body;
        
        let query = `
            SELECT r.*, c.name as category_name, u1.full_name as requester_name
            FROM repair_requests r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN users u1 ON r.requester_id = u1.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(r.created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(r.created_at) <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY r.created_at DESC LIMIT 100';

        const [rows] = await pool.query(query, params);

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=repairs_report.pdf');
        
        doc.pipe(res);

        // Register Thai font if exists
        const fontPath = path.join(__dirname, '../assets/fonts/Sarabun-Regular.ttf');
        let hasThaiFont = false;
        if (fs.existsSync(fontPath)) {
            doc.registerFont('Thai', fontPath);
            doc.font('Thai');
            hasThaiFont = true;
        }

        // Title
        doc.fontSize(20).text('รายการแจ้งซ่อม (Repair Report)', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString('th-TH')}`, { align: 'center' });
        doc.moveDown(2);

        // Table
        rows.forEach((row, index) => {
            if (doc.y > 700) {
                doc.addPage();
                if (hasThaiFont) doc.font('Thai');
            }
            
            doc.fontSize(10)
               .text(`${index + 1}. ${row.request_no} - ${row.title}`, { continued: false })
               .text(`   สถานะ: ${row.status} | ความเร่งด่วน: ${row.priority}`)
               .text(`   สถานที่: ${row.location || '-'}`)
               .moveDown(0.5);
        });

        doc.end();
    } catch (error) {
        console.error('Export PDF error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Monthly report
router.get('/monthly', verifyToken, isAdmin, async (req, res) => {
    try {
        const { year, month } = req.query;
        const targetYear = year || new Date().getFullYear();
        const targetMonth = month || new Date().getMonth() + 1;

        // Get monthly stats
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                AVG(rating) as avg_rating,
                SUM(total_cost) as total_cost
            FROM repair_requests
            WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
        `, [targetYear, targetMonth]);

        // Get by category
        const [byCategory] = await pool.query(`
            SELECT c.name, COUNT(r.id) as count
            FROM categories c
            LEFT JOIN repair_requests r ON c.id = r.category_id 
                AND YEAR(r.created_at) = ? AND MONTH(r.created_at) = ?
            GROUP BY c.id, c.name
        `, [targetYear, targetMonth]);

        // Get by priority
        const [byPriority] = await pool.query(`
            SELECT priority, COUNT(*) as count
            FROM repair_requests
            WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
            GROUP BY priority
        `, [targetYear, targetMonth]);

        // Get daily breakdown
        const [daily] = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM repair_requests
            WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
            GROUP BY DATE(created_at)
            ORDER BY date
        `, [targetYear, targetMonth]);

        // Top technicians
        const [topTechnicians] = await pool.query(`
            SELECT u.full_name, COUNT(r.id) as completed, AVG(r.rating) as avg_rating
            FROM users u
            JOIN repair_requests r ON u.id = r.technician_id
            WHERE r.status = 'completed' 
                AND YEAR(r.completed_at) = ? AND MONTH(r.completed_at) = ?
            GROUP BY u.id, u.full_name
            ORDER BY completed DESC
            LIMIT 10
        `, [targetYear, targetMonth]);

        res.json({
            year: targetYear,
            month: targetMonth,
            stats: stats[0],
            byCategory,
            byPriority,
            daily,
            topTechnicians
        });
    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// SLA Report - Allow all authenticated users to see SLA settings
router.get('/sla', verifyToken, async (req, res) => {
    try {
        const [slaStats] = await pool.query(`
            SELECT 
                priority,
                COUNT(*) as total,
                SUM(CASE WHEN sla_response_met = TRUE THEN 1 ELSE 0 END) as response_met,
                SUM(CASE WHEN sla_resolution_met = TRUE THEN 1 ELSE 0 END) as resolution_met
            FROM repair_requests
            WHERE status = 'completed'
            GROUP BY priority
        `);

        const [slaSettings] = await pool.query('SELECT * FROM sla_settings');

        res.json({ stats: slaStats, settings: slaSettings });
    } catch (error) {
        console.error('SLA report error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Trend analysis
router.get('/trends', verifyToken, isAdmin, async (req, res) => {
    try {
        // Last 12 months trend
        const [monthlyTrend] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM repair_requests
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month
        `);

        // Category trend
        const [categoryTrend] = await pool.query(`
            SELECT c.name, COUNT(r.id) as count
            FROM categories c
            LEFT JOIN repair_requests r ON c.id = r.category_id
                AND r.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
            GROUP BY c.id, c.name
            ORDER BY count DESC
        `);

        // Peak hours
        const [peakHours] = await pool.query(`
            SELECT HOUR(created_at) as hour, COUNT(*) as count
            FROM repair_requests
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY HOUR(created_at)
            ORDER BY hour
        `);

        res.json({ monthlyTrend, categoryTrend, peakHours });
    } catch (error) {
        console.error('Trends error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Technician leaderboard
router.get('/leaderboard', verifyToken, async (req, res) => {
    try {
        const [leaderboard] = await pool.query(`
            SELECT 
                u.id, u.full_name, u.avatar,
                COUNT(r.id) as total_jobs,
                SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed,
                AVG(r.rating) as avg_rating,
                AVG(TIMESTAMPDIFF(HOUR, r.created_at, r.completed_at)) as avg_resolution_hours
            FROM users u
            LEFT JOIN repair_requests r ON u.id = r.technician_id
            WHERE u.role = 'technician'
            GROUP BY u.id, u.full_name, u.avatar
            ORDER BY completed DESC, avg_rating DESC
        `);

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
