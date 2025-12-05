const pool = require('../config/db');
const QRCode = require('qrcode');

class Equipment {
    // Get all equipment
    static async getAll(filters = {}) {
        let query = `
            SELECT e.*, c.name as category_name, c.color as category_color
            FROM equipment e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND e.status = ?';
            params.push(filters.status);
        }
        if (filters.category_id) {
            query += ' AND e.category_id = ?';
            params.push(filters.category_id);
        }
        if (filters.building) {
            query += ' AND e.building = ?';
            params.push(filters.building);
        }
        if (filters.search) {
            query += ' AND (e.name LIKE ? OR e.equipment_code LIKE ? OR e.location LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY e.created_at DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // Get by ID
    static async getById(id) {
        const [rows] = await pool.query(`
            SELECT e.*, c.name as category_name
            FROM equipment e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.id = ?
        `, [id]);
        return rows[0];
    }

    // Get by code
    static async getByCode(code) {
        const [rows] = await pool.query(`
            SELECT e.*, c.name as category_name
            FROM equipment e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.equipment_code = ?
        `, [code]);
        return rows[0];
    }

    // Create equipment
    static async create(data) {
        const [result] = await pool.query(
            `INSERT INTO equipment 
             (equipment_code, name, description, location, building, floor, category_id, status, purchase_date, warranty_end) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.equipment_code, data.name, data.description, data.location, 
             data.building, data.floor, data.category_id, data.status || 'active',
             data.purchase_date, data.warranty_end]
        );
        
        // Generate QR Code
        const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/repairs/new?equipment=${data.equipment_code}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl);
        
        await pool.query('UPDATE equipment SET qr_code_url = ? WHERE id = ?', [qrCodeDataUrl, result.insertId]);
        
        return result.insertId;
    }

    // Update equipment
    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.name) { fields.push('name = ?'); values.push(data.name); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.location) { fields.push('location = ?'); values.push(data.location); }
        if (data.building) { fields.push('building = ?'); values.push(data.building); }
        if (data.floor) { fields.push('floor = ?'); values.push(data.floor); }
        if (data.category_id) { fields.push('category_id = ?'); values.push(data.category_id); }
        if (data.status) { fields.push('status = ?'); values.push(data.status); }

        if (fields.length === 0) return false;

        values.push(id);
        await pool.query(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    // Delete equipment
    static async delete(id) {
        await pool.query('DELETE FROM equipment WHERE id = ?', [id]);
        return true;
    }

    // Generate QR Code for equipment
    static async generateQRCode(id) {
        const equipment = await this.getById(id);
        if (!equipment) return null;

        const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/repairs/new?equipment=${equipment.equipment_code}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { width: 300 });
        
        await pool.query('UPDATE equipment SET qr_code_url = ? WHERE id = ?', [qrCodeDataUrl, id]);
        
        return qrCodeDataUrl;
    }

    // Get repair history for equipment
    static async getRepairHistory(id) {
        const [rows] = await pool.query(`
            SELECT r.*, u.full_name as requester_name
            FROM repair_requests r
            LEFT JOIN users u ON r.requester_id = u.id
            WHERE r.equipment_id = ?
            ORDER BY r.created_at DESC
        `, [id]);
        return rows;
    }
}

module.exports = Equipment;
