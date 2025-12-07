const pool = require('../db');

class Cliente {
    // Crear un nuevo cliente
    static crear(datosCliente, callback) {
        const consulta = `
            INSERT INTO Cliente
            (nombre, correo, telefono, direccion, codigo_postal)
            VALUES (?, ?, ?, ?, ?)
        `;

        const valores = [
            datosCliente.nombre,
            datosCliente.correo,
            datosCliente.telefono || null,
            datosCliente.direccion || null,
            datosCliente.codigo_postal || null
        ];

        pool.query(consulta, valores, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.insertId);
        });
    }

    // Buscar cliente por correo
    static buscarPorCorreo(correo, callback) {
        const consulta = 'SELECT * FROM Cliente WHERE correo = ?';

        pool.query(consulta, [correo], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    }

    // Obtener cliente por ID
    static obtenerPorId(id, callback) {
        const consulta = 'SELECT * FROM Cliente WHERE id_cliente = ?';

        pool.query(consulta, [id], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    }

    // Obtener todos los clientes
    static obtenerTodos(callback) {
        const consulta = 'SELECT * FROM Cliente ORDER BY nombre ASC';

        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }

    // Actualizar cliente
    static actualizar(id, datos, callback) {
        const consulta = `
            UPDATE Cliente
            SET nombre = ?, correo = ?, telefono = ?,
                direccion = ?, codigo_postal = ?
            WHERE id_cliente = ?
        `;

        const valores = [
            datos.nombre,
            datos.correo,
            datos.telefono || null,
            datos.direccion || null,
            datos.codigo_postal || null,
            id
        ];

        pool.query(consulta, valores, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }

    // Eliminar cliente
    static eliminar(id, callback) {
        const consulta = 'DELETE FROM Cliente WHERE id_cliente = ?';

        pool.query(consulta, [id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }

    // Buscar o crear cliente
    static buscarOCrear(datosCliente, callback) {
        // Primero intentar buscar por correo
        Cliente.buscarPorCorreo(datosCliente.correo, (err, clienteExistente) => {
            if (err) return callback(err, null);

            // Si existe, devolver el cliente existente
            if (clienteExistente) {
                return callback(null, clienteExistente.id_cliente, false);
            }

            // Si no existe, crear uno nuevo
            Cliente.crear(datosCliente, (errCrear, idCliente) => {
                if (errCrear) return callback(errCrear, null);
                callback(null, idCliente, true);
            });
        });
    }
}

module.exports = Cliente;
