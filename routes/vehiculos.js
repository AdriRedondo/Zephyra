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
            return res.status(500).render('error500', { err: 'Error al cargar vehículos' });
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
            return res.status(500).render('error500');
        }

        const vehiculo = resultados[0];
        console.log(vehiculo);

        res.render('es-vehiculo-detalles', { vehiculo });
    });
});

router.post('/es-vehiculos/:id/editar', (req, res) => {
    console.log(`Se edita el vehículo con matrícula: ${req.params.id}`);
    //Añadir la logica para modificarlo

});

router.post('/es-vehiculos/:id/eliminar', (req, res) => {
    console.log(`Se elimina el vehículo con matrícula: ${req.params.id}`);
    //ñadir la logica para eliminarlo
    const consulta = 'DELETE FROM Vehiculos WHERE id_vehiculo = ?';
    pool.query(consulta, [req.params.id], (err, result) => {
        if (err) {
            console.error('Error al eliminar un vehículo:', err);
            return res.status(500).render('error500');
        }
        res.redirect('/es-vehiculos');
    });
});


module.exports = router;