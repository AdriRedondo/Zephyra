const pool = require('../db');

class Reserva {
    // Obtener todas las reservas con información de vehículo, usuario y cliente
    static obtenerTodas = (callback) => {
        const consulta = `
            SELECT
                r.id_reserva,
                r.id_vehiculo,
                r.id_usuario,
                r.id_cliente,
                r.fecha_inicio,
                r.fecha_fin,
                r.estado,
                r.kilometros_recorridos,
                r.incidencias_reportadas,
                v.marca,
                v.modelo,
                v.matricula,
                u.nombre AS nombre_usuario,
                u.correo AS correo_usuario,
                c.nombre AS nombre_cliente,
                c.correo AS correo_cliente,
                c.telefono AS telefono_cliente
            FROM Reservas r
            INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
            LEFT JOIN Usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN Cliente c ON r.id_cliente = c.id_cliente
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
                u.telefono AS telefono_usuario,
                c.nombre AS nombre_cliente,
                c.correo AS correo_cliente,
                c.telefono AS telefono_cliente,
                c.direccion AS direccion_cliente,
                c.codigo_postal AS codigo_postal_cliente
            FROM Reservas r
            INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
            LEFT JOIN Usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN Cliente c ON r.id_cliente = c.id_cliente
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
            (id_vehiculo, id_usuario, id_cliente, fecha_inicio, fecha_fin,
             kilometros_recorridos, incidencias_reportadas, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const parametros = [
            datos.id_vehiculo,
            datos.id_usuario || null,
            datos.id_cliente || null,
            datos.fecha_inicio,
            datos.fecha_fin,
            datos.kilometros_recorridos || null,
            datos.incidencias_reportadas || null,
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

    // Actualizar automáticamente estados de reservas según fechas
    static actualizarEstadosAutomaticamente = (callback) => {
        const Vehiculo = require('./Vehiculo');
        const ahora = new Date();

        // Finalizar reservas que ya pasaron su fecha de fin
        const consultaFinalizar = `
            UPDATE Reservas
            SET estado = 'finalizada'
            WHERE estado = 'activa'
            AND fecha_fin < ?
        `;

        pool.query(consultaFinalizar, [ahora], (err, resultFinalizar) => {
            if (err) {
                console.error('Error al finalizar reservas automáticamente:', err);
                return callback(err, null);
            }


            // Obtener vehículos de reservas finalizadas o canceladas para ponerlos disponibles
            const consultaVehiculosLiberar = `
                SELECT DISTINCT id_vehiculo
                FROM Reservas
                WHERE estado IN ('finalizada', 'cancelada')
                AND id_vehiculo IN (
                    SELECT id_vehiculo
                    FROM Vehiculos
                    WHERE estado = 'reservado'
                )
            `;

            pool.query(consultaVehiculosLiberar, (errVeh, vehiculos) => {
                if (errVeh) {
                    console.error('Error al obtener vehículos a liberar:', errVeh);
                    return callback(errVeh, null);
                }

                // Poner disponibles los vehículos que no tienen reservas activas
                let liberados = 0;
                let procesados = 0;

                if (vehiculos.length === 0) {
                    return callback(null, { finalizadas: resultFinalizar.affectedRows, liberados: 0 });
                }

                vehiculos.forEach(v => {
                    // Verificar si el vehículo tiene alguna reserva activa
                    const consultaReservasActivas = `
                        SELECT COUNT(*) as activas
                        FROM Reservas
                        WHERE id_vehiculo = ?
                        AND estado = 'activa'
                        AND fecha_inicio <= ?
                        AND fecha_fin >= ?
                    `;

                    pool.query(consultaReservasActivas, [v.id_vehiculo, ahora, ahora], (errActivas, resultActivas) => {
                        procesados++;

                        if (!errActivas && resultActivas[0].activas === 0) {
                            // No tiene reservas activas, liberar vehículo
                            Vehiculo.cambiarEstado(v.id_vehiculo, 'disponible', (errCambio) => {
                                if (!errCambio) {
                                    liberados++;
                                    console.log(`Vehículo ${v.id_vehiculo} liberado automáticamente`);
                                }

                                if (procesados === vehiculos.length) {
                                    callback(null, { finalizadas: resultFinalizar.affectedRows, liberados });
                                }
                            });
                        } else {
                            if (procesados === vehiculos.length) {
                                callback(null, { finalizadas: resultFinalizar.affectedRows, liberados });
                            }
                        }
                    });
                });
            });
        });
    };

    // Cancelar una reserva
    static cancelar = (idReserva, motivoCancelacion, callback) => {
        const Vehiculo = require('./Vehiculo');

        // Primero obtener el id del vehículo
        Reserva.obtenerVehiculoDeReserva(idReserva, (err, idVehiculo) => {
            if (err) return callback(err, null);
            if (!idVehiculo) return callback(new Error('Reserva no encontrada'), null);

            // Actualizar estado de la reserva a cancelada
            const consulta = `
                UPDATE Reservas
                SET estado = 'cancelada',
                    incidencias_reportadas = ?
                WHERE id_reserva = ?
            `;

            pool.query(consulta, [motivoCancelacion || 'Reserva cancelada', idReserva], (errUpdate, result) => {
                if (errUpdate) return callback(errUpdate, null);

                // Liberar el vehículo
                Vehiculo.cambiarEstado(idVehiculo, 'disponible', (errVehiculo) => {
                    if (errVehiculo) {
                        console.error('Error al liberar vehículo:', errVehiculo);
                    }

                    callback(null, result.affectedRows);
                });
            });
        });
    };
}

module.exports = Reserva;