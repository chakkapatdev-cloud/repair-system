const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'repair_system',
        multipleStatements: true
    };

    console.log('🔄 Connecting to database...');
    console.log(`   Host: ${config.host}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected successfully!');

        // Helper to remove CREATE DATABASE and USE statements
        const cleanSQL = (sql) => {
            return sql.split('\n')
                .filter(line => !line.trim().toUpperCase().startsWith('CREATE DATABASE'))
                .filter(line => !line.trim().toUpperCase().startsWith('USE '))
                .join('\n');
        };

        // 1. Run schema.sql
        console.log('📄 Reading schema.sql...');
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        schemaSQL = cleanSQL(schemaSQL);

        console.log('🚀 Executing schema.sql...');
        await connection.query(schemaSQL);
        console.log('✅ Schema initialized!');

        // 2. Run schema_extended.sql (if exists)
        const extendedPath = path.join(__dirname, '../database/schema_extended.sql');
        if (fs.existsSync(extendedPath)) {
            console.log('📄 Reading schema_extended.sql...');
            let extendedSQL = fs.readFileSync(extendedPath, 'utf8');
            extendedSQL = cleanSQL(extendedSQL);
            
            console.log('🚀 Executing schema_extended.sql...');
            await connection.query(extendedSQL);
            console.log('✅ Extended schema initialized!');
        }

        console.log('🎉 Database setup complete!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
}

initDB();
