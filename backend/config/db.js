const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'repair_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection on startup
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully!');
        console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`   Database: ${process.env.DB_NAME || 'repair_system'}`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed!');
        console.error(`   Error: ${err.message}`);
        console.error('   Please check:');
        console.error('   1. MySQL server is running');
        console.error('   2. Database "repair_system" exists');
        console.error('   3. .env file has correct credentials');
    });

module.exports = pool;
