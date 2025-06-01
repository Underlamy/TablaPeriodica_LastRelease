require('dotenv').config();
const mysql = require('mysql2');

// Crear un pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión inicial (opcional pero útil para debug)
pool.getConnection((err, connection) => {
  if (err) {
    console.error('[DB] Error al obtener conexión del pool:', err);
  } else {
    console.log('[DB] Conexión exitosa al pool');
    connection.release(); // liberar de inmediato
  }
});

module.exports = pool;