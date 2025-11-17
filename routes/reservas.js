const express = require('express');
const router = express.Router();

const reservas = [];   // <-- ARRAY EN MEMORIA

router.get('/es-reservas', (req, res) => {
    res.render('es-reservas');
});

router.get('/en-bookings', (req, res) => {
    res.render('en-bookings');
});

router.post('/submit-bookings', (req, res) => {

    const nuevaReserva = {
        nombre: req.body.nombre,
        correo: req.body.correo,
        vehiculo: req.body.vehiculos_form,
        fecha: req.body.fecha,
        horas: req.body.horas,
        telefono: req.body.telefono
    };

    reservas.push(nuevaReserva);

    if (req.body.idioma === 'english')
        res.redirect('en-bookings');
    else
        res.redirect('es-reservas');
});

router.get('/listareservas', (req, res) => {
    res.render('es-listareservas', { reservas });
});

module.exports = router;
