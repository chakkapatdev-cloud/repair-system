const pool = require('../config/db');

class Team {
    // Get all teams
    static async getAll() {
        const [rows] = await pool.query(`
            SELECT t.*, u.full_name as leader_name,
                   (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
            FROM teams t
            LEFT JOIN users u ON t.leader_id = u.id
            ORDER BY t.name
        `);
        return rows;
    }

    // Get by ID with members
    static async getById(id) {
        const [teams] = await pool.query(`
            SELECT t.*, u.full_name as leader_name
            FROM teams t
            LEFT JOIN users u ON t.leader_id = u.id
            WHERE t.id = ?
        `, [id]);

        if (!teams[0]) return null;

        const [members] = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.phone, tm.joined_at
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = ?
        `, [id]);

        return { ...teams[0], members };
    }

    // Create team
    static async create(data) {
        const [result] = await pool.query(
            'INSERT INTO teams (name, description, leader_id) VALUES (?, ?, ?)',
            [data.name, data.description, data.leader_id]
        );
        return result.insertId;
    }

    // Update team
    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.name) { fields.push('name = ?'); values.push(data.name); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.leader_id) { fields.push('leader_id = ?'); values.push(data.leader_id); }

        if (fields.length === 0) return false;

        values.push(id);
        await pool.query(`UPDATE teams SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    // Delete team
    static async delete(id) {
        await pool.query('DELETE FROM teams WHERE id = ?', [id]);
        return true;
    }

    // Add member
    static async addMember(teamId, userId) {
        await pool.query(
            'INSERT IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)',
            [teamId, userId]
        );
        return true;
    }

    // Remove member
    static async removeMember(teamId, userId) {
        await pool.query(
            'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );
        return true;
    }

    // Get teams for user
    static async getTeamsForUser(userId) {
        const [rows] = await pool.query(`
            SELECT t.*
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = ?
        `, [userId]);
        return rows;
    }
}

module.exports = Team;
