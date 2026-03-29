const pool = require('../db');

class Reserva {

    // ===============================================================
    // OBTENER TODAS LAS RESERVAS
    // ===============================================================
    static obtenerTodas = (callback) => {
        const consulta = `
            SELECT r.*, 
                v.matricula, v.marca, v.modelo, 
                c.nombre AS nombre_cliente,
                c.correo AS correo_cliente,
                c.telefono AS telefono_cliente,
                u.nombre AS nombre_usuario
            FROM Reservas r
            LEFT JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
            LEFT JOIN Cliente c ON r.id_cliente = c.id_cliente
            LEFT JOIN Usuarios u ON r.id_usuario = u.id_usuario
            ORDER BY r.id_reserva DESC
        `;

        pool.query(consulta, (err, resultados) => {
            if (err) return callback(err, null);
            callback(null, resultados);
        });
    };

    // ===============================================================
    // CREAR RESERVA
    // ===============================================================
    static crear = (datos, callback) => {
        const consulta = `
            INSERT INTO Reservas 
            (id_usuario, id_cliente, id_vehiculo, fecha_inicio, fecha_fin, estado, kilometros_recorridos, incidencias_reportadas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valores = [
            datos.id_usuario || null,
            datos.id_cliente,
            datos.id_vehiculo,
            datos.fecha_inicio,
            datos.fecha_fin,
            datos.estado || 'activa',
            datos.kilometros_recorridos || null,
            datos.incidencias_reportadas || null
        ];

        pool.query(consulta, valores, (err, resultado) => {
            if (err) return callback(err, null);
            callback(null, resultado.insertId);
        });
    };

    // ===============================================================
    // OBTENER RESERVA POR ID
    // ===============================================================
    static obtenerPorId = (id, callback) => {
        const consulta = `
            SELECT * FROM Reservas WHERE id_reserva = ?
        `;
        pool.query(consulta, [id], (err, resultado) => {
            if (err) return callback(err, null);
            callback(null, resultado[0] || null);
        });
    };

    // ===============================================================
    // CANCELAR RESERVA + LIBERAR VEHÍCULO
    // ===============================================================
    static cancelarReserva = (id_reserva, callback) => {

        const consulta = `
            UPDATE Reservas
            SET estado = 'cancelada'
            WHERE id_reserva = ?
        `;

        pool.query(consulta, [id_reserva], (err, result) => {
            if (err) return callback(err);

            // Obtener vehículo asociado para liberarlo
            const consultaVehiculo = `
                SELECT id_vehiculo 
                FROM Reservas 
                WHERE id_reserva = ?
            `;

            pool.query(consultaVehiculo, [id_reserva], (err2, rows) => {
                if (err2) return callback(err2);

                if (rows.length === 0) {
                    return callback(null);
                }

                const idVehiculo = rows[0].id_vehiculo;

                // Liberar vehículo
                const consultaLiberar = `
                    UPDATE Vehiculos
                    SET estado = 'disponible'
                    WHERE id_vehiculo = ?
                `;

                pool.query(consultaLiberar, [idVehiculo], (err3) => {
                    if (err3) return callback(err3);

                    console.log(`Vehículo ${idVehiculo} liberado tras cancelar reserva ${id_reserva}`);
                    callback(null);
                });
            });
        });
    };

    // ===============================================================
    // FINALIZAR RESERVA + LIBERAR VEHÍCULO
    // ===============================================================
    static finalizarReserva = (id_reserva, callback) => {
        const consulta = `
            UPDATE Reservas 
            SET estado = 'finalizada'
            WHERE id_reserva = ?
        `;

        pool.query(consulta, [id_reserva], (err) => {
            if (err) return callback(err);

            const consultaVehiculo = `
                SELECT id_vehiculo FROM Reservas WHERE id_reserva = ?
            `;

            pool.query(consultaVehiculo, [id_reserva], (err2, rows) => {
                if (err2) return callback(err2);

                const idVehiculo = rows[0].id_vehiculo;

                const liberar = `
                    UPDATE Vehiculos SET estado = 'disponible'
                    WHERE id_vehiculo = ?
                `;

                pool.query(liberar, [idVehiculo], (err3) => {
                    if (err3) return callback(err3);
                    callback(null);
                });
            });
        });
    };

    // ===============================================================
    // ACTUALIZACIÓN AUTOMÁTICA DEL ESTADO DE RESERVAS
    // ===============================================================
    static actualizarEstadosAutomaticamente = (callback) => {
        const Vehiculo = require('./Vehiculo');
        const ahora = new Date();

        // Finalizar reservas caducadas
        const consultaFinalizar = `
            UPDATE Reservas
            SET estado = 'finalizada'
            WHERE estado = 'activa'
            AND fecha_fin < ?
        `;

        pool.query(consultaFinalizar, [ahora], (err, resultFinalizar) => {
            if (err) return callback(err, null);

            // Buscar vehículos pendientes de liberar
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
                if (errVeh) return callback(errVeh, null);

                let liberados = 0;
                let procesados = 0;

                if (vehiculos.length === 0) {
                    return callback(null, { finalizadas: resultFinalizar.affectedRows, liberados: 0 });
                }

                vehiculos.forEach(v => {
                    const consultaActivas = `
                        SELECT COUNT(*) AS activas
                        FROM Reservas
                        WHERE id_vehiculo = ?
                        AND estado = 'activa'
                        AND fecha_inicio <= ?
                        AND fecha_fin >= ?
                    `;

                    pool.query(consultaActivas, [v.id_vehiculo, ahora, ahora], (errAct, resAct) => {
                        procesados++;

                        if (!errAct && resAct[0].activas === 0) {
                            Vehiculo.cambiarEstado(v.id_vehiculo, 'disponible', (errCambio) => {
                                if (!errCambio) liberados++;

                                if (procesados === vehiculos.length) {
                                    callback(null, {
                                        finalizadas: resultFinalizar.affectedRows,
                                        liberados
                                    });
                                }
                            });
                        } else {
                            if (procesados === vehiculos.length) {
                                callback(null, {
                                    finalizadas: resultFinalizar.affectedRows,
                                    liberados
                                });
                            }
                        }
                    });
                });
            });
        });
    };
    // VERIFICAR DISPONIBILIDAD DEL VEHÍCULO
    // ===============================================================
    static verificarDisponibilidad = (id_vehiculo, fecha_inicio, fecha_fin, id_reserva_excluir, callback) => {
        // Validar que las fechas sean válidas
        const inicio = new Date(fecha_inicio);
        const fin = new Date(fecha_fin);

        if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
            return callback(new Error('Fechas inválidas'), null);
        }

        if (fin <= inicio) {
            return callback(new Error('La fecha de fin debe ser posterior a la de inicio'), null);
        }

        // Buscar reservas que se solapen con el rango solicitado
        let consulta = `
        SELECT COUNT(*) as conflictos
        FROM Reservas
        WHERE id_vehiculo = ?
        AND estado = 'activa'
        AND (
            -- El rango solicitado se superpone con una reserva existente
            (? < fecha_fin AND ? > fecha_inicio)
        )
    `;

        const params = [id_vehiculo, inicio, fin];

        // Si estamos actualizando una reserva existente, excluirla de la búsqueda
        if (id_reserva_excluir) {
            consulta += ' AND id_reserva != ?';
            params.push(id_reserva_excluir);
        }

        pool.query(consulta, params, (err, resultados) => {
            if (err) return callback(err, null);

            const disponible = resultados[0].conflictos === 0;
            callback(null, disponible);
        });
    };
}

module.exports = Reserva;
