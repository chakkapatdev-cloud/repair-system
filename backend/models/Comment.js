const pool = require('../config/db');

class Comment {
    // Get comments for a repair request
    static async getByRepairId(repairId) {
        const [rows] = await pool.query(`
            SELECT c.*, u.full_name as user_name, u.avatar as user_avatar, u.role as user_role
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.repair_id = ?
            ORDER BY c.created_at ASC
        `, [repairId]);
        return rows;
    }

    // Create new comment
    static async create(data) {
        const [result] = await pool.query(
            'INSERT INTO comments (repair_id, user_id, content) VALUES (?, ?, ?)',
            [data.repair_id, data.user_id, data.content]
        );
        return result.insertId;
    }

    // Delete comment
    static async delete(id) {
        await pool.query('DELETE FROM comments WHERE id = ?', [id]);
        return true;
    }
}

module.exports = Comment;
