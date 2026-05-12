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
    console.log("Cargando JSON...");

    if (!req.file) {
        return res.redirect(`${rutaAdmin}?error_carga_json=${encodeURIComponent('No se seleccionó ningún archivo')}`);
    }

    // El archivo está en req.file.buffer (no en disco)
    let jsonData;
    try {
        // Convertir buffer a string y parsear
        const data = req.file.buffer.toString('utf8');
        jsonData = JSON.parse(data);
    } catch (errParse) {
        console.error('Error al parsear JSON:', errParse.message);
        return res.redirect(`${rutaAdmin}?error_carga_json=${encodeURIComponent('El archivo JSON no es válido')}`);
    }

    // Validar estructura del JSON
    if (!jsonData.concesionarios || !jsonData.usuarios || !jsonData.vehiculos ||
        !jsonData.clientes || !jsonData.reservas) {
        return res.redirect(`${rutaAdmin}?error_carga_json=${encodeURIComponent('Estructura del JSON inválida. Debe contener: concesionarios, usuarios, vehiculos, clientes y reservas')}`);
    }

    console.log(`   - ${jsonData.concesionarios.length} concesionarios`);
    console.log(`   - ${jsonData.usuarios.length} usuarios`);
    console.log(`   - ${jsonData.vehiculos.length} vehículos`);
    console.log(`   - ${jsonData.clientes.length} clientes`);
    console.log(`   - ${jsonData.reservas.length} reservas`);

    // Limpiar la base de datos
    limpiarBaseDatos((errLimpieza) => {
        if (errLimpieza) {
            console.error('Error al limpiar la base de datos:', errLimpieza);
            return res.redirect(`${rutaAdmin}?error_carga_json=${encodeURIComponent('Error al limpiar la base de datos: ' + errLimpieza.message)}`);
        }

        // Cargar los nuevos datos
        cargarDatosCompletos(jsonData, (errCarga) => {
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
});

// FUNCIONES AUXILIARES PARA CARGAR JSON
// -------------------------------------------------
// Función para limpiar la base de datos
function limpiarBaseDatos(callback) {
    pool.getConnection((err, connection) => {
        if (err) return callback(err);

        //crearTablas();


        // 1. Desactivar las comprobaciones de claves foráneas
        connection.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
            if (err) {
                connection.release();
                return callback(err);
            }

            // 2. Borrar todas las filas (orden correcto por FK)
            const deleteQueries = [
                'DELETE FROM Reservas',
                'DELETE FROM Vehiculos',
                'DELETE FROM Cliente',
                'DELETE FROM Usuarios',
                'DELETE FROM Concesionarios'
            ];

            // 3. Reiniciar AUTO_INCREMENT de cada tabla
            const resetAIQueries = [
                'ALTER TABLE Reservas AUTO_INCREMENT = 1',
                'ALTER TABLE Vehiculos AUTO_INCREMENT = 1',
                'ALTER TABLE Cliente AUTO_INCREMENT = 1',
                'ALTER TABLE Usuarios AUTO_INCREMENT = 1',
                'ALTER TABLE Concesionarios AUTO_INCREMENT = 1'
            ];

            const allQueries = [...deleteQueries, ...resetAIQueries];

            let completed = 0;
            let errorOccurred = false;

            allQueries.forEach(query => {
                connection.query(query, (err) => {
                    if (err && !errorOccurred) {
                        errorOccurred = true;
                        console.error('Error ejecutando consulta:', query, err);

                        connection.query('SET FOREIGN_KEY_CHECKS = 1', () => {
                            connection.release();
                            callback(err);
                        });
                        return;
                    }

                    completed++;
                    if (completed === allQueries.length && !errorOccurred) {
                        // 4. Reactivar verificaciones de FK
                        connection.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
                            connection.release();
                            if (err) return callback(err);
                            callback(null);
                        });
                    }
                });
            });
        });
    });
}

