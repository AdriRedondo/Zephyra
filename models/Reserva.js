const pool = require('../db');

class Reserva {
    // Obtener todas las reservas con información de vehículo y usuario
    static obtenerTodas = (callback) => {
        const consulta = `
            SELECT 
                r.id_reserva,
                r.id_vehiculo,
                r.id_usuario,
                r.fecha_inicio,
                r.fecha_fin,
                r.fecha_recogida,
                r.fecha_devolucion,
                r.estado,
                r.observaciones,
                r.kilometros_recorridos,
                r.incidencias_reportadas,
                v.marca,
                v.modelo,
                v.matricula,
                u.nombre AS nombre_usuario,
                u.correo AS correo_usuario
            FROM Reservas r
            INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
            INNER JOIN Usuarios u ON r.id_usuario = u.id_usuario
            ORDER BY r.fecha_inicio DESC
        `;

        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    };

    // Obtener una reserva por ID con información completa
    static obtenerPorId = (id, callback) => {
        const consulta = `
            SELECT 
                r.*,
                v.marca,
                v.modelo,
                v.matricula,
                v.color,
                v.numero_plazas,
                u.nombre AS nombre_usuario,
                u.correo AS correo_usuario,
                u.telefono AS telefono_usuario
            FROM Reservas r
            INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
            INNER JOIN Usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.id_reserva = ?
        `;

        pool.query(consulta, [id], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    };

    // Obtener reservas por usuario
    static obtenerPorUsuario = (idUsuario, callback) => {
        const consulta = `
            SELECT 
                r.*,
                v.marca,
                v.modelo,
                v.matricula,
                v.color
            FROM Reservas r
            INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
            WHERE r.id_usuario = ?
            ORDER BY r.fecha_inicio DESC
        `;

        pool.query(consulta, [idUsuario], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    };

    // Obtener reservas por vehículo
    static obtenerPorVehiculo = (idVehiculo, callback) => {
        const consulta = `
            SELECT 
                r.*,
                u.nombre AS nombre_usuario,
                u.correo AS correo_usuario
            FROM Reservas r
            INNER JOIN Usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.id_vehiculo = ?
            ORDER BY r.fecha_inicio DESC
        `;

        pool.query(consulta, [idVehiculo], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    };

    // Verificar disponibilidad de un vehículo en un rango de fechas
    static verificarDisponibilidad = (idVehiculo, fechaInicio, fechaFin, idReservaExcluir, callback) => {
        let consulta = `
            SELECT * FROM Reservas 
            WHERE id_vehiculo = ? 
            AND estado NOT IN ('cancelada', 'completada', 'finalizada')
            AND (
                (fecha_inicio BETWEEN ? AND ?) OR
                (fecha_fin BETWEEN ? AND ?) OR
                (? BETWEEN fecha_inicio AND fecha_fin)
            )
        `;

        const params = [idVehiculo, fechaInicio, fechaFin, fechaInicio, fechaFin, fechaInicio];

        // Si se proporciona un ID de reserva, excluirla (útil para ediciones)
        if (idReservaExcluir) {
            consulta += ' AND id_reserva != ?';
            params.push(idReservaExcluir);
        }

        pool.query(consulta, params, (err, results) => {
            if (err) return callback(err, null);
            // Devuelve true si está disponible (no hay conflictos)
            callback(null, results.length === 0);
        });
    };

    // Crear una nueva reserva
    static crear = (datos, callback) => {
        const consulta = `
            INSERT INTO Reservas 
            (id_vehiculo, id_usuario, fecha_inicio, fecha_fin, observaciones, estado)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const parametros = [
            datos.id_vehiculo,
            datos.id_usuario,
            datos.fecha_inicio,
            datos.fecha_fin,
            datos.observaciones || '',
            datos.estado || 'activa'
        ];

        pool.query(consulta, parametros, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.insertId);
        });
    };

    // Actualizar una reserva
    static actualizar = (id, datos, callback) => {
        const campos = [];
        const valores = [];

        if (datos.fecha_inicio) {
            campos.push('fecha_inicio = ?');
            valores.push(datos.fecha_inicio);
        }
        if (datos.fecha_fin) {
            campos.push('fecha_fin = ?');
            valores.push(datos.fecha_fin);
        }
        if (datos.fecha_recogida !== undefined) {
            campos.push('fecha_recogida = ?');
            valores.push(datos.fecha_recogida);
        }
        if (datos.fecha_devolucion !== undefined) {
            campos.push('fecha_devolucion = ?');
            valores.push(datos.fecha_devolucion);
        }
        if (datos.observaciones !== undefined) {
            campos.push('observaciones = ?');
            valores.push(datos.observaciones);
        }
        if (datos.kilometros_recorridos !== undefined) {
            campos.push('kilometros_recorridos = ?');
            valores.push(datos.kilometros_recorridos);
        }
        if (datos.incidencias_reportadas !== undefined) {
            campos.push('incidencias_reportadas = ?');
            valores.push(datos.incidencias_reportadas);
        }
        if (datos.estado) {
            campos.push('estado = ?');
            valores.push(datos.estado);
        }

        if (campos.length === 0) {
            return callback(new Error('No hay campos para actualizar'), null);
        }

        valores.push(id);

        const consulta = `UPDATE Reservas SET ${campos.join(', ')} WHERE id_reserva = ?`;

        pool.query(consulta, valores, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    };

    // Cambiar solo el estado de una reserva
    static cambiarEstado = (id, nuevoEstado, callback) => {
        const consulta = 'UPDATE Reservas SET estado = ? WHERE id_reserva = ?';

        pool.query(consulta, [nuevoEstado, id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    };

    // Eliminar una reserva
    static eliminar = (id, callback) => {
        const consulta = 'DELETE FROM Reservas WHERE id_reserva = ?';

        pool.query(consulta, [id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.affectedRows);
        });
    };

    // Obtener reservas activas
    static obtenerActivas = (callback) => {
        const consulta = `
            SELECT 
                r.*,
                v.marca,
                v.modelo,
                v.matricula,
                u.nombre AS nombre_usuario
            FROM Reservas r
            INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
            INNER JOIN Usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.estado = 'activa'
            ORDER BY r.fecha_inicio ASC
        `;

        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    };

    // Obtener reservas por estado
    static obtenerPorEstado = (estado, callback) => {
        const consulta = `
            SELECT 
                r.*,
                v.marca,
                v.modelo,
                v.matricula,
                u.nombre AS nombre_usuario
            FROM Reservas r
            INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
            INNER JOIN Usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.estado = ?
            ORDER BY r.fecha_inicio DESC
        `;

        pool.query(consulta, [estado], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    };

    // Contar reservas por estado
    static contarPorEstado = (callback) => {
        const consulta = `
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM Reservas
            GROUP BY estado
        `;

        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    };

    // Obtener estadísticas de reservas
    static obtenerEstadisticas = (callback) => {
        const consulta = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
                SUM(CASE WHEN estado = 'finalizada' THEN 1 ELSE 0 END) as finalizadas,
                SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas
            FROM Reservas
        `;

        pool.query(consulta, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results[0]);
        });
    };

    // Obtener el ID del vehículo de una reserva
    static obtenerVehiculoDeReserva = (idReserva, callback) => {
        const consulta = 'SELECT id_vehiculo FROM Reservas WHERE id_reserva = ?';

        pool.query(consulta, [idReserva], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0].id_vehiculo);
        });
    };
}

module.exports = Reserva;