const express = require('express');
const router = express.Router();

router.get('/es-registro', (req, res) => {
    res.render('es-registro');
});

router.get('/en-sign-up', (req, res) => {
    res.render('en-sign-up');
});

router.post('/submit-register', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let password = req.body.contraseña;

    if (req.body.idioma === 'english')
        res.redirect('en-sign-in');
    else
        res.redirect('es-registro');
});

module.exports = router;