// Función para cargar todos los datos
function cargarDatosCompletos(data, callback) {

    cargarConcesionarios(data.concesionarios, (err) => {
        if (err) return callback(err);

        cargarUsuarios(data.usuarios, (err) => {
            if (err) return callback(err);

            cargarVehiculos(data.vehiculos, (err) => {
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

// Cargar concesionarios
function cargarConcesionarios(concesionarios, callback) {
    if (!concesionarios || concesionarios.length === 0) {
        console.log('No hay concesionarios que cargar');
        return callback(null);
    }

    let completed = 0;
    let hasError = false;

    concesionarios.forEach(c => {
        const datos = {
            nombre: c.nombre,
            ciudad: c.ciudad,
            direccion: c.direccion,
            telefono_contacto: c.telefono_contacto,
            latitud: c.latitud || null,
            longitud: c.longitud || null
        };

        Concesionario.crear(datos, (err, id) => {
            if (err && !hasError) {
                hasError = true;
                return callback(err);
            }
            completed++;
            if (completed === concesionarios.length && !hasError) {
                console.log(`${concesionarios.length} concesionarios cargados`);
                callback(null);
            }
        });
    });
}

// Cargar usuarios
function cargarUsuarios(usuarios, callback) {
    if (!usuarios || usuarios.length === 0) {
        console.log('No hay usuarios que cargar');
        return callback(null);
    }

    pool.query('SELECT id_concesionario FROM Concesionarios', (err, concesionarios) => {
        if (err) {
            console.error('Error al obtener concesionarios:', err);
            return callback(err);
        }

        const idsValidos = concesionarios.map(c => c.id_concesionario);

        let completed = 0;
        let hasError = false;
        let usuariosOmitidos = 0;
        const saltRounds = 10;

        usuarios.forEach((u) => {
            if (u.id_concesionario && !idsValidos.includes(u.id_concesionario)) {
                console.log(`Usuario "${u.nombre}" omitido: concesionario ID ${u.id_concesionario} no existe`);
                usuariosOmitidos++;
                completed++;
                if (completed === usuarios.length && !hasError) {
                    console.log(`${usuarios.length - usuariosOmitidos} usuarios cargados (${usuariosOmitidos} omitidos)`);
                    callback(null);
                }
                return;
            }

            bcrypt.hash(u.contraseña, saltRounds, (err, hashedPassword) => {
                if (err && !hasError) {
                    hasError = true;
                    return callback(err);
                }

                const datos = {
                    nombre: u.nombre,
                    correo: u.correo,
                    contrasenya: hashedPassword,
                    rol: u.rol,
                    telefono: u.telefono,
                    id_concesionario: u.id_concesionario || null
                };

                Usuario.crear(datos, (err, id) => {
                    if (err && !hasError) {
                        hasError = true;
                        console.error(`Error al crear usuario "${u.nombre}":`, err.message);
                        return callback(err);
                    }
                    completed++;
                    if (completed === usuarios.length && !hasError) {
                        console.log(`${usuarios.length - usuariosOmitidos} usuarios cargados (${usuariosOmitidos} omitidos)`);
                        callback(null);
                    }
                });
            });
        });
    });
}

// Cargar vehículos
function cargarVehiculos(vehiculos, callback) {
    if (!vehiculos || vehiculos.length === 0) {
        console.log('No hay vehículos que cargar');
        return callback(null);
    }


    pool.query('SELECT id_concesionario FROM Concesionarios', (err, concesionarios) => {
        if (err) {
            console.error('Error al obtener concesionarios:', err);
            return callback(err);
        }

        const idsValidos = concesionarios.map(c => c.id_concesionario);
        const imagenesDir = path.join(__dirname, '..', 'public', 'images', 'vehiculos');

        const vehiculosValidos = vehiculos.filter(v => {
            if (!idsValidos.includes(v.id_concesionario)) {
                return false;
            }
            return true;
        });

        let indice = 0;
        let vehiculosCreados = 0;
        let erroresImagen = 0;

        const procesarSiguienteVehiculo = () => {
            if (indice >= vehiculosValidos.length) {
                return callback(null);
            }

            const v = vehiculosValidos[indice];
            let imagenBuffer = null;

            if (v.imagen) {
                const imagePath = path.join(imagenesDir, v.imagen);
                if (fs.existsSync(imagePath)) {
                    try {
                        imagenBuffer = fs.readFileSync(imagePath);
                    } catch (error) {
                        console.error(`Error al leer imagen ${v.imagen}:`, error.message);
                        erroresImagen++;
                    }
                } else {
                    console.log(`No se encontró la imagen: ${v.imagen}`);
                    erroresImagen++;
                }
            }

            const datos = {
                matricula: v.matricula,
                marca: v.marca,
                modelo: v.modelo,
                anyo_matriculacion: v.anyo_matriculacion,
                numero_plazas: v.numero_plazas,
                autonomia_km: v.autonomia_km,
                color: v.color,
                imagen: imagenBuffer,
                estado: v.estado,
                id_concesionario: v.id_concesionario
            };

            const crearConReintento = (intentos = 3) => {
                Vehiculo.crear(datos, (err, id) => {
                    if (err) {
                        if ((err.code === 'ECONNRESET' || err.code === 'ER_NET_PACKET_TOO_LARGE') && intentos > 0) {
                            console.log(`Error en "${v.matricula}". Reintentando (${4 - intentos}/3)...`);
                            setTimeout(() => crearConReintento(intentos - 1), 2000);
                            return;
                        }

                        console.error(`Error al crear vehículo "${v.matricula}":`, err.message);
                        return callback(err);
                    }

                    vehiculosCreados++;

                    if (vehiculosCreados % 5 === 0) {
                        console.log(`Progreso: ${vehiculosCreados}/${vehiculosValidos.length} vehículos`);
                    }

                    indice++;
                    setTimeout(procesarSiguienteVehiculo, 100);
                });
            };

            crearConReintento();
        };

        procesarSiguienteVehiculo();
    });
}

// Cargar clientes
function cargarClientes(clientes, callback) {
    if (!clientes || clientes.length === 0) {
        console.log('No hay clientes que cargar');
        return callback(null);
    }

    let completed = 0;
    let hasError = false;

    clientes.forEach(c => {
        const datos = {
            nombre: c.nombre,
            correo: c.correo,
            telefono: c.telefono
        };

        Cliente.crear(datos, (err, id) => {
            if (err && !hasError) {
                hasError = true;
                return callback(err);
            }
            completed++;
            if (completed === clientes.length && !hasError) {
                console.log(`${clientes.length} clientes cargados`);
                callback(null);
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