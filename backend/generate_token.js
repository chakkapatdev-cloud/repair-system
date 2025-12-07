const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'dev_secret_key_123456';

const payload = {
    id: 5,
    role: 'admin',
    username: 'admin2',
    email: 'admin2@cmms.local'
};

const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('---------------------------------------------------');
console.log('✅ Token Generated Successfully');
console.log('---------------------------------------------------');
console.log(token);
console.log('---------------------------------------------------');
