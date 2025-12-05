const pool = require('../config/db');

class SparePart {
    // Get all spare parts
    static async getAll(filters = {}) {
        let query = 'SELECT * FROM spare_parts WHERE 1=1';
        const params = [];

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }
        if (filters.low_stock) {
            query += ' AND quantity <= min_quantity';
        }
        if (filters.search) {
            query += ' AND (name LIKE ? OR part_code LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY name';
        const [rows] = await pool.query(query, params);
        return rows;
    }

    // Get by ID
    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM spare_parts WHERE id = ?', [id]);
        return rows[0];
    }

    // Create spare part
    static async create(data) {
        const [result] = await pool.query(
            `INSERT INTO spare_parts 
             (part_code, name, description, category, quantity, min_quantity, unit, unit_cost, location) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.part_code, data.name, data.description, data.category,
             data.quantity || 0, data.min_quantity || 5, data.unit || 'ชิ้น',
             data.unit_cost || 0, data.location]
        );
        return result.insertId;
    }

    // Update spare part
    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.name) { fields.push('name = ?'); values.push(data.name); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.category) { fields.push('category = ?'); values.push(data.category); }
        if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }
        if (data.min_quantity !== undefined) { fields.push('min_quantity = ?'); values.push(data.min_quantity); }
        if (data.unit) { fields.push('unit = ?'); values.push(data.unit); }
        if (data.unit_cost !== undefined) { fields.push('unit_cost = ?'); values.push(data.unit_cost); }
        if (data.location) { fields.push('location = ?'); values.push(data.location); }

        if (fields.length === 0) return false;

        values.push(id);
        await pool.query(`UPDATE spare_parts SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    // Adjust quantity
    static async adjustQuantity(id, adjustment, reason = '') {
        await pool.query(
            'UPDATE spare_parts SET quantity = quantity + ? WHERE id = ?',
            [adjustment, id]
        );
        return true;
    }

    // Delete spare part
    static async delete(id) {
        await pool.query('DELETE FROM spare_parts WHERE id = ?', [id]);
        return true;
    }

    // Get low stock items
    static async getLowStock() {
        const [rows] = await pool.query(
            'SELECT * FROM spare_parts WHERE quantity <= min_quantity ORDER BY quantity'
        );
        return rows;
    }

    // Get categories
    static async getCategories() {
        const [rows] = await pool.query(
            'SELECT DISTINCT category FROM spare_parts ORDER BY category'
        );
        return rows.map(r => r.category);
    }
}

module.exports = SparePart;
