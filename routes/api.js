const express = require('express');
const router = express.Router();
const pool = require('../db');
const Vehiculo = require('../models/Vehiculo');
const Reserva = require('../models/Reserva');
const { validateReservation, checkDealerDependencies } = require('../middleware/validations');
const requiredAdminId = require('../middleware/autorizaciones').requiredAdminId;
const Concesionario = require('../models/Concesionario');
const Usuario = require('../models/Usuario');

//-----------------------------------------------------------
// USUARIOS

// DELETE /api/usuarios/:id - Eliminar usuario (RESTful)
router.delete('/usuarios/:id', requiredAdminId, (req, res) => {
    const id = req.params.id;
    console.log('Se inicia la eliminación del usuario con ID: ' + id);

    Usuario.eliminar(id, (err, filasAfectadas) => {
        if (err) {
            console.error(`Error al eliminar el usuario con ID ${id}:`, err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar el usuario',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }

        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                message: `Usuario con ID ${id} no encontrado`
            });
        }

        console.log(`Usuario eliminado con ID: ${id}`);

        res.status(200).json({
            success: true,
            message: 'Usuario eliminado correctamente',
            id: parseInt(id)
        });
    });
});

//-----------------------------------------------------------
// CONCESIONARIOS

// DELETE /api/concesionarios/:id - Eliminar concesionario (RESTful)
router.delete('/concesionarios/:id', requiredAdminId, checkDealerDependencies, (req, res) => {
    const id = req.params.id;

    Concesionario.eliminar(id, (err, filasAfectadas) => {
        if (err) {
            console.error(`Error al eliminar el concesionario con ID ${id}:`, err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar el concesionario',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }

        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                message: `Concesionario con ID ${id} no encontrado`
            });
        }

        console.log(`Concesionario eliminado con ID: ${id}`);

        res.status(200).json({
            success: true,
            message: 'Concesionario eliminado correctamente',
            id: parseInt(id)
        });
    });
});

//-----------------------------------------------------------
// ENDPOINTS DE VEHÍCULOS

// GET /api/vehiculos - Obtener todos los vehículos con filtros
router.get('/vehiculos', (req, res) => {
    // Si no hay filtros, usar el modelo directamente
    if (Object.keys(req.query).length === 0) {
        return Vehiculo.obtenerTodosSinImagen((err, vehiculos) => {
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
    }

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

// DELETE /api/vehiculos/:id - Eliminar vehículo 
router.delete('/vehiculos/:id', requiredAdminId, (req, res) => {
    const id = req.params.id;

    Vehiculo.eliminar(id, (err, filasAfectadas) => {
        if (err) {
            console.error(`Error al eliminar el vehículo con ID ${id}:`, err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar el vehículo',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }

        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                message: `Vehículo con ID ${id} no encontrado`
            });
        }

        console.log(`Vehículo eliminado con ID: ${id}`);

        res.status(200).json({
            success: true,
            message: 'Vehículo eliminado correctamente',
            id: parseInt(id)
        });
    });
});
//-----------------------------------------------------------
// ENDPOINTS DE RESERVAS

// GET /api/reservas - Obtener todas las reservas
router.get('/reservas', (req, res) => {
    Reserva.obtenerTodas((err, reservas) => {
        if (err) {
            console.error('Error al obtener reservas:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reservas',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }

        res.status(200).json({
            success: true,
            data: reservas,
            count: reservas.length
        });
    });
});

// GET /api/reservas/:id - Obtener una reserva específica
router.get('/reservas/:id', (req, res) => {
    const id = req.params.id;

    Reserva.obtenerPorId(id, (err, reserva) => {
        if (err) {
            console.error('Error al obtener reserva:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reserva',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }

        if (!reserva) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: reserva
        });
    });
});

// POST /api/reservas - Crear nueva reserva con validaciones
router.post('/reservas', validateReservation, (req, res) => {
    const datosReserva = {
        ...req.validatedData,
        estado: 'activa'
    };

    // Verificar disponibilidad del vehículo
    Reserva.verificarDisponibilidad(
        datosReserva.id_vehiculo,
        datosReserva.fecha_inicio,
        datosReserva.fecha_fin,
        null,
        (err, disponible) => {
            if (err) {
                console.error('Error al verificar disponibilidad:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al verificar disponibilidad'
                });
            }

            if (!disponible) {
                return res.status(400).json({
                    success: false,
                    message: 'El vehículo no está disponible en esas fechas'
                });
            }

            // Crear reserva
            Reserva.crear(datosReserva, (err, idReserva) => {
                if (err) {
                    console.error('Error al crear reserva:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al crear reserva'
                    });
                }

                // Actualizar estado del vehículo
                Vehiculo.cambiarEstado(datosReserva.id_vehiculo, 'reservado', (errUpdate) => {
                    if (errUpdate) {
                        console.error('Error al actualizar estado del vehículo:', errUpdate);
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Reserva creada correctamente',
                        data: {
                            id_reserva: idReserva,
                            ...datosReserva,
                            estado: 'activa'
                        }
                    });
                });
            });
        }
    );
});

