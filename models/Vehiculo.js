const pool = require('../db');

class Vehiculo {
    //Función para obtener los vehículos
    static obtenerTodos = (callback) => {
        const consulta = `
            SELECT 
                v.id_vehiculo,
                v.matricula,
                v.marca,
                v.modelo,
                v.anyo_matriculacion,
                v.numero_plazas,
                v.autonomia_km,
                v.color,
                v.imagen,
                v.estado,
                v.id_concesionario,
                c.nombre AS nombre_concesionario
            FROM Vehiculos v
            LEFT JOIN Concesionarios c 
                ON v.id_concesionario = c.id_concesionario
            ORDER BY v.id_vehiculo ASC
        `;
        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }

    // Obtener todos los vehículos sin la imagen (para API JSON)
    static obtenerTodosSinImagen(callback) {
        const consulta = `
            SELECT 
                v.id_vehiculo,
                v.matricula,
                v.marca,
                v.modelo,
                v.anyo_matriculacion,
                v.numero_plazas,
                v.autonomia_km,
                v.color,
                v.estado,
                v.id_concesionario,
                c.nombre AS nombre_concesionario
            FROM Vehiculos v
            LEFT JOIN Concesionarios c 
                ON v.id_concesionario = c.id_concesionario
            ORDER BY v.id_vehiculo ASC
        `;

        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }

    // Obtener un vehículo por ID con información del concesionario
    static obtenerPorId(id, callback) {
        const consulta = `
            SELECT 
                v.*,
                c.nombre AS nombre_concesionario,
                c.ciudad AS ciudad_concesionario
            FROM Vehiculos v
            LEFT JOIN Concesionarios c 
                ON v.id_concesionario = c.id_concesionario
            WHERE v.id_vehiculo = ?
        `;

        pool.query(consulta, [id], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    }

    // Obtener solo la imagen de un vehículo por ID
    static obtenerImagen(id, callback) {
        pool.getConnection((err, con) => {
            if (err) {
                return callback(err, null);
            }

            const consulta = 'SELECT imagen FROM Vehiculos WHERE id_vehiculo = ?';
            con.query(consulta, [id], (err, result) => {
                con.release();

                if (err) {
                    return callback(err, null);
                }

                // Comprobar si existe un vehículo con el ID dado
                if (result.length === 0) {
                    return callback(new Error('No existe el vehículo'), null);
                }

                callback(null, result[0].imagen);
            });
        });
    }

    // Crear un nuevo vehículo
    static crear(datosVehiculo, callback) {
        const consulta = `
            INSERT INTO Vehiculos 
            (matricula, marca, modelo, anyo_matriculacion, numero_plazas, 
             autonomia_km, color, imagen, estado, id_concesionario) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valores = [
            datosVehiculo.matricula,
            datosVehiculo.marca,
            datosVehiculo.modelo,
            datosVehiculo.anyo_matriculacion,
            datosVehiculo.numero_plazas,
            datosVehiculo.autonomia_km,
            datosVehiculo.color,
            datosVehiculo.imagen || null,
            datosVehiculo.estado || 'disponible',
            datosVehiculo.id_concesionario
        ];

        pool.query(consulta, valores, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.insertId);
        });
    }

    // Actualizar un vehículo (sin imagen)
    static actualizar(id, datos, callback) {
        const consulta = `
            UPDATE Vehiculos 
            SET matricula = ?, marca = ?, modelo = ?, anyo_matriculacion = ?,
                numero_plazas = ?, autonomia_km = ?, color = ?, estado = ?,
                id_concesionario = ?
            WHERE id_vehiculo = ?
        `;

        const valores = [
            datos.matricula,
            datos.marca,
            datos.modelo,
            datos.anyo_matriculacion,
            datos.numero_plazas,
            datos.autonomia_km,
            datos.color,
            datos.estado,
            datos.id_concesionario,
            id
        ];

        pool.query(consulta, valores, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }

    // Actualizar un vehículo incluyendo la imagen
    static actualizarConImagen(id, datos, callback) {
        const consulta = `
            UPDATE Vehiculos 
            SET matricula = ?, marca = ?, modelo = ?, anyo_matriculacion = ?,
                numero_plazas = ?, autonomia_km = ?, color = ?, imagen = ?,
                estado = ?, id_concesionario = ?
            WHERE id_vehiculo = ?
        `;

        const valores = [
            datos.matricula,
            datos.marca,
            datos.modelo,
            datos.anyo_matriculacion,
            datos.numero_plazas,
            datos.autonomia_km,
            datos.color,
            datos.imagen,
            datos.estado,
            datos.id_concesionario,
            id
        ];

        pool.query(consulta, valores, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }

    // Verificar si una matrícula ya existe
    static existeMatricula(matricula, idExcluir, callback) {
        let consulta = 'SELECT id_vehiculo FROM Vehiculos WHERE matricula = ?';
        const params = [matricula];

        if (idExcluir) {
            consulta += ' AND id_vehiculo != ?';
            params.push(idExcluir);
        }

        pool.query(consulta, params, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results.length > 0);
        });
    }

    // Obtener vehículos por concesionario
    static obtenerPorConcesionario(idConcesionario, callback) {
        const consulta = `
            SELECT 
                v.id_vehiculo,
                v.matricula,
                v.marca,
                v.modelo,
                v.anyo_matriculacion,
                v.numero_plazas,
                v.autonomia_km,
                v.color,
                v.estado
            FROM Vehiculos v
            WHERE v.id_concesionario = ?
            ORDER BY v.marca, v.modelo
        `;

        pool.query(consulta, [idConcesionario], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }

    // Obtener vehículos disponibles
    static obtenerDisponibles(callback) {
        const consulta = `
            SELECT 
                v.id_vehiculo,
                v.matricula,
                v.marca,
                v.modelo,
                v.anyo_matriculacion,
                v.numero_plazas,
                v.autonomia_km,
                v.color,
                v.imagen,
                c.nombre AS nombre_concesionario,
                c.ciudad AS ciudad_concesionario
            FROM Vehiculos v
            LEFT JOIN Concesionarios c 
                ON v.id_concesionario = c.id_concesionario
            WHERE v.estado = 'disponible'
            ORDER BY v.marca, v.modelo
        `;

        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }

    // Cambiar el estado de un vehículo
    static cambiarEstado(id, nuevoEstado, callback) {
        const consulta = 'UPDATE Vehiculos SET estado = ? WHERE id_vehiculo = ?';

        pool.query(consulta, [nuevoEstado, id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }

    // Contar vehículos por estado
    static contarPorEstado(callback) {
        const consulta = `
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM Vehiculos
            GROUP BY estado
        `;

        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }

    // Eliminar vehiculo
    static eliminar = (id, callback) => {
        const consulta = 'DELETE FROM Vehiculos WHERE id_vehiculo = ?';
        pool.query(consulta, [id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }
}


module.exports = Vehiculo;