const express = require('express');
const multer = require('multer');
const router = express.Router();
const pool = require('../db');
const requiredAdminId = require('../middleware/autorizaciones').requiredAdminId;
const Concesionario = require('../models/Concesionario');
const Vehiculo = require('../models/Vehiculo');

const { validateVehicle } = require('../middleware/validations');

// Configuración de multer para almacenar archivos en memoria con formato BLOB ()

// Usamos memoria para guardar los archivos
// Se permite únicamente formato PNG
const multerFactory = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'image/png') {
            req.fileValidationError = 'FORMATO_INVALIDO_PNG';
            return cb(null, false);
        }
        cb(null, true);
    }
});

//GET de la página de vehículos con filtros en español
router.get('/es-vehiculos', (req, res) => {
    // Si es admin, mostrar todos los vehículos; si no, solo disponibles
    const esAdmin = req.session.usuario && req.session.usuario.rol === 'admin';

    if (esAdmin) {
        Vehiculo.obtenerTodos((err, vehiculos) => {
            if (err) {
                console.error('Error al obtener los vehículos:', err);
                return res.status(500).send('Error al cargar vehículos');
            }
            res.render('es-vehiculos', { vehiculos });
        });
    } else {
        Vehiculo.obtenerDisponibles((err, vehiculos) => {
            if (err) {
                console.error('Error al obtener los vehículos:', err);
                return res.status(500).send('Error al cargar vehículos');
            }
            res.render('es-vehiculos', { vehiculos });
        });
    }
});

//GET para obtener la imágen PNG desde la BD según el ID del vehículo
router.get('/es-vehiculos/imagen/:id', (req, res) => {
    const id = req.params.id;

    Vehiculo.obtenerImagen(id, (err, imagen) => {
        if (err || !imagen) {
            console.error('Error al obtener imagen:', err);
            return res.status(404).send('Imagen no encontrada');
        }

        res.contentType('image/png');
        res.end(imagen);
    });
});

//GET del form de crear un nuevo vehículo como administrador
// Esto lo ponemos antes que /:id porque si no accede antes al get de :id que al de nuevo_vehiculo
router.get('/es-vehiculos/nuevo-vehiculo', requiredAdminId, (req, res) => {
    //Cargamos concesionarios para el select del formulario
    Concesionario.obtenerTodos((errConc, concesionarios) => {
        if (errConc) concesionarios = [];
        //Si todo sale bien se muestra la vista del form para el nuevo vehículo a registrar
        //Vista en español
        res.render('es-vehiculo-form', {
            concesionarios,
            editar: false,
            vehiculo: null,
            error: null
        });
    });
});

//POST para crear un nuevo vehículo como administrador
router.post('/es-vehiculos/nuevo-vehiculo', requiredAdminId, validateVehicle, multerFactory.single('imagen'), (req, res) => {
    //Validación del formato PNG
    if (req.fileValidationError === 'FORMATO_INVALIDO_PNG' ||
        (req.file && req.file.mimetype !== 'image/png')) {

        return Concesionario.obtenerTodos((errConc, concesionarios) => {
            if (errConc) concesionarios = [];
            //Si no es de formato PNG se envía el error a la vista
            return res.render('es-vehiculo-form', {
                concesionarios,
                editar: false,
                vehiculo: null,
                error: 'Solo se admite formato PNG'
            });
        });
    }

    // Usar datos validados
    const { matricula, marca, modelo, anyo_matriculacion, numero_plazas, autonomia_km, color, estado, id_concesionario } = req.validatedData;

    //Imagen obligatoria
    if (!req.file) {
        return res.status(400).send('La imagen es obligatoria');
    }

    // Crear vehículo usando el modelo
    Vehiculo.crear({
        matricula,
        marca,
        modelo,
        anyo_matriculacion,
        numero_plazas,
        autonomia_km,
        color,
        imagen: req.file.buffer,
        estado,
        id_concesionario
    }, (err, insertId) => {
        if (err) {
            // Manejar error de matrícula duplicada
            if (err.code === 'ER_DUP_ENTRY') {
                return Concesionario.obtenerTodos((errConc, concesionarios) => {
                    if (errConc) concesionarios = [];

                    return res.render('es-vehiculo-form', {
                        concesionarios,
                        editar: false,
                        vehiculo: null,
                        error: `La matrícula ${matricula} ya existe en el sistema`
                    });
                });
            }

            console.error('Error al crear el vehículo:', err);
            return res.status(500).send('Error al crear el vehículo');
        }

        console.log(`Vehículo creado con ID: ${insertId}`);
        res.redirect('/es-vehiculos');
    });
});