// PUT /api/reservas/:id - Actualizar una reserva
router.put('/reservas/:id', validateReservation, (req, res) => {
    const id = req.params.id;
    const datosActualizados = req.validatedData;

    // Verificar que la reserva existe
    Reserva.obtenerPorId(id, (err, reserva) => {
        if (err) {
            console.error('Error al obtener reserva:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reserva'
            });
        }

        if (!reserva) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        // Verificar disponibilidad (excluyendo esta reserva)
        Reserva.verificarDisponibilidad(
            datosActualizados.id_vehiculo,
            datosActualizados.fecha_inicio,
            datosActualizados.fecha_fin,
            id,
            (err, disponible) => {
                if (err) {
                    console.error('Error al verificar disponibilidad:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al verificar disponibilidad'
                    });
                }

                if (!disponible) {
                    return res.status(400).json({
                        success: false,
                        message: 'El vehículo no está disponible en esas fechas'
                    });
                }

                // Actualizar reserva
                Reserva.actualizar(id, datosActualizados, (err, affectedRows) => {
                    if (err) {
                        console.error('Error al actualizar reserva:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error al actualizar reserva'
                        });
                    }

                    // Si se finaliza o cancela, liberar el vehículo
                    if (datosActualizados.estado === 'finalizada' ||
                        datosActualizados.estado === 'cancelada') {
                        Vehiculo.cambiarEstado(reserva.id_vehiculo, 'disponible', (errUpdate) => {
                            if (errUpdate) {
                                console.error('Error al liberar vehículo:', errUpdate);
                            }
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Reserva actualizada correctamente'
                    });
                });
            }
        );
    });
});

// DELETE /api/reservas/:id - Eliminar una reserva
router.delete('/reservas/:id', (req, res) => {
    const id = req.params.id;

    // Obtener información de la reserva antes de eliminarla
    Reserva.obtenerPorId(id, (err, reserva) => {
        if (err) {
            console.error('Error al obtener reserva:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reserva'
            });
        }

        if (!reserva) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        // Eliminar reserva
        Reserva.eliminar(id, (err, affectedRows) => {
            if (err) {
                console.error('Error al eliminar reserva:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al eliminar reserva'
                });
            }

            // Liberar vehículo si la reserva estaba activa
            if (reserva.estado === 'activa') {
                Vehiculo.cambiarEstado(reserva.id_vehiculo, 'disponible', (errUpdate) => {
                    if (errUpdate) {
                        console.error('Error al liberar vehículo:', errUpdate);
                    }
                });
            }

            res.status(200).json({
                success: true,
                message: 'Reserva eliminada correctamente'
            });
        });
    });
});

//-----------------------------------------------------------
// ENDPOINTS DE ACCESIBILIDAD

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

//-----------------------------------------------------------
// ENDPOINTS DE ESTADÍSTICAS

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
        'SELECT COUNT(*) as total_usuarios FROM Usuarios'
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
                    total_usuarios: results[3].total_usuarios
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