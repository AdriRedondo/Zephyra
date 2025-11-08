const express = require('express');
const router = express.Router();


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