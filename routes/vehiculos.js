const express = require('express');
const multer = require('multer');
const router = express.Router();
const pool = require('../db');

// Configuración de multer para almacenar archivos en memoria con formato BLOB ()
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

router.get('/es-vehiculos', (req, res) => {

    const tipoFiltro = req.query.tipo;
    const marcaFiltro = req.query.marca;
    const modeloFiltro = req.query.modelo;
    const plazasFiltro = req.query.plazas;
    const concesionarioFiltro = req.query.concesionario;
    const estadoFiltro = req.query.estado;

    // JOIN con la tabla Concesionarios para obtener el nombre
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

        let vehiculosFiltrados = vehiculos;

        if (tipoFiltro) {
            vehiculosFiltrados = vehiculosFiltrados.filter(
                v => v.tipo && v.tipo.toLowerCase() === tipoFiltro.toLowerCase()
            );
        }

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

        if (req.body.idioma === 'english')
            res.render('en-vehicles', {
                vehiculos: vehiculos,
                vehiculosFiltrados: vehiculosFiltrados,
                filtros: {
                    tipo: tipoFiltro,
                    marca: marcaFiltro,
                    modelo: modeloFiltro,
                    plazas: plazasFiltro,
                    concesionario: concesionarioFiltro,
                    estado: estadoFiltro
                }
            });
        else
            res.render('es-vehiculos', {
                vehiculos: vehiculos,
                vehiculosFiltrados: vehiculosFiltrados,
                filtros: {
                    tipo: tipoFiltro,
                    marca: marcaFiltro,
                    modelo: modeloFiltro,
                    plazas: plazasFiltro,
                    concesionario: concesionarioFiltro,
                    estado: estadoFiltro
                }
            });

    });
});

// Ruta para servir imágenes PNG desde la BD
router.get('/es-vehiculos/imagen/:id', (req, res) => {
    const id = req.params.id;

    obtenerImagen(id, (err, imagen) => {
        if (err || !imagen) {
            console.error('Error al obtener imagen:', err);
            return res.status(404).send('Imagen no encontrada');
        }

        // Siempre es PNG
        res.contentType('image/png');
        res.end(imagen);
    });
});

// Esto lo ponemos antes que /:id porque si no accede antes al get de :id que al de nuevo_vehiculo
router.get('/es-vehiculos/nuevo-vehiculo', (req, res) => {

    const language = req.body.idioma;
    obtenerConcesionarios((errConc, concesionarios) => {
        if (errConc) concesionarios = [];
        if (language === 'english')
            res.render('en-vehicle-form', { concesionarios, editar: false, vehiculo: null, error: null });
        else
            res.render('es-vehiculo-form', { concesionarios, editar: false, vehiculo: null, error: null });
    });

});

router.post('/es-vehiculos/nuevo-vehiculo', multerFactory.single('imagen'), (req, res) => {

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

    const matricula = req.body.matricula;
    const marca = req.body.marca;
    const modelo = req.body.modelo;
    const anyoMatri = req.body.anyoMatri;
    const numPlazas = req.body.numPlazas;
    const autonomia = req.body.autonomia;
    const color = req.body.color;
    const estado = req.body.estado;
    const concesionario = req.body.concesionario;

    if (!matricula || !marca || !modelo || !anyoMatri || !numPlazas || !color || !concesionario) {
        return res.status(400);
    }

    if (!req.file) {
        return res.status(400).send('La imagen es obligatoria');
    }

    // El archivo está en memoria como Buffer (siempre PNG)
    const imagenBuffer = req.file.buffer;


    const consulta = `
        INSERT INTO Vehiculos 
        (matricula, marca, modelo, anyo_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    pool.query(consulta, [matricula, marca, modelo, anyoMatri, numPlazas, autonomia, color, imagenBuffer || null, estado, concesionario], (err, result) => {
        if (err) {

            if (err.code === 'ER_DUP_ENTRY') {
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

            console.error('Error al crear el vehículo:', err);

            return res.status(500);
        }

        console.log(`Vehículo creado con ID: ${result.insertId}`);
        res.redirect('/es-vehiculos');
    });
});

router.get('/es-vehiculos/:id', (req, res) => {
    const id = req.params.id;

    const consulta = `
        SELECT v.*, c.nombre AS nombre_concesionario
        FROM Vehiculos v
        LEFT JOIN Concesionarios c ON v.id_concesionario = c.id_concesionario
        WHERE v.id_vehiculo = ?
    `;
    pool.query(consulta, [id], (err, resultados) => {

        if (err) {
            console.log('Error al obtener un vehículo:');
            return res.status(500);
        }
        if (resultados.length === 0) return res.status(404);
        const vehiculo = resultados[0];

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