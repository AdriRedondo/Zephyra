const pool = require('../db');

class Vehiculo {
    //Función auxiliar para obtener los vehículos
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

    static eliminar = (id, callback) => {
        const consulta = 'DELETE FROM Vehiculos WHERE id_vehiculo = ?';
        pool.query(consulta, [id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    }
}

module.exports = Vehiculo;
