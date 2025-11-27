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

    const language = req.body.idioma;
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const vehiculo = req.body.vehiculos_form;
    const fecha = req.body.fecha;
    const horas = req.body.horas;
    const telefono = req.body.telefono;


    // Validar campos obligatorios
    if (!nombre || !correo || !vehiculo || !fecha || !horas || !telefono) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'Name, email, vehicle, date and hours are required' });
        else
            return res.render('es-reservas', { error: 'El nombre, correo, vehículo, fecha y horas son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.correo.trim())) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'Invalid email format' });
        else
            return res.render('es-reservas', { error: 'Formato de correo inválido' });
    }
    const nuevaReserva = {
        nombre: nombre,
        correo: correo,
        vehiculo: vehiculo,
        fecha: fecha,
        horas: horas,
        telefono: telefono
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