//GET de la página de detalles de un vehículo por su ID
router.get('/es-vehiculos/:id', (req, res) => {
    const id = req.params.id;

    Vehiculo.obtenerPorId(id, (err, vehiculo) => {
        if (err) {
            //Si hay algún error al buscar el vehículo, se muestra en la vista y por consola
            console.log('Error al obtener un vehículo:');
            return res.status(500).send('Error al cargar el vehículo');
        }

        //Si no se encuentra un vehículo con esa ID en la BD, se muestra un error404
        if (!vehiculo) {
            return res.status(404).send('Vehículo no encontrado');
        }

        //Si todo va bien se muestra la página de detalles del vehículo con esa ID
        res.render('es-vehiculo-detalles', { vehiculo });
    });
});

router.get('/es-vehiculos/:id/editar', requiredAdminId, (req, res) => {
    const id = req.params.id;

    Concesionario.obtenerTodos((errConc, concesionarios) => {
        if (errConc) concesionarios = [];

        Vehiculo.obtenerPorId(id, (err, vehiculo) => {
            if (err) {
                console.error('Error al eliminar un vehículo:', err);
                return res.status(500).send('Error al cargar el vehículo');
            }

            if (!vehiculo) {
                return res.status(404).send('Vehículo no encontrado');
            }

            console.log(`Vehículo con ID ${id} modificado`);

            res.render('es-vehiculo-form', {
                concesionarios,
                editar: true,
                vehiculo,
                error: null
            });
        });
    });

});

router.post('/es-vehiculos/:id/editar', requiredAdminId, validateVehicle, multerFactory.single('imagen'), (req, res) => {
    const id = req.params.id;

    if (req.fileValidationError === 'FORMATO_INVALIDO_PNG' ||
        (req.file && req.file.mimetype !== 'image/png')) {

        return Concesionario.obtenerTodos((errConc, concesionarios) => {
            if (errConc) concesionarios = [];

            return res.render('es-vehiculo-form', {
                concesionarios,
                editar: false,
                vehiculo: null,
                error: 'Solo se admite formato PNG'
            });
        });
    }

    // Usar datos validados
    const { matricula, marca, modelo, anyo_matriculacion, numero_plazas, autonomia_km, color, estado, id_concesionario } = req.validatedData;

    // Si hay nueva imagen, usar actualizarConImagen, sino actualizar sin imagen
    if (req.file) {
        Vehiculo.actualizarConImagen(id, {
            matricula,
            marca,
            modelo,
            anyo_matriculacion,
            numero_plazas,
            autonomia_km,
            color,
            imagen: req.file.buffer,
            estado,
            id_concesionario
        }, (err, filasAfectadas) => {
            if (err) {
                console.error('Error al actualizar el vehículo:', err);
                return res.status(500).send('Error al actualizar');
            }

            console.log(`Vehículo actualizado con ID: ${id}`);
            res.redirect('/es-vehiculos');
        });
    } else {
        Vehiculo.actualizar(id, {
            matricula,
            marca,
            modelo,
            anyo_matriculacion,
            numero_plazas,
            autonomia_km,
            color,
            estado,
            id_concesionario
        }, (err, filasAfectadas) => {
            if (err) {
                console.error('Error al actualizar el vehículo:', err);
                return res.status(500).send('Error al actualizar');
            }

            console.log(`Vehículo actualizado con ID: ${id}`);
            res.redirect('/es-vehiculos');
        });
    }
});

/*
router.post('/es-vehiculos/:id/eliminar', requiredAdminId, (req, res) => {
    const id = req.params.id;

    Vehiculo.eliminar(id, (err, filasAfectadas) => {
        if (err) {
            console.error(`Error al eliminar el vehículo con ID ${id}: `, err);
            return res.status(500).send(`Error al eliminar el vehículo con ID ${id}: `);
        }

        if (filasAfectadas === 0) {
            return res.status(404).send(`Vehículo con ID ${id} no encontrado`);
        }

        console.log(`vehículo eliminado con ID: ${id}`);

        //Hay que cambiarlo con ajax ??
        res.redirect('/es-admin');
    });
});
*/

// ============================================
// VERSIÓN EN INGLÉS
// ============================================

//GET de la página de vehículos con filtros en inglés
router.get('/en-vehicles', (req, res) => {
    // Si es admin, mostrar todos los vehículos; si no, solo disponibles
    const esAdmin = req.session.usuario && req.session.usuario.rol === 'admin';

    if (esAdmin) {
        Vehiculo.obtenerTodos((err, vehiculos) => {
            if (err) {
                console.error('Error al obtener los vehículos:', err);
                return res.status(500).send('Error loading vehicles');
            }
            res.render('en-vehicles', { vehiculos });
        });
    } else {
        Vehiculo.obtenerDisponibles((err, vehiculos) => {
            if (err) {
                console.error('Error al obtener los vehículos:', err);
                return res.status(500).send('Error loading vehicles');
            }
            res.render('en-vehicles', { vehiculos });
        });
    }
});

//GET para obtener la imágen PNG desde la BD según el ID del vehículo
router.get('/en-vehicles/imagen/:id', (req, res) => {
    const id = req.params.id;

    obtenerImagen(id, (err, imagen) => {
        if (err || !imagen) {
            console.error('Error al obtener imagen:', err);
            return res.status(404).send('Image not found');
        }

        //Siempre es PNG
        res.contentType('image/png');
        res.end(imagen);
    });
});

//GET del form de crear un nuevo vehículo como administrador
// Esto lo ponemos antes que /:id porque si no accede antes al get de :id que al de nuevo_vehiculo
router.get('/en-vehicles/new-vehicle', requiredAdminId, (req, res) => {
    //Cargamos concesionarios para el select del formulario
    Concesionario.obtenerTodos((errConc, concesionarios) => {
        if (errConc) concesionarios = [];
        //Si todo sale bien se muestra la vista del form para el nuevo vehículo a registrar
        //Vista en inglés
        res.render('en-vehicle-form', { concesionarios, editar: false, vehiculo: null, error: null });
    });
});

//POST para crear un nuevo vehículo como administrador
router.post('/en-vehicles/new-vehicle', requiredAdminId, multerFactory.single('imagen'), (req, res) => {
    //Validación del formato PNG
    if (req.fileValidationError === 'FORMATO_INVALIDO_PNG' ||
        (req.file && req.file.mimetype !== 'image/png')) {

        return Concesionario.obtenerTodos((errConc, concesionarios) => {
            if (errConc) concesionarios = [];
            //Si no es de formato PNG se envía el error a la vista
            return res.render('en-vehicle-form', {
                concesionarios,
                editar: false,
                vehiculo: null,
                error: 'Only PNG format is allowed'
            });
        });
    }

    //Datos del formulario
    const matricula = req.body.matricula;
    const marca = req.body.marca;
    const modelo = req.body.modelo;
    const anyoMatri = req.body.anyoMatri;
    const numPlazas = req.body.numPlazas;
    const autonomia = req.body.autonomia;
    const color = req.body.color;
    const estado = req.body.estado;
    const concesionario = req.body.concesionario;

    //Validación de que los valores estén completos
    if (!matricula || !marca || !modelo || !anyoMatri || !numPlazas || !color || !concesionario) {
        return res.status(400);
    }

    //Imagen obligatoria
    if (!req.file) {
        return res.status(400).send('Image is required');
    }

    // El archivo está en memoria como Buffer (siempre PNG)
    const imagenBuffer = req.file.buffer;

    //Consulta para insertar el vehículo nuevo
    const consulta = `
        INSERT INTO Vehiculos 
        (matricula, marca, modelo, anyo_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    pool.query(consulta, [matricula, marca, modelo, anyoMatri, numPlazas, autonomia, color, imagenBuffer || null, estado, concesionario], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                //Error si la matricula a insertar ya está registrada en la BD
                Concesionario.obtenerTodos((errConc, concesionarios) => {
                    if (errConc) concesionarios = [];

                    return res.render('en-vehicle-form', {
                        concesionarios,
                        editar: false,
                        vehiculo: null,
                        error: `License plate ${matricula} already exists in the system`
                    });
                });
                return;
            }
            //Si hay algún error al insertar el vehículo en la BD, se lanza el error a la vista y se muestra por consola
            console.error('Error creating vehicle:', err);
            return res.status(500);
        }

        console.log(`Vehicle created with ID: ${result.insertId}`);
        res.redirect('/en-vehicles');
    });
});

//GET de la página de detalles de un vehículo por su ID
router.get('/en-vehicles/:id', (req, res) => {
    const id = req.params.id;

    //Consulta para buscar el vehículo con esa ID
    const consulta = `
        SELECT v.*, c.nombre AS nombre_concesionario
        FROM Vehiculos v
        LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
        WHERE v.id_vehiculo = ?
    `;
    pool.query(consulta, [id], (err, resultados) => {
        if (err) {
            //Si hay algún error al buscar el vehículo, se muestra en la vista y por consola
            console.log('Error getting vehicle:');
            return res.status(500);
        }

        //Si no se encuentra un vehículo con esa ID en la BD, se muestra un error404
        if (resultados.length === 0) return res.status(404);
        const vehiculo = resultados[0];

        //Si todo va bien se muestra la página de detalles del vehículo con esa ID
        res.render('en-vehicle-details', { vehiculo });
    });
});

router.get('/en-vehicles/:id/edit', requiredAdminId, (req, res) => {
    Concesionario.obtenerTodos((errConc, concesionarios) => {
        if (errConc) concesionarios = [];
        const consulta = `
            SELECT v.*, c.nombre AS nombre_concesionario, c.ciudad AS ciudad_concesionario
            FROM Vehiculos v
            LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
            WHERE v.id_vehiculo = ?
        `;
        pool.query(consulta, [req.params.id], (err, resultados) => {
            if (err) {
                console.error('Error deleting vehicle:', err);
                return res.status(500);
            }

            const vehiculo = resultados[0];

            if (!vehiculo) {
                return res.status(404);
            }
            console.log(vehiculo);

            res.render('en-vehicle-form', { concesionarios, editar: true, vehiculo, error: null });
        });
    });

});

router.post('/en-vehicles/:id/edit', requiredAdminId, multerFactory.single('imagen'), (req, res) => {

    if (req.fileValidationError === 'FORMATO_INVALIDO_PNG' ||
        (req.file && req.file.mimetype !== 'image/png')) {

        return Concesionario.obtenerTodos((errConc, concesionarios) => {
            if (errConc) concesionarios = [];

            return res.render('en-vehicle-form', {
                concesionarios,
                editar: false,
                vehiculo: null,
                error: 'Only PNG format is allowed'
            });
        });
    }

    const id = req.params.id;
    const matricula = req.body.matricula;
    const marca = req.body.marca;
    const modelo = req.body.modelo;
    const anyoMatri = req.body.anyoMatri;
    const numPlazas = req.body.numPlazas;
    const color = req.body.color;
    const autonomia = req.body.autonomia;
    const estado = req.body.estado;
    const concesionario = req.body.concesionario;

    if (!matricula || !marca || !modelo || !anyoMatri || !numPlazas || !color || !autonomia || !estado || !concesionario) {
        return res.status(400);
    }

    // Si hay nueva imagen, actualizarla; si no, mantener la existente
    let consulta, params;

    if (req.file) {
        const imagenBuffer = req.file.buffer;

        console.log(`New PNG image uploaded: ${req.file.originalname}`);
        console.log(`Size: ${req.file.size} bytes`);

        consulta = `
            UPDATE Vehiculos 
            SET matricula = ?,
                marca = ?,
                modelo = ?,
                anyo_matriculacion = ?,
                numero_plazas = ?,
                autonomia_km = ?,
                color = ?,
                imagen = ?,
                estado = ?,
                id_concesionario = ?
            WHERE id_vehiculo = ?
        `;
        params = [matricula, marca, modelo, anyoMatri, numPlazas, autonomia, color, imagenBuffer, estado, concesionario, id];
    } else {
        // No se actualiza la imagen
        consulta = `
            UPDATE Vehiculos 
            SET matricula = ?,
                marca = ?,
                modelo = ?,
                anyo_matriculacion = ?,
                numero_plazas = ?,
                autonomia_km = ?,
                color = ?,
                estado = ?,
                id_concesionario = ?
            WHERE id_vehiculo = ?
        `;
        params = [matricula, marca, modelo, anyoMatri, numPlazas, autonomia, color, estado, concesionario, id];
    }

    pool.query(consulta, params, (err, result) => {
        if (err) {
            console.error('Error updating vehicle:', err);
            return res.status(500).send('Update error');
        }

        console.log(`Vehicle updated with ID: ${id}`);
        res.redirect('/en-vehicles');
    });
});
/*
router.post('/en-vehicles/:id/delete', requiredAdminId, (req, res) => {
    const id = req.params.id;

    Vehiculo.eliminar(id, (err, filasAfectadas) => {
        if (err) {
            console.error(`Error al eliminar el vehículo con ID ${id}: `, err);
            return res.status(500).send(`Error al eliminar el vehículo con ID ${id}: `);
        }

        if (filasAfectadas === 0) {
            return res.status(404).send(`Vehículo con ID ${id} no encontrado`);
        }

        console.log(`vehículo eliminado con ID: ${id}`);

        //Hay que cambiarlo con ajax ??
        // Redirigir a la página anterior
        const previousPage = req.get('Referer') || '/'; // fallback a home
        res.redirect(previousPage);

    });
});
*/

module.exports = router;