const pool = require('../db');

class Concesionario {
    //Función auxiliar para obtener los concesionarios disponibles en la BD
    static obtenerTodos = (callback) => {
        const consulta = 'SELECT * FROM Concesionarios';
        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null)
            callback(null, results)
        });
    };

    static obtenerPorId = (id, callback) => {
        //consulta para obtener el concesionario con ese id
        const consulta = `SELECT * FROM Concesionarios WHERE id_concesionario = ?`;

        pool.query(consulta, [id], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    };

    static crear = (datos, callback) => {
        // Consulta para insertar el concesionario
        const consulta = `INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) 
                          VALUES (?, ?, ?, ?)`;
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
        const { nombre, ciudad, direccion, telefono } = datos;

        // Consulta para actualizar el concesionario
        const consulta = `UPDATE Concesionarios 
                          SET nombre = ?, ciudad = ?, direccion = ?, telefono_contacto = ?
                          WHERE id_concesionario = ?`;

        const parametros = [nombre, ciudad, direccion, telefono, id];

        pool.query(consulta, parametros, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }

    static eliminar = (id, callback) => {
        const consulta = 'DELETE FROM Concesionarios WHERE id_concesionario = ?';
        pool.query(consulta, [id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }
}

module.exports = Concesionario;