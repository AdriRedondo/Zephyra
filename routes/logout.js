const express = require('express');
const router = express.Router();

//GET del logout de usuario en español
router.get('/es-logout', (req, res) => {

    //Se destruye la sesión actual del usuario logeado
    req.session.destroy((err) => {
        if (err) {
            //Si ocurre cualquier error, se lanza un error500
            console.error('Error al cerrar sesión: ', err);
            res.status(500);
        }
        else {
            //Si todo va bien se redirige a la pagina de inicio
            console.log('El usuario se ha cerrado');
            res.redirect('es-inicio');
        }
    });
});

//GET del logout de usuario en inglés
router.get('/en-logout', (req, res) => {
    res.render('en-home');
    console.log('The user logs out');
    //Implementar el resto
});


module.exports = router;