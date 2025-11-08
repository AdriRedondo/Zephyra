const express = require('express');
const router = express.Router();

router.post('/submit-bookings', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let email = req.body.correo;
    let vehicles = req.body.vehiculos_form;
    let start = req.body.correo;
    let hours = req.body.horas;
    let phone = req.body.telefono;

    if (req.body.idioma === 'english')
        res.redirect('en-bookings');
    else
        res.redirect('es-reservas');
});

module.exports = router;