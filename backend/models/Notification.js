const pool = require('../config/db');

class Notification {
    // Get notifications for a user
    static async getByUserId(userId, limit = 20) {
        const [rows] = await pool.query(`
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `, [userId, limit]);
        return rows;
    }

    // Get unread count
    static async getUnreadCount(userId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        return rows[0].count;
    }

    // Create notification
    static async create(data) {
        const [result] = await pool.query(
            'INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)',
            [data.user_id, data.title, data.message, data.link]
        );
        return result.insertId;
    }

    // Mark as read
    static async markAsRead(id) {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
        return true;
    }

    // Mark all as read
    static async markAllAsRead(userId) {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
        return true;
    }

    // Delete notification
    static async delete(id) {
        await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
        return true;
    }

    // Create notification for repair status change
    static async notifyStatusChange(repairRequest, newStatus, updatedBy) {
        const statusMessages = {
            'accepted': 'รายการแจ้งซ่อมถูกรับเรื่องแล้ว',
            'in_progress': 'กำลังดำเนินการซ่อม',
            'completed': 'การซ่อมเสร็จสิ้นแล้ว',
            'cancelled': 'รายการแจ้งซ่อมถูกยกเลิก'
        };

        // Notify requester
        await this.create({
            user_id: repairRequest.requester_id,
            title: `อัปเดตสถานะ: ${repairRequest.request_no}`,
            message: statusMessages[newStatus] || `สถานะเปลี่ยนเป็น ${newStatus}`,
            link: `/repairs/${repairRequest.id}`
        });
    }
}

module.exports = Notification;
