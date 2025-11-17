const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/es-perfil', (req, res) => {
    const consulta = 'SELECT * FROM Usuarios WHERE id_concesionario = ?';
    pool.query(consulta, [req.session.usuario.id_concesionario], (err, results) => {
        if (err) {
            console.error('Error al buscar el concesionario del usuario');
            return res.status(500).render('error500', { err: 'Error al buscar el concesiorario al que está asignado el usuario' });
        }
        let concesionario = results[0] || null;
        if (!concesionario) {
            concesionario = 'No hay un concesionario asignado';
        }

        res.render('es-perfil', { concesionario });
    });
});

router.get('/en-profile', (req, res) => {
    res.render('en-profile');
});


module.exports = router;