const express = require('express');
const router = express.Router();

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