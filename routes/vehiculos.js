const express = require('express');
const router = express.Router();

const vehiculosDisponibles = [
    // Coches
    { matricula: '1234-BCD', marca: 'Seat', modelo: 'León e-Hybrid', autonomia: 60, tipo: 'coche' },
    { matricula: '5678-FGH', marca: 'Renault', modelo: 'Zoe E-Tech', autonomia: 395, tipo: 'coche' },
    { matricula: '9012-JKL', marca: 'Peugeot', modelo: 'e-208', autonomia: 362, tipo: 'coche' },

    // Motos
    { matricula: '3456-MNP', marca: 'Silence', modelo: 'S01', autonomia: 133, tipo: 'moto' },
    { matricula: '7890-RST', marca: 'Vectrix', modelo: 'VX-1 Li+', autonomia: 200, tipo: 'moto' },

    // Furgonetas
    { matricula: '1122-VXZ', marca: 'Citroen', modelo: 'e-Berlingo', autonomia: 280, tipo: 'furgoneta' },
    { matricula: '3344-YZA', marca: 'Ford', modelo: 'E-Transit', autonomia: 317, tipo: 'furgoneta' },
];

router.get('/vehiculos', (req, res) => {

    const tipoFiltro = req.query.tipo;

    let vehiculosFiltrados = vehiculosDisponibles;

    if (tipoFiltro) {
        const filtroNormalizado = tipoFiltro.toLowerCase();

        vehiculosFiltrados = vehiculosDisponibles.filter(vehiculo =>
            vehiculo.tipo.toLowerCase() === filtroNormalizado
        );
        console.log(`Filtro aplicado: tipo = ${tipoFiltro}. Vehículos encontrados: ${vehiculosFiltrados.length}`);
    } else {
        console.log("No se aplicó filtro, mostrando todos los vehículos.");
    }


    const viewData = {
        title: tipoFiltro ? `Vehículos - ${tipoFiltro}` : 'Vehículos disponibles',
        estilos: ['style', 'vehiculos'],
        actual_es: 'es-vehiculos',
        actual_en: 'en-vehicles',
        vehiculos: vehiculosFiltrados,
        tipoFiltro: tipoFiltro || 'todos'
    };
    res.render('es-vehiculos', viewData);
});

module.exports = router;