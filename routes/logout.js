const express = require('express');
const router = express.Router();

router.get('/es-logout', (req, res) => {
    res.render('es-inicio');
    console.log('Se cierra la sesión del usuario');
    //Habrá que meter la logica para cerrar la sesión del usuario
});

router.get('/en-logout', (req, res) => {
    res.render('en-home');
    console.log('The user loged out');
    //Habrá que meter la logica para cerrar la sesión del usuario
});

module.exports = router;