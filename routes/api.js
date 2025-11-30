const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ============================================
   ENDPOINTS DE VEHÍCULOS
   ============================================ */

// GET /api/vehiculos - Obtener todos los vehículos con filtros
router.get('/vehiculos', (req, res) => {
    let consulta = `
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
        LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
        WHERE 1=1
    `;

    const params = [];

    // Filtro por marca
    if (req.query.marca) {
        consulta += ' AND v.marca = ?';
        params.push(req.query.marca);
    }

    // Filtro por modelo
    if (req.query.modelo) {
        consulta += ' AND v.modelo = ?';
        params.push(req.query.modelo);
    }

    // Filtro por estado
    if (req.query.estado) {
        consulta += ' AND v.estado = ?';
        params.push(req.query.estado);
    }

    // Filtro por número de plazas
    if (req.query.plazas) {
        consulta += ' AND v.numero_plazas = ?';
        params.push(req.query.plazas);
    }

    // Filtro por concesionario
    if (req.query.concesionario) {
        consulta += ' AND c.nombre = ?';
        params.push(req.query.concesionario);
    }

    consulta += ' ORDER BY v.id_vehiculo ASC';

    pool.query(consulta, params, (err, vehiculos) => {
        if (err) {
            console.error('Error al obtener vehículos JSON:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener vehículos',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }

        res.status(200).json({
            success: true,
            data: vehiculos,
            count: vehiculos.length
        });
    });
});

// GET /api/vehiculos/:id - Obtener un vehículo específico
router.get('/vehiculos/:id', (req, res) => {
    const id = req.params.id;

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
            c.nombre AS nombre_concesionario,
            c.ciudad,
            c.direccion,
            c.telefono_contacto
        FROM Vehiculos v
        LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
        WHERE v.id_vehiculo = ?
    `;

    pool.query(consulta, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener vehículo:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener vehículo',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: results[0]
        });
    });
});

/* ============================================
   ENDPOINTS DE RESERVAS
   ============================================ */

// GET /api/reservas - Obtener todas las reservas
router.get('/reservas', (req, res) => {
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
        if (err) {
            console.error('Error al obtener reservas:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reservas',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            data: results,
            count: results.length
        });
    });
});

// GET /api/reservas/:id - Obtener una reserva específica
router.get('/reservas/:id', (req, res) => {
    const id = req.params.id;

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
        WHERE r.id_reserva = ?
    `;

    pool.query(consulta, [id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reserva'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: results[0]
        });
    });
});

// POST /api/reservas - Crear nueva reserva
router.post('/reservas', (req, res) => {
    const { id_vehiculo, id_usuario, fecha_inicio, fecha_fin, observaciones } = req.body;

    // Validaciones
    if (!id_vehiculo || !id_usuario || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
            success: false,
            message: 'Faltan campos obligatorios: id_vehiculo, id_usuario, fecha_inicio, fecha_fin'
        });
    }

    // Validar que la fecha de inicio no sea anterior a hoy
    const fechaInicioDate = new Date(fecha_inicio);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaInicioDate < hoy) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de inicio no puede ser anterior al día actual'
        });
    }

    // Validar que fecha_fin sea posterior a fecha_inicio
    const fechaFinDate = new Date(fecha_fin);
    if (fechaFinDate <= fechaInicioDate) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
    }

    // Verificar que el vehículo exista
    const consultaVehiculo = 'SELECT * FROM Vehiculos WHERE id_vehiculo = ?';

    pool.query(consultaVehiculo, [id_vehiculo], (err, vehiculos) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al verificar vehículo'
            });
        }

        if (vehiculos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }

        // Verificar disponibilidad del vehículo
        const consultaDisponibilidad = `
            SELECT * FROM Reservas 
            WHERE id_vehiculo = ? 
            AND estado NOT IN ('cancelada', 'completada')
            AND (
                (fecha_inicio BETWEEN ? AND ?) OR
                (fecha_fin BETWEEN ? AND ?) OR
                (? BETWEEN fecha_inicio AND fecha_fin)
            )
        `;

        pool.query(consultaDisponibilidad,
            [id_vehiculo, fecha_inicio, fecha_fin, fecha_inicio, fecha_fin, fecha_inicio],
            (err, reservasConflicto) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error al verificar disponibilidad'
                    });
                }

                if (reservasConflicto.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'El vehículo no está disponible en esas fechas'
                    });
                }

                // Insertar reserva
                const consultaInsert = `
                    INSERT INTO Reservas (id_vehiculo, id_usuario, fecha_inicio, fecha_fin, observaciones, estado)
                    VALUES (?, ?, ?, ?, ?, 'pendiente')
                `;

                pool.query(consultaInsert,
                    [id_vehiculo, id_usuario, fecha_inicio, fecha_fin, observaciones || ''],
                    (err, result) => {
                        if (err) {
                            console.error('Error al crear reserva:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error al crear reserva'
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: 'Reserva creada correctamente',
                            data: {
                                id_reserva: result.insertId,
                                id_vehiculo,
                                id_usuario,
                                fecha_inicio,
                                fecha_fin,
                                estado: 'pendiente'
                            }
                        });
                    }
                );
            }
        );
    });
});

