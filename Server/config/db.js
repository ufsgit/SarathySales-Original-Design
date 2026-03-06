const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sarathy_sales',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+05:30',
  charset: 'utf8mb4'
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log(`✅ MySQL connected → ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306} / ${process.env.DB_NAME || 'sarathy_sales'}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed!');
    console.error(`   Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    console.error(`   DB  : ${process.env.DB_NAME || 'sarathy_sales'}`);
    console.error(`   User: ${process.env.DB_USER || 'root'}`);
    console.error(`   Error: ${err.message}`);
    console.error('   → Check your .env file credentials');
  });

module.exports = pool;
