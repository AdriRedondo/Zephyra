const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get('/es-vehiculos', (req, res) => {

    const tipoFiltro = req.query.tipo;
    const marcaFiltro = req.query.marca;
    const modeloFiltro = req.query.modelo;
    const plazasFiltro = req.query.plazas;
    const concesionarioFiltro = req.query.concesionario;

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

        const viewData = {
            title: 'Vehículos disponibles',
            estilos: ['style', 'vehiculos'],
            actual_es: 'es-vehiculos',
            actual_en: 'en-vehicles',
            vehiculos: vehiculos,
            vehiculosFiltrados: vehiculosFiltrados,
            filtros: {
                tipo: tipoFiltro,
                marca: marcaFiltro,
                modelo: modeloFiltro,
                plazas: plazasFiltro,
                concesionario: concesionarioFiltro
            }
        };

        if (req.body.idioma === 'english')
            res.render('en-vehicles', viewData);
        else
            res.render('es-vehiculos', viewData);

    });
});

// Esto lo ponemos antes que /:id porque si no accede antes al get de :id que al de nuevo_vehiculo
router.get('/es-vehiculos/nuevo-vehiculo', (req, res) => {

    const language = req.body.idioma;
    obtenerConcesionarios((errConc, concesionarios) => {
        if (errConc) concesionarios = [];
        if (language === 'english')
            res.render('en-vehicle-form', { concesionarios, editar: false, vehiculo: null });
        else
            res.render('es-vehiculo-form', { concesionarios, editar: false, vehiculo: null });
    });

});

router.post('/es-vehiculos/nuevo-vehiculo', (req, res) => {
    const matricula = req.body.matricula;
    const marca = req.body.marca;
    const modelo = req.body.modelo;
    const anyoMatri = req.body.anyoMatri;
    const numPlazas = req.body.numPlazas;
    const autonomia = req.body.autonomia;
    const color = req.body.color;
    const imagen = req.body.imagen;
    const estado = req.body.estado;
    const concesionario = req.body.concesionario;

    if (!matricula || !marca || !modelo || !anyoMatri || !numPlazas || !color || !imagen || !concesionario) {
        return res.status(400);
    }

    const consulta = `
        INSERT INTO Vehiculos 
        (matricula, marca, modelo, anyo_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    pool.query(consulta, [matricula, marca, modelo, anyoMatri, numPlazas, autonomia, color, imagen || null, estado, concesionario], (err, result) => {
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

            return res.status(500)
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
    `;
    pool.query(consulta, [id], (err, resultados) => {

        if (err || resultados.length === 0) {
            if (err) console.log('Error al obtener un vehículo:');
            return res.status(500);
        }

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
                return res.status(500);
            }
            console.log(vehiculo);

            if (language === 'english')
                res.render('en-vehicle-form', { concesionarios, editar: true, vehiculo });
            else
                res.render('es-vehiculo-form', { concesionarios, editar: true, vehiculo });
        });
    });

});

router.post('/es-vehiculos/:id/editar', (req, res) => {
    const id = req.params.id;
    const matricula = req.body.matricula;
    const marca = req.body.marca;
    const modelo = req.body.modelo;
    const anyoMatri = req.body.anyoMatri;
    const numPlazas = req.body.numPlazas;
    const color = req.body.color;
    const imagen = req.body.imagen;
    const autonomia = req.body.autonomia;
    const estado = req.body.estado;
    const concesionario = req.body.concesionario;

    if (!matricula || !marca || !modelo || !anyoMatri || !numPlazas || !color || !autonomia || !imagen || !estado || !concesionario) {
        return res.status(400);
    }

    const consulta = `
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
    pool.query(consulta, [matricula, marca, modelo, anyoMatri, numPlazas, autonomia, color, imagen || null, estado, concesionario, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar el vehículo:', err);
            return res.status(500);
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

const obtenerConcesionarios = (callback) => {
    const consulta = 'SELECT id_concesionario, nombre, ciudad FROM Concesionarios';
    pool.query(consulta, (err, results) => {
        if (err) return callback(err, null)
        callback(null, results)
    });
};

module.exports = router;