
const mysql = require('mysql');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'zephyra'
});

pool.getConnection((err, connection) => {
    if (err) {
        console.log(`Error al obtener la conexión: ${err.message}`);
    }
    else {
        console.log(`Conectado a la BD de ${pool.config.connectionConfig.database}`);
        connection.release();
    }
});

module.exports = pool;