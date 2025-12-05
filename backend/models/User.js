const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // Get all users
    static async getAll() {
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.full_name, u.email, u.phone, u.avatar, 
                   u.role, u.department_id, d.name as department_name, u.is_active, u.created_at
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ORDER BY u.created_at DESC
        `);
        return rows;
    }

    // Get user by ID
    static async getById(id) {
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.full_name, u.email, u.phone, u.avatar, 
                   u.role, u.department_id, d.name as department_name, u.is_active, u.created_at
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ?
        `, [id]);
        return rows[0];
    }

    // Get user by username
    static async getByUsername(username) {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    // Create new user
    static async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (username, password, full_name, email, phone, role, department_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userData.username, hashedPassword, userData.full_name, userData.email, 
             userData.phone, userData.role || 'user', userData.department_id]
        );
        return result.insertId;
    }

    // Update user
    static async update(id, userData) {
        const fields = [];
        const values = [];
        
        if (userData.full_name) { fields.push('full_name = ?'); values.push(userData.full_name); }
        if (userData.email) { fields.push('email = ?'); values.push(userData.email); }
        if (userData.phone) { fields.push('phone = ?'); values.push(userData.phone); }
        if (userData.role) { fields.push('role = ?'); values.push(userData.role); }
        if (userData.department_id) { fields.push('department_id = ?'); values.push(userData.department_id); }
        if (userData.is_active !== undefined) { fields.push('is_active = ?'); values.push(userData.is_active); }
        if (userData.avatar) { fields.push('avatar = ?'); values.push(userData.avatar); }

        if (fields.length === 0) return false;

        values.push(id);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    // Update password
    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        return true;
    }

    // Delete user
    static async delete(id) {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return true;
    }

    // Get all technicians
    static async getTechnicians() {
        const [rows] = await pool.query(`
            SELECT id, username, full_name, email, phone 
            FROM users 
            WHERE role = 'technician' AND is_active = TRUE
        `);
        return rows;
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;
