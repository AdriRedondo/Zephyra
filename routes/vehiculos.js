const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { log } = require('console');

const dataPath = path.join(__dirname, '../data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const vehiculosDisponibles = data.vehiculos;


router.get('/es-vehiculos', (req, res) => {

    const tipoFiltro = req.query.tipo;
    const marcaFiltro = req.query.marca;

    let vehiculosFiltrados = vehiculosDisponibles;

    if (tipoFiltro) {
        vehiculosFiltrados = vehiculosFiltrados.filter(
            v => v.tipo.toLowerCase() === tipoFiltro.toLowerCase()
        );
    }

    if (marcaFiltro) {
        vehiculosFiltrados = vehiculosFiltrados.filter(
            v => v.marca.toLowerCase() === marcaFiltro.toLowerCase()
        );
    }


    const viewData = {
        title: tipoFiltro ? `Vehículos - ${tipoFiltro}` : 'Vehículos disponibles',
        estilos: ['style', 'vehiculos'],
        actual_es: 'es-vehiculos',
        actual_en: 'en-vehicles',
        vehiculos: vehiculosFiltrados,
        tipoFiltro: tipoFiltro || 'todos'
    };

    console.log(viewData.vehiculos);


    if (req.body.idioma === 'english')
        res.render('en-vehicles', viewData);
    else
        res.render('es-vehiculos', viewData);

});


router.get('/es-vehiculos/:id', (req, res) => {
    const id = req.params.id;

    const vehiculo = vehiculosDisponibles.find(v => v.matricula === id);

    if (!vehiculo) {
        return res.status(404).send("Vehículo no encontrado");
    }

    const viewData = {
        title: `Detalle del vehículo ${vehiculo.matricula}`,
        estilos: ['style', 'vehiculos'],
        actual_es: 'es-vehiculos',
        actual_en: 'en-vehicles',
        vehiculo: vehiculo
    };

    res.render('es-vehiculos-detalle', viewData);
});


module.exports = router;