// PUT /api/reservas/:id - Actualizar una reserva
router.put('/reservas/:id', (req, res) => {
    const id = req.params.id;
    const { fecha_inicio, fecha_fin, observaciones, estado } = req.body;

    const campos = [];
    const valores = [];

    if (fecha_inicio) {
        campos.push('fecha_inicio = ?');
        valores.push(fecha_inicio);
    }
    if (fecha_fin) {
        campos.push('fecha_fin = ?');
        valores.push(fecha_fin);
    }
    if (observaciones !== undefined) {
        campos.push('observaciones = ?');
        valores.push(observaciones);
    }
    if (estado) {
        campos.push('estado = ?');
        valores.push(estado);
    }

    if (campos.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No hay campos para actualizar'
        });
    }

    valores.push(id);

    const consulta = `UPDATE Reservas SET ${campos.join(', ')} WHERE id_reserva = ?`;

    pool.query(consulta, valores, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar reserva'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Reserva actualizada correctamente'
        });
    });
});

// DELETE /api/reservas/:id - Eliminar una reserva
router.delete('/reservas/:id', (req, res) => {
    const id = req.params.id;

    const consulta = 'DELETE FROM Reservas WHERE id_reserva = ?';

    pool.query(consulta, [id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar reserva'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Reserva eliminada correctamente'
        });
    });
});

/* ============================================
   ENDPOINTS DE ESTADÍSTICAS
   ============================================ */

// GET /api/estadisticas/vehiculos
router.get('/estadisticas/vehiculos', (req, res) => {
    const consulta = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
            SUM(CASE WHEN estado = 'reservado' THEN 1 ELSE 0 END) as reservados,
            SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) as mantenimiento
        FROM Vehiculos
    `;

    pool.query(consulta, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }

        res.status(200).json({
            success: true,
            data: results[0]
        });
    });
});

// GET /api/estadisticas/reservas
router.get('/estadisticas/reservas', (req, res) => {
    const consulta = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
            SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
            SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
            SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas
        FROM Reservas
    `;

    pool.query(consulta, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }

        res.status(200).json({
            success: true,
            data: results[0]
        });
    });
});

/* ============================================
   ENDPOINTS DE MARCAS Y MODELOS (Para filtros)
   ============================================ */

// GET /api/marcas - Obtener todas las marcas disponibles
router.get('/marcas', (req, res) => {
    const consulta = 'SELECT DISTINCT marca FROM Vehiculos ORDER BY marca';

    pool.query(consulta, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener marcas'
            });
        }

        res.status(200).json({
            success: true,
            data: results.map(r => r.marca)
        });
    });
});

// GET /api/modelos - Obtener todos los modelos (opcionalmente por marca)
router.get('/modelos', (req, res) => {
    let consulta = 'SELECT DISTINCT modelo FROM Vehiculos';
    const params = [];

    if (req.query.marca) {
        consulta += ' WHERE marca = ?';
        params.push(req.query.marca);
    }

    consulta += ' ORDER BY modelo';

    pool.query(consulta, params, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener modelos'
            });
        }

        res.status(200).json({
            success: true,
            data: results.map(r => r.modelo)
        });
    });
});

module.exports = router;