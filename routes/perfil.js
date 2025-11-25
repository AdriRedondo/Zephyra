const express = require('express');
const pool = require('../db');
const router = express.Router();

//GET de la página del perfil de usuario logeado en español
router.get('/es-perfil', (req, res) => {
    //Consulta para obtener el concesionario asignado al usuario usando el id_concesionario almacenado en la sesión
    const consulta = 'SELECT * FROM Usuarios WHERE id_concesionario = ?';
    pool.query(consulta, [req.session.usuario.id_concesionario], (err, results) => {
        if (err) {
            //Si ocurre algún error en la consulta, se lanza un error500 y se muestra por pantalla el error
            console.error('Error al buscar el concesionario del usuario');
            return res.status(500);
        }
        let concesionario = results[0] || null;
        if (!concesionario) {
            //Si no hay nungún concesionario asignado al usuario se muestra ese mensaje
            concesionario = 'No hay un concesionario asignado';
        }

        //Si todo sale correctametne se muestra la vista de perfil de usuario
        res.render('es-perfil', { concesionario });
    });
});

//GET de la página del perfil de usuario logeado en inglés
router.get('/en-profile', (req, res) => {
    res.render('en-profile');
});


module.exports = router;