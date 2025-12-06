const pool = require('../db');

class Usuario {
    //Función auxiliar para obtener los usuarios
    static obtenerTodos = (callback) => {
        const consulta = `
            SELECT u.id_usuario, u.nombre, u.correo, u.rol, u.telefono, u.id_concesionario,
                   c.nombre as nombre_concesionario
            FROM Usuarios u
            LEFT JOIN Concesionarios c ON u.id_concesionario = c.id_concesionario
            ORDER BY u.id_usuario ASC
        `;
        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    };

    static obtenerPorId = (id, callback) => {
        const consulta = `SELECT * FROM Usuarios WHERE id_usuario = ?`;
        pool.query(consulta, [id], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    };

    static obtenerPorCorreo = (correo, callback) => {
        const consulta = 'SELECT * FROM Usuarios WHERE correo = ?';
        pool.query(consulta, [correo], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    };

    static crear = (datos, callback) => {
        //Consulta para insertar al usuario en la BD
        const consulta = `INSERT INTO Usuarios (nombre, correo, contraseña, rol, telefono, id_concesionario) 
                          VALUES (?, ?, ?, ?, ?, ?)`;
        //Datos del usuario a insertar 
        const parametros = [
            datos.nombre,
            datos.correo,
            datos.contrasenya,
            datos.rol,
            datos.telefono,
            datos.id_concesionario
        ];
        pool.query(consulta, parametros, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.insertId);
        });
    };

    static actualizar = (id, datos, callback) => {
        const { nombre, correo, telefono, rol, id_concesionario, contrasenya } = datos;

        // Consulta para actualizar usuario
        const consulta = `
            UPDATE Usuarios
            SET nombre = ?, correo = ?, telefono = ?, rol = ?, id_concesionario = ?
            ${contrasenya ? ', contraseña = ?' : ''}
            WHERE id_usuario = ?
        `;

        const parametros = contrasenya
            ? [nombre, correo, telefono, rol, id_concesionario, contrasenya, id]
            : [nombre, correo, telefono, rol, id_concesionario, id];

        pool.query(consulta, parametros, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    };

    static eliminar(id, callback) {
        const consulta = 'DELETE FROM Usuarios WHERE id_usuario = ?';
        pool.query(consulta, [id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }
}

module.exports = Usuario;