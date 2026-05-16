const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const pool = require('../db');
const requiredAdminId = require('../middleware/autorizaciones').requiredAdminId;
const Concesionario = require('../models/Concesionario');
const Vehiculo = require('../models/Vehiculo');
const Usuario = require('../models/Usuario');
const Reserva = require('../models/Reserva');
const Cliente = require('../models/Cliente');

// CONFIGURAR MULTER PARA USAR SOLO MEMORIA
// -----------------------------------------
const upload = multer({
    storage: multer.memoryStorage(), // No guarda archivos en disco
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.json') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos JSON'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

// GET de la página de administrador en español
router.get('/es-admin', requiredAdminId, (req, res) => {
    Concesionario.obtenerTodos((err, concesionarios) => {
        if (err) {
            console.error('Error al obtener todos los concesionarios: ', err);
            return res.status(500).send('Error al obtener todos los concesionarios');
        }
        Usuario.obtenerTodos((errU, usuarios) => {
            if (errU) {
                console.error('Error al obtener todos los usuarios: ', errU);
                return res.status(500).send('Error al obtener todos los usuarios');
            }
            Vehiculo.obtenerTodos((errV, vehiculos) => {
                if (errV) {
                    console.error('Error al obtener todos los vehículos: ', errV);
                    return res.status(500).send('Error al obtener todos los vehículos');
                }
                Reserva.obtenerTodas((errR, reservas) => {
                    if (errR) {
                        console.error('Error al obtener todas las reservas: ', errR);
                        return res.render('es-admin', {
                            concesionarios,
                            vehiculos,
                            usuarios,
                            reservas: [],
                            success_carga_json: req.query.success_carga_json,
                            error_carga_json: req.query.error_carga_json
                        });
                    }


                    res.render('es-admin', {
                        concesionarios,
                        vehiculos,
                        usuarios,
                        reservas: reservas || [],
                        success_carga_json: req.query.success_carga_json,
                        error_carga_json: req.query.error_carga_json
                    });
                });
            });
        });
    });
});

// POST: Verificar qué matrículas del JSON ya existen
router.post('/es-admin/verificar-matriculas', requiredAdminId, express.json(), (req, res) => {
    const { matriculas } = req.body;
    if (!matriculas || !Array.isArray(matriculas) || matriculas.length === 0) {
        return res.json({ existentes: [] });
    }
    const placeholders = matriculas.map(() => '?').join(',');
    pool.query(
        `SELECT matricula FROM Vehiculos WHERE matricula IN (${placeholders})`,
        matriculas,
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al verificar' });
            res.json({ existentes: results.map(r => r.matricula) });
        }
    );
});

// GET de la página de administrador en inglés
router.get('/en-admin', (req, res) => {
    res.render('en-admin');
});

// GET de la página de estadísticas (solo admin)
router.get('/es-estadisticas', requiredAdminId, (req, res) => {
    res.render('es-estadisticas');
});

router.get('/en-statistics', requiredAdminId, (req, res) => {
    res.render('en-statistics');
});

// RUTAS PARA CARGAR JSON
// -----------------------------------------

// POST: Procesar la carga del JSON (SIN GUARDAR ARCHIVO EN DISCO)
router.post('/es-admin/cargar-json', requiredAdminId, upload.single('jsonFile'), (req, res) => {
    const idioma = req.body.idioma || 'español';
    const rutaAdmin = idioma === 'español' ? '/es-admin' : '/en-admin';
    const actualizarExistentes = req.body.actualizar_existentes === 'true';
    console.log("Cargando JSON...");

    if (!req.file) {
        return res.redirect(`${rutaAdmin}?error_carga_json=${encodeURIComponent('No se seleccionó ningún archivo')}`);
    }

    let jsonData;
    try {
        const data = req.file.buffer.toString('utf8');
        jsonData = JSON.parse(data);
    } catch (errParse) {
        return res.redirect(`${rutaAdmin}?error_carga_json=${encodeURIComponent('El archivo JSON no es válido')}`);
    }

    if (!jsonData.concesionarios || !jsonData.usuarios || !jsonData.vehiculos) {
        return res.redirect(`${rutaAdmin}?error_carga_json=${encodeURIComponent('Estructura del JSON inválida. Debe contener al menos: concesionarios, usuarios y vehiculos')}`);
    }

    if (!jsonData.clientes) jsonData.clientes = [];
    if (!jsonData.reservas) jsonData.reservas = [];

    console.log(`   - ${jsonData.concesionarios.length} concesionarios`);
    console.log(`   - ${jsonData.usuarios.length} usuarios`);
    console.log(`   - ${jsonData.vehiculos.length} vehículos`);
    console.log(`   - ${jsonData.clientes.length} clientes`);
    console.log(`   - ${jsonData.reservas.length} reservas`);

    cargarDatosCompletos(jsonData, actualizarExistentes, (errCarga) => {
        if (errCarga) {
            console.error('Error al cargar datos:', errCarga);
            return res.redirect(`${rutaAdmin}?error_carga_json=${encodeURIComponent('Error al cargar los datos: ' + errCarga.message)}`);
        }
        res.redirect(`${rutaAdmin}?success_carga_json=${encodeURIComponent('Base de datos actualizada correctamente con ' +
            jsonData.concesionarios.length + ' concesionarios, ' +
            jsonData.usuarios.length + ' usuarios, ' +
            jsonData.vehiculos.length + ' vehículos, ' +
            jsonData.clientes.length + ' clientes y ' +
            jsonData.reservas.length + ' reservas')}`);
    });
});

// FUNCIONES AUXILIARES PARA CARGAR JSON
// -------------------------------------------------


// Función para cargar todos los datos
function cargarDatosCompletos(data, actualizarVehiculos, callback) {
    cargarConcesionarios(data.concesionarios, (err) => {
        if (err) return callback(err);
        cargarUsuarios(data.usuarios, (err) => {
            if (err) return callback(err);
            cargarVehiculos(data.vehiculos, actualizarVehiculos, (err) => {
                if (err) return callback(err);
                cargarClientes(data.clientes, (err) => {
                    if (err) return callback(err);
                    cargarReservas(data.reservas, (err) => {
                        if (err) return callback(err);
                        console.log('Todos los datos cargados correctamente');
                        callback(null);
                    });
                });
            });
        });
    });
}

function cargarConcesionarios(concesionarios, callback) {
    if (!concesionarios || concesionarios.length === 0) {
        console.log('No hay concesionarios que cargar');
        return callback(null);
    }

    let completed = 0, hasError = false, insertados = 0, actualizados = 0;

    concesionarios.forEach(c => {
        const datos = {
            nombre: c.nombre, ciudad: c.ciudad, direccion: c.direccion,
            telefono_contacto: c.telefono_contacto, latitud: c.latitud || null, longitud: c.longitud || null
        };

        const done = (err) => {
            if (err && !hasError) { hasError = true; return callback(err); }
            completed++;
            if (completed === concesionarios.length && !hasError) {
                console.log(`Concesionarios: ${insertados} insertados, ${actualizados} actualizados`);
                callback(null);
            }
        };

        pool.query('SELECT id_concesionario FROM Concesionarios WHERE nombre = ?', [c.nombre], (err, existing) => {
            if (err) return done(err);
            if (existing.length > 0) {
                actualizados++;
                Concesionario.actualizar(existing[0].id_concesionario, {
                    nombre: datos.nombre, ciudad: datos.ciudad, direccion: datos.direccion,
                    telefono: datos.telefono_contacto, latitud: datos.latitud, longitud: datos.longitud
                }, (err) => done(err));
            } else {
                insertados++;
                Concesionario.crear(datos, (err) => done(err));
            }
        });
    });
}

function cargarUsuarios(usuarios, callback) {
    if (!usuarios || usuarios.length === 0) {
        console.log('No hay usuarios que cargar');
        return callback(null);
    }

    pool.query('SELECT id_concesionario FROM Concesionarios', (err, concesionarios) => {
        if (err) return callback(err);

        const idsValidos = concesionarios.map(c => c.id_concesionario);
        let completed = 0, hasError = false, insertados = 0, actualizados = 0, omitidos = 0;
        const saltRounds = 10;

        const done = () => {
            completed++;
            if (completed === usuarios.length && !hasError) {
                console.log(`Usuarios: ${insertados} insertados, ${actualizados} actualizados, ${omitidos} omitidos`);
                callback(null);
            }
        };

        usuarios.forEach(u => {
            if (u.id_concesionario && !idsValidos.includes(u.id_concesionario)) {
                console.log(`Usuario "${u.nombre}" omitido: concesionario ${u.id_concesionario} no existe`);
                omitidos++;
                done();
                return;
            }

            pool.query('SELECT id_usuario FROM Usuarios WHERE correo = ?', [u.correo], (err, existing) => {
                if (err && !hasError) { hasError = true; return callback(err); }

                if (existing.length > 0) {
                    // Actualiza sin tocar la contraseña
                    actualizados++;
                    Usuario.actualizar(existing[0].id_usuario, {
                        nombre: u.nombre, correo: u.correo, rol: u.rol,
                        telefono: u.telefono, id_concesionario: u.id_concesionario || null
                    }, (err) => {
                        if (err && !hasError) { hasError = true; return callback(err); }
                        done();
                    });
                } else {
                    bcrypt.hash(u.contraseña, saltRounds, (err, hash) => {
                        if (err && !hasError) { hasError = true; return callback(err); }
                        insertados++;
                        Usuario.crear({
                            nombre: u.nombre, correo: u.correo, contrasenya: hash,
                            rol: u.rol, telefono: u.telefono, id_concesionario: u.id_concesionario || null
                        }, (err) => {
                            if (err && !hasError) { hasError = true; return callback(err); }
                            done();
                        });
                    });
                }
            });
        });
    });
}

function cargarVehiculos(vehiculos, actualizarExistentes, callback) {
    if (!vehiculos || vehiculos.length === 0) {
        console.log('No hay vehículos que cargar');
        return callback(null);
    }

    pool.query('SELECT id_concesionario FROM Concesionarios', (err, concesionarios) => {
        if (err) return callback(err);

        const idsValidos = concesionarios.map(c => c.id_concesionario);
        const imagenesDir = path.join(__dirname, '..', 'public', 'images', 'vehiculos');
        const vehiculosValidos = vehiculos.filter(v => idsValidos.includes(v.id_concesionario));

        let indice = 0, insertados = 0, actualizados = 0, omitidos = 0;

        const procesarSiguiente = () => {
            if (indice >= vehiculosValidos.length) {
                console.log(`Vehículos: ${insertados} insertados, ${actualizados} actualizados, ${omitidos} omitidos`);
                return callback(null);
            }

            const v = vehiculosValidos[indice];
            let imagenBuffer = null;

            if (v.imagen) {
                const imagePath = path.join(imagenesDir, v.imagen);
                if (fs.existsSync(imagePath)) {
                    try { imagenBuffer = fs.readFileSync(imagePath); }
                    catch (e) { console.error(`Error imagen ${v.imagen}`); }
                }
            }

            const datos = {
                matricula: v.matricula, marca: v.marca, modelo: v.modelo,
                anyo_matriculacion: v.anyo_matriculacion, numero_plazas: v.numero_plazas,
                autonomia_km: v.autonomia_km, color: v.color, imagen: imagenBuffer,
                estado: v.estado, id_concesionario: v.id_concesionario
            };

            const siguiente = () => { indice++; setTimeout(procesarSiguiente, 100); };

            pool.query('SELECT id_vehiculo FROM Vehiculos WHERE matricula = ?', [v.matricula], (err, existing) => {
                if (err) return callback(err);

                if (existing.length > 0 && actualizarExistentes) {
                    actualizados++;
                    const fn = imagenBuffer ? Vehiculo.actualizarConImagen : Vehiculo.actualizar;
                    fn(existing[0].id_vehiculo, datos, (err) => {
                        if (err) return callback(err);
                        siguiente();
                    });
                } else if (existing.length > 0 && !actualizarExistentes) {
                    omitidos++;
                    indice++;
                    setTimeout(procesarSiguiente, 50);
                } else {
                    const crearConReintento = (intentos = 3) => {
                        Vehiculo.crear(datos, (err) => {
                            if (err) {
                                if ((err.code === 'ECONNRESET' || err.code === 'ER_NET_PACKET_TOO_LARGE') && intentos > 0) {
                                    return setTimeout(() => crearConReintento(intentos - 1), 2000);
                                }
                                return callback(err);
                            }
                            insertados++;
                            siguiente();
                        });
                    };
                    crearConReintento();
                }
            });
        };

        procesarSiguiente();
    });
}

function cargarClientes(clientes, callback) {
    if (!clientes || clientes.length === 0) {
        console.log('No hay clientes que cargar');
        return callback(null);
    }

    let completed = 0, hasError = false, insertados = 0, actualizados = 0;

    clientes.forEach(c => {
        const done = (err) => {
            if (err && !hasError) { hasError = true; return callback(err); }
            completed++;
            if (completed === clientes.length && !hasError) {
                console.log(`Clientes: ${insertados} insertados, ${actualizados} actualizados`);
                callback(null);
            }
        };

        pool.query('SELECT id_cliente FROM Cliente WHERE correo = ?', [c.correo], (err, existing) => {
            if (err) return done(err);
            if (existing.length > 0) {
                actualizados++;
                pool.query('UPDATE Cliente SET nombre=?, telefono=? WHERE id_cliente=?',
                    [c.nombre, c.telefono || null, existing[0].id_cliente], (err) => done(err));
            } else {
                insertados++;
                Cliente.crear({ nombre: c.nombre, correo: c.correo, telefono: c.telefono }, (err) => done(err));
            }
        });
    });
}

// Cargar reservas
function cargarReservas(reservas, callback) {
    if (!reservas || reservas.length === 0) {
        console.log('No hay reservas que cargar');
        return callback(null);
    }

    pool.query('SELECT id_usuario FROM Usuarios', (err, usuarios) => {
        if (err) return callback(err);

        pool.query('SELECT id_cliente FROM Cliente', (err, clientes) => {
            if (err) return callback(err);

            pool.query('SELECT id_vehiculo FROM Vehiculos', (err, vehiculos) => {
                if (err) return callback(err);

                const idsUsuarios = usuarios.map(u => u.id_usuario);
                const idsClientes = clientes.map(c => c.id_cliente);
                const idsVehiculos = vehiculos.map(v => v.id_vehiculo);

                let completed = 0;
                let hasError = false;
                let reservasOmitidas = 0;

                reservas.forEach(r => {
                    const usuarioValido = !r.id_usuario || idsUsuarios.includes(r.id_usuario);
                    const clienteValido = idsClientes.includes(r.id_cliente);
                    const vehiculoValido = idsVehiculos.includes(r.id_vehiculo);

                    if (!usuarioValido || !clienteValido || !vehiculoValido) {
                        reservasOmitidas++;
                        completed++;
                        if (completed === reservas.length && !hasError) {
                            callback(null);
                        }
                        return;
                    }

                    const datos = {
                        id_usuario: r.id_usuario || null,
                        id_cliente: r.id_cliente,
                        id_vehiculo: r.id_vehiculo,
                        fecha_inicio: new Date(r.fecha_inicio),
                        fecha_fin: new Date(r.fecha_fin),
                        estado: r.estado || 'activa',
                        kilometros_recorridos: r.kilometros_recorridos || null,
                        incidencias_reportadas: r.incidencias_reportadas || null,
                        puntuacion: r.puntuacion || null,
                        comentario: r.comentario || null
                    };

                    Reserva.crear(datos, (err, id) => {
                        if (err && !hasError) {
                            hasError = true;
                            console.error('Error al crear reserva:', err.message);
                            return callback(err);
                        }
                        completed++;
                        if (completed === reservas.length && !hasError) {
                            callback(null);
                        }
                    });
                });
            });
        });
    });
}

module.exports = router;