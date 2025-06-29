require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection(process.env.SQL_URL)

module.exports = db;