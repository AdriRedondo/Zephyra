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
                    VALUES (?, ?, ?, ?, ?, 'activa')
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

                        // Actualizar el estado del vehículo a 'reservado'
                        const actualizarVehiculo = 'UPDATE Vehiculos SET estado = ? WHERE id_vehiculo = ?';
                        pool.query(actualizarVehiculo, ['reservado', id_vehiculo], (errUpdate) => {
                            if (errUpdate) {
                                console.error('Error al actualizar estado del vehículo:', errUpdate);
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
                                    estado: 'activa'
                                }
                            });
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
    const { fecha_inicio, fecha_fin, observaciones, estado, kilometros_recorridos, incidencias_reportadas } = req.body;

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
    if (kilometros_recorridos !== undefined) {
        campos.push('kilometros_recorridos = ?');
        valores.push(kilometros_recorridos);
    }
    if (incidencias_reportadas !== undefined) {
        campos.push('incidencias_reportadas = ?');
        valores.push(incidencias_reportadas);
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

        // Si se finaliza o cancela la reserva, liberar el vehículo
        if (estado === 'finalizada' || estado === 'cancelada') {
            // Obtener el id_vehiculo de la reserva
            pool.query('SELECT id_vehiculo FROM Reservas WHERE id_reserva = ?', [id], (errVehiculo, reserva) => {
                if (!errVehiculo && reserva.length > 0) {
                    const id_vehiculo = reserva[0].id_vehiculo;

                    // Actualizar el estado del vehículo a 'disponible'
                    pool.query('UPDATE Vehiculos SET estado = ? WHERE id_vehiculo = ?', ['disponible', id_vehiculo], (errUpdate) => {
                        if (errUpdate) {
                            console.error('Error al liberar vehículo:', errUpdate);
                        }
                    });
                }
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
   ENDPOINTS DE ACCESIBILIDAD
   ============================================ */

// POST /api/accesibilidad/preferencias - Guardar preferencias de accesibilidad en sesión
router.post('/accesibilidad/preferencias', (req, res) => {
    const { fontSize, theme, colorblind } = req.body;

    // Guardar en sesión
    if (!req.session.preferencias) {
        req.session.preferencias = {};
    }

    if (fontSize) req.session.preferencias.fontSize = fontSize;
    if (theme) req.session.preferencias.theme = theme;
    if (colorblind !== undefined) req.session.preferencias.colorblind = colorblind;

    // Si el usuario está loggeado, también guardar en la BD
    if (req.session.usuario && req.session.usuario.id_usuario) {
        const prefsJSON = JSON.stringify(req.session.preferencias);
        const consulta = 'UPDATE Usuarios SET preferencias_accesibilidad = ? WHERE id_usuario = ?';

        pool.query(consulta, [prefsJSON, req.session.usuario.id_usuario], (err) => {
            if (err) {
                console.error('Error al guardar preferencias en BD:', err);
            }
        });
    }

    res.json({
        success: true,
        message: 'Preferencias guardadas correctamente',
        data: req.session.preferencias
    });
});

// GET /api/accesibilidad/preferencias - Obtener preferencias de accesibilidad
router.get('/accesibilidad/preferencias', (req, res) => {
    if (req.session.usuario && req.session.usuario.id_usuario) {
        const consulta = 'SELECT preferencias_accesibilidad FROM Usuarios WHERE id_usuario = ?';

        pool.query(consulta, [req.session.usuario.id_usuario], (err, results) => {
            if (err || results.length === 0) {
                return res.json({
                    success: true,
                    data: req.session.preferencias || {}
                });
            }

            const prefs = results[0].preferencias_accesibilidad;
            const preferencias = prefs ? JSON.parse(prefs) : (req.session.preferencias || {});

            res.json({
                success: true,
                data: preferencias
            });
        });
    } else {
        res.json({
            success: true,
            data: req.session.preferencias || {}
        });
    }
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
            SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
            SUM(CASE WHEN estado = 'finalizada' THEN 1 ELSE 0 END) as finalizadas,
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

// GET /api/estadisticas/reservas-por-concesionario
router.get('/estadisticas/reservas-por-concesionario', (req, res) => {
    const consulta = `
        SELECT
            c.nombre as concesionario,
            c.ciudad,
            COUNT(r.id_reserva) as total_reservas
        FROM Concesionarios c
        LEFT JOIN Vehiculos v ON c.id_concesionario = v.id_concesionario
        LEFT JOIN Reservas r ON v.id_vehiculo = r.id_vehiculo
        GROUP BY c.id_concesionario, c.nombre, c.ciudad
        ORDER BY total_reservas DESC
    `;

    pool.query(consulta, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas por concesionario'
            });
        }

        res.status(200).json({
            success: true,
            data: results
        });
    });
});

// GET /api/estadisticas/vehiculo-mas-usado
router.get('/estadisticas/vehiculo-mas-usado', (req, res) => {
    const consulta = `
        SELECT
            v.id_vehiculo,
            v.marca,
            v.modelo,
            v.matricula,
            COUNT(r.id_reserva) as total_reservas
        FROM Vehiculos v
        LEFT JOIN Reservas r ON v.id_vehiculo = r.id_vehiculo
        GROUP BY v.id_vehiculo, v.marca, v.modelo, v.matricula
        ORDER BY total_reservas DESC
        LIMIT 10
    `;

    pool.query(consulta, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener vehículo más usado'
            });
        }

        res.status(200).json({
            success: true,
            data: results
        });
    });
});

// GET /api/estadisticas/resumen-general
router.get('/estadisticas/resumen-general', (req, res) => {
    const consultas = [
        // Total de reservas
        'SELECT COUNT(*) as total_reservas FROM Reservas',
        // Total de vehículos
        'SELECT COUNT(*) as total_vehiculos FROM Vehiculos',
        // Total de concesionarios
        'SELECT COUNT(*) as total_concesionarios FROM Concesionarios',
        // Total de usuarios
        'SELECT COUNT(*) as total_usuarios FROM Usuarios',
        // Vehículo más reservado
        `SELECT v.marca, v.modelo, COUNT(r.id_reserva) as veces_reservado
         FROM Vehiculos v
         LEFT JOIN Reservas r ON v.id_vehiculo = r.id_vehiculo
         GROUP BY v.id_vehiculo, v.marca, v.modelo
         ORDER BY veces_reservado DESC
         LIMIT 1`
    ];

    Promise.all(consultas.map(q => {
        return new Promise((resolve, reject) => {
            pool.query(q, (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }))
    .then(results => {
        res.status(200).json({
            success: true,
            data: {
                total_reservas: results[0].total_reservas,
                total_vehiculos: results[1].total_vehiculos,
                total_concesionarios: results[2].total_concesionarios,
                total_usuarios: results[3].total_usuarios,
                vehiculo_mas_usado: results[4] ? `${results[4].marca} ${results[4].modelo} (${results[4].veces_reservado} reservas)` : 'N/A'
            }
        });
    })
    .catch(err => {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas generales'
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