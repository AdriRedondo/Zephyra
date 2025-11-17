const express = require('express');
const { requiredAdminId, requiredEmployeeId } = require('../autorizaciones');
const router = express.Router();

router.get('/es-contacto', requiredAdminId || requiredEmployeeId, (req, res) => {
    res.render('es-contacto');
});

router.get('/en-contact', requiredAdminId || requiredEmployeeId, (req, res) => {
    res.render('en-contact');
});

router.post('/submit_contact', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let email = req.body.correo;
    let message = req.body.mensaje;

    if (req.body.idioma === 'english')
        res.redirect('en-contact');
    else
        res.redirect('es-contacto');
});


module.exports = router;