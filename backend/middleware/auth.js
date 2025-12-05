const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Check header first, then body (for form-based downloads)
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // Fallback to token in body (for form-based downloads that bypass IDM)
    if (!token && req.body && req.body.token) {
        token = req.body.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

// Check if user is Admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'ต้องเป็น Admin เท่านั้น' });
    }
    next();
};

// Check if user is Technician or Admin
const isTechnician = (req, res, next) => {
    if (req.user.role !== 'technician' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'ต้องเป็นช่างหรือ Admin เท่านั้น' });
    }
    next();
};

module.exports = { verifyToken, isAdmin, isTechnician };
