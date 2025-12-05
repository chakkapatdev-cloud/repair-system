const pool = require('../config/db');

class RepairRequest {
    // Generate request number
    static async generateRequestNo() {
        const date = new Date();
        const prefix = `REP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM repair_requests WHERE request_no LIKE ?',
            [`${prefix}%`]
        );
        const count = rows[0].count + 1;
        return `${prefix}${String(count).padStart(4, '0')}`;
    }

    // Get all requests with filters
    static async getAll(filters = {}) {
        let query = `
            SELECT r.*, 
                   c.name as category_name, c.icon as category_icon, c.color as category_color,
                   u1.full_name as requester_name, u1.department_id,
                   d.name as department_name,
                   u2.full_name as technician_name
            FROM repair_requests r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN users u1 ON r.requester_id = u1.id
            LEFT JOIN departments d ON u1.department_id = d.id
            LEFT JOIN users u2 ON r.technician_id = u2.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND r.status = ?';
            params.push(filters.status);
        }
        if (filters.priority) {
            query += ' AND r.priority = ?';
            params.push(filters.priority);
        }
        if (filters.category_id) {
            query += ' AND r.category_id = ?';
            params.push(filters.category_id);
        }
        if (filters.requester_id) {
            query += ' AND r.requester_id = ?';
            params.push(filters.requester_id);
        }
        if (filters.technician_id) {
            query += ' AND r.technician_id = ?';
            params.push(filters.technician_id);
        }
        if (filters.search) {
            query += ' AND (r.title LIKE ? OR r.description LIKE ? OR r.request_no LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY r.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // Get by ID with full details
    static async getById(id) {
        const [rows] = await pool.query(`
            SELECT r.*, 
                   c.name as category_name, c.icon as category_icon, c.color as category_color,
                   u1.full_name as requester_name, u1.email as requester_email, u1.phone as requester_phone,
                   d.name as department_name,
                   u2.full_name as technician_name, u2.email as technician_email, u2.phone as technician_phone
            FROM repair_requests r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN users u1 ON r.requester_id = u1.id
            LEFT JOIN departments d ON u1.department_id = d.id
            LEFT JOIN users u2 ON r.technician_id = u2.id
            WHERE r.id = ?
        `, [id]);
        return rows[0];
    }

    // Create new request
    static async create(data) {
        const requestNo = await this.generateRequestNo();
        const [result] = await pool.query(
            `INSERT INTO repair_requests 
             (request_no, title, description, location, category_id, priority, requester_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [requestNo, data.title, data.description, data.location, 
             data.category_id, data.priority || 'medium', data.requester_id]
        );
        return { id: result.insertId, request_no: requestNo };
    }

    // Update request
    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.title) { fields.push('title = ?'); values.push(data.title); }
        if (data.description) { fields.push('description = ?'); values.push(data.description); }
        if (data.location) { fields.push('location = ?'); values.push(data.location); }
        if (data.category_id) { fields.push('category_id = ?'); values.push(data.category_id); }
        if (data.priority) { fields.push('priority = ?'); values.push(data.priority); }

        if (fields.length === 0) return false;

        values.push(id);
        await pool.query(`UPDATE repair_requests SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    // Update status
    static async updateStatus(id, status, userId, note = null) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get current status
            const [current] = await connection.query(
                'SELECT status FROM repair_requests WHERE id = ?', [id]
            );
            const oldStatus = current[0]?.status;

            // Update status
            let updateQuery = 'UPDATE repair_requests SET status = ?';
            const updateParams = [status];

            if (status === 'accepted') {
                updateQuery += ', accepted_at = NOW()';
            } else if (status === 'completed') {
                updateQuery += ', completed_at = NOW()';
            }

            updateQuery += ' WHERE id = ?';
            updateParams.push(id);

            await connection.query(updateQuery, updateParams);

            // Add to history
            await connection.query(
                `INSERT INTO repair_history (repair_id, old_status, new_status, note, updated_by) 
                 VALUES (?, ?, ?, ?, ?)`,
                [id, oldStatus, status, note, userId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Assign technician
    static async assignTechnician(id, technicianId, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                'UPDATE repair_requests SET technician_id = ?, status = ? WHERE id = ?',
                [technicianId, 'accepted', id]
            );

            await connection.query(
                `INSERT INTO repair_history (repair_id, old_status, new_status, note, updated_by) 
                 VALUES (?, 'pending', 'accepted', 'มอบหมายช่างแล้ว', ?)`,
                [id, userId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Add rating
    static async addRating(id, rating, comment) {
        await pool.query(
            'UPDATE repair_requests SET rating = ?, rating_comment = ? WHERE id = ?',
            [rating, comment, id]
        );
        return true;
    }

    // Delete request
    static async delete(id) {
        await pool.query('DELETE FROM repair_requests WHERE id = ?', [id]);
        return true;
    }

    // Get history
    static async getHistory(repairId) {
        const [rows] = await pool.query(`
            SELECT h.*, u.full_name as updated_by_name
            FROM repair_history h
            LEFT JOIN users u ON h.updated_by = u.id
            WHERE h.repair_id = ?
            ORDER BY h.created_at ASC
        `, [repairId]);
        return rows;
    }

    // Get files
    static async getFiles(repairId) {
        const [rows] = await pool.query(
            'SELECT * FROM repair_files WHERE repair_id = ?',
            [repairId]
        );
        return rows;
    }

    // Add file
    static async addFile(repairId, fileData) {
        const [result] = await pool.query(
            `INSERT INTO repair_files (repair_id, file_name, file_path, file_type, file_size) 
             VALUES (?, ?, ?, ?, ?)`,
            [repairId, fileData.file_name, fileData.file_path, fileData.file_type, fileData.file_size]
        );
        return result.insertId;
    }
}

module.exports = RepairRequest;
