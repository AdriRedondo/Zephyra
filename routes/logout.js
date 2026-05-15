const express = require('express');
const router = express.Router();
const requiredLoggedIn = require('../middleware/autorizaciones').requiredLoggedIn

//GET del logout de usuario en español
router.get('/es-logout', requiredLoggedIn, (req, res) => {

    //Se destruye la sesión actual del usuario logeado
    req.session.destroy((err) => {
        if (err) {
            //Si ocurre cualquier error, se lanza un error500
            console.error('Error al cerrar sesión: ', err);
            res.status(500);
        }
        res.clearCookie('connect.sid'); // sesión
        res.clearCookie('tema');
        res.clearCookie('tamano');
        res.clearCookie('preferencias_usuario');

        console.log('El usuario se ha cerrado');

        res.redirect('/es-inicio');
    });
});

//GET del logout de usuario en inglés
router.get('/en-logout', requiredLoggedIn, (req, res) => {
    res.render('en-home');
    console.log('The user logs out');
    //Implementar el resto
});


module.exports = router;