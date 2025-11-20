const express = require('express');
const router = express.Router();

router.get('/es-logout', (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión: ', err);
            res.status(500);
        }
        else {
            console.log('El usuario se ha cerrado');
            res.redirect('es-inicio');
        }
    });
});

router.get('/en-logout', (req, res) => {
    res.render('en-home');
    console.log('The user logs out');
    //Implementar el resto
});


module.exports = router;