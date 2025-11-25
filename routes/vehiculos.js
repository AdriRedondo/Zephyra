const express = require('express');
const multer = require('multer');
const router = express.Router();
const pool = require('../db');

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

//GET de la página de vehículos con fitros en español
router.get('/es-vehiculos', (req, res) => {
    //Filtros recibidos
    const marcaFiltro = req.query.marca;
    const modeloFiltro = req.query.modelo;
    const plazasFiltro = req.query.plazas;
    const concesionarioFiltro = req.query.concesionario;
    const estadoFiltro = req.query.estado;

    //Consulta que une vehículos con concesionarios para obtener el nombre
    //JOIN con la tabla Concesionarios para obtener el nombre
    const consulta = `
        SELECT v.*, c.nombre AS nombre_concesionario
        FROM Vehiculos v
        LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
    `;
    pool.query(consulta, (err, vehiculos) => {
        if (err) {
            console.error('Error al obtener los vehículos:', err);
            return res.status(500);
        }

        //Filtros aplicados 
        let vehiculosFiltrados = vehiculos;

        if (marcaFiltro) {
            vehiculosFiltrados = vehiculosFiltrados.filter(
                v => v.marca.toLowerCase() === marcaFiltro.toLowerCase()
            );
        }

        if (modeloFiltro) {
            vehiculosFiltrados = vehiculosFiltrados.filter(
                v => v.modelo.toLowerCase() === modeloFiltro.toLowerCase()
            );
        }

        if (plazasFiltro) {
            vehiculosFiltrados = vehiculosFiltrados.filter(
                v => v.numero_plazas === parseInt(plazasFiltro)
            );
        }

        if (concesionarioFiltro) {
            vehiculosFiltrados = vehiculosFiltrados.filter(
                v => v.nombre_concesionario && v.nombre_concesionario.toLowerCase() === concesionarioFiltro.toLowerCase()
            );
        }

        if (estadoFiltro) {
            vehiculosFiltrados = vehiculosFiltrados.filter(
                v => v.estado && v.estado.toLowerCase() === estadoFiltro.toLowerCase()
            );
        }

        //SI todo sale bien se muestra la vista de vehículos
        if (req.body.idioma === 'english')
            //Vista en inglés
            res.render('en-vehicles', {
                vehiculos: vehiculos,
                vehiculosFiltrados: vehiculosFiltrados,
                filtros: {
                    marca: marcaFiltro,
                    modelo: modeloFiltro,
                    plazas: plazasFiltro,
                    concesionario: concesionarioFiltro,
                    estado: estadoFiltro
                }
            });
        else
            //Vista en español
            res.render('es-vehiculos', {
                vehiculos: vehiculos,
                vehiculosFiltrados: vehiculosFiltrados,
                filtros: {
                    marca: marcaFiltro,
                    modelo: modeloFiltro,
                    plazas: plazasFiltro,
                    concesionario: concesionarioFiltro,
                    estado: estadoFiltro
                }
            });
    });
});

//GET para obtener la imágen PNG desde la BD según el ID del vehículo
router.get('/es-vehiculos/imagen/:id', (req, res) => {
    const id = req.params.id;

    obtenerImagen(id, (err, imagen) => {
        if (err || !imagen) {
            console.error('Error al obtener imagen:', err);
            return res.status(404).send('Imagen no encontrada');
        }

        //Siempre es PNG
        res.contentType('image/png');
        res.end(imagen);
    });
});

//GET del form de crear un nuevo vehículo como administrador
// Esto lo ponemos antes que /:id porque si no accede antes al get de :id que al de nuevo_vehiculo
router.get('/es-vehiculos/nuevo-vehiculo', (req, res) => {
    const language = req.body.idioma;

    //Cargamos concesionarios para el select del formulario
    obtenerConcesionarios((errConc, concesionarios) => {
        if (errConc) concesionarios = [];
        //Si todo sale bien se muestra la vista del form para el nuevo vehículo a registrar
        if (language === 'english')
            //Vista en inglés
            res.render('en-vehicle-form', { concesionarios, editar: false, vehiculo: null, error: null });
        else
            //Vista en español
            res.render('es-vehiculo-form', { concesionarios, editar: false, vehiculo: null, error: null });
    });
});

//POST para crear un nuevo vehículo como administrador
router.post('/es-vehiculos/nuevo-vehiculo', multerFactory.single('imagen'), (req, res) => {
    //Validación del formato PNG
    if (req.fileValidationError === 'FORMATO_INVALIDO_PNG' ||
        (req.file && req.file.mimetype !== 'image/png')) {

        return obtenerConcesionarios((errConc, concesionarios) => {
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

    //Imagen obliogatoria
    if (!req.file) {
        return res.status(400).send('La imagen es obligatoria');
    }

    // El archivo está en memoria como Buffer (siempre PNG)
    const imagenBuffer = req.file.buffer;

    //COnsulta para insertar el vehículo nuevo
    const consulta = `
        INSERT INTO Vehiculos 
        (matricula, marca, modelo, anyo_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    pool.query(consulta, [matricula, marca, modelo, anyoMatri, numPlazas, autonomia, color, imagenBuffer || null, estado, concesionario], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                //Error si la matricula a isnertar ya está registrada en la BD
                obtenerConcesionarios((errConc, concesionarios) => {
                    if (errConc) concesionarios = [];

                    return res.render('es-vehiculo-form', {
                        concesionarios,
                        editar: false,
                        vehiculo: null,
                        error: `La matrícula ${matricula} ya existe en el sistema`
                    });
                });
                return;
            }
            //Si hay algún error al insertar el vehículo en la BD, se lanza el error a la vista y se muestra por consola
            console.error('Error al crear el vehículo:', err);
            return res.status(500);
        }

        console.log(`Vehículo creado con ID: ${result.insertId}`);
        res.redirect('/es-vehiculos');
    });
});

//GET de la página de detalles de un vehículo por su ID
router.get('/es-vehiculos/:id', (req, res) => {
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
            console.log('Error al obtener un vehículo:');
            return res.status(500);
        }

        //Si no se encuentra un vehículo con esa ID en la BD, se muestra un error404
        if (resultados.length === 0) return res.status(404);
        const vehiculo = resultados[0];

        //Si todo va bien se muestra la página de detalles del vehículo con esa ID
        res.render('es-vehiculo-detalles', { vehiculo });
    });
});

router.get('/es-vehiculos/:id/editar', (req, res) => {
    const language = req.body.idioma;

    obtenerConcesionarios((errConc, concesionarios) => {
        if (errConc) concesionarios = [];
        const consulta = `
            SELECT v.*, c.nombre AS nombre_concesionario, c.ciudad AS ciudad_concesionario
            FROM Vehiculos v
            LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
            WHERE v.id_vehiculo = ?
        `;
        pool.query(consulta, [req.params.id], (err, resultados) => {
            if (err) {
                console.error('Error al eliminar un vehículo:', err);
                return res.status(500);
            }

            const vehiculo = resultados[0];

            if (!vehiculo) {
                return res.status(404);
            }
            console.log(vehiculo);

            if (language === 'english')
                res.render('en-vehicle-form', { concesionarios, editar: true, vehiculo, error: null });
            else
                res.render('es-vehiculo-form', { concesionarios, editar: true, vehiculo, error: null });
        });
    });

});

router.post('/es-vehiculos/:id/editar', multerFactory.single('imagen'), (req, res) => {

    if (req.fileValidationError === 'FORMATO_INVALIDO_PNG' ||
        (req.file && req.file.mimetype !== 'image/png')) {

        return obtenerConcesionarios((errConc, concesionarios) => {
            if (errConc) concesionarios = [];

            return res.render('es-vehiculo-form', {
                concesionarios,
                editar: false,
                vehiculo: null,
                error: 'Solo se admite formato PNG'
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

        console.log(`Nueva imagen PNG subida: ${req.file.originalname}`);
        console.log(`Tamaño: ${req.file.size} bytes`);

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
            console.error('Error al actualizar el vehículo:', err);
            return res.status(500).send('Error al actualizar');
        }

        console.log(`Vehículo actualizado con ID: ${id}`);
        res.redirect('/es-vehiculos');
    });
});

router.post('/es-vehiculos/:id/eliminar', (req, res) => {
    console.log(`Se elimina el vehículo con matrícula: ${req.params.id}`);

    const consulta = 'DELETE FROM Vehiculos WHERE id_vehiculo = ?';
    pool.query(consulta, [req.params.id], (err, result) => {
        if (err) {
            console.error('Error al eliminar un vehículo:', err);
            return res.status(500);
        }
        res.redirect('/es-vehiculos');
    });
});

// Función auxiliar para obtener concesionarios
const obtenerConcesionarios = (callback) => {
    const consulta = 'SELECT id_concesionario, nombre, ciudad FROM Concesionarios';
    pool.query(consulta, (err, results) => {
        if (err) return callback(err, null)
        callback(null, results)
    });
};

// Función auxiliar para obtener imágenes PNG de la BD
function obtenerImagen(id, callback) {
    pool.getConnection((err, con) => {
        if (err) {
            return callback(err);
        }

        const sql = 'SELECT imagen FROM Vehiculos WHERE id_vehiculo = ?';
        con.query(sql, [id], (err, result) => {
            con.release();

            if (err) {
                return callback(err);
            }

            // Comprobar si existe un vehículo con el ID dado
            if (result.length === 0) {
                return callback(new Error('No existe el vehículo'));
            }

            callback(null, result[0].imagen);
        });
    });
}


router.get('/api/vehiculos', (req, res) => {

    const consulta = `
        SELECT v.*, c.nombre AS nombre_concesionario
        FROM Vehiculos v
        LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
    `;

    pool.query(consulta, (err, vehiculos) => {
        if (err) {
            console.error('Error al obtener vehículos JSON:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }


        const vehiculosSinImagen = vehiculos.map(v => {
            const { imagen, ...resto } = v;
            return resto;
        });

        res.json(vehiculosSinImagen);
    });
});
module.exports = router;