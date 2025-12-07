const express = require('express');
const pool = require('../db');
const router = express.Router();
const { requiredLoggedIn } = require('../middleware/autorizaciones');
const Concesionario = require('../models/Concesionario');

// GET de la página del perfil de usuario logeado en español
router.get('/es-perfil', requiredLoggedIn, (req, res) => {
    const id_concesionario = req.session.usuario.id_concesionario;

    // Si no tiene concesionario asignado
    if (!id_concesionario) {
        return res.render('es-perfil', {
            usuario: req.session.usuario,
            concesionario: 'No hay un concesionario asignado'
        });
    }

    Concesionario.obtenerPorId(id_concesionario, (err, concesionarioObj) => {
        if (err) {
            console.error('Error al buscar el concesionario del usuario:', err);
            return res.status(500).render('errors', {
                error: 'Error 500',
                texto1: 'Error al cargar el perfil',
                texto2: 'Por favor, inténtalo de nuevo más tarde.',
                lang: 'es'
            });
        }

        // Obtener el nombre del concesionario o mensaje por defecto
        const concesionario = concesionarioObj?.nombre || 'No hay un concesionario asignado';

        // Renderizar la vista con los datos del usuario y concesionario
        res.render('es-perfil', {
            usuario: req.session.usuario,
            concesionario
        });
    });
});

// GET de la página del perfil de usuario logeado en inglés
router.get('/en-profile', requiredLoggedIn, (req, res) => {
    const id_concesionario = req.session.usuario.id_concesionario;

    // Si no tiene concesionario asignado
    if (!id_concesionario) {
        return res.render('en-profile', {
            usuario: req.session.usuario,
            concesionario: 'No dealer assigned'
        });
    }

    Concesionario.obtenerPorId(id_concesionario, (err, concesionarioObj) => {
        if (err) {
            console.error('Error fetching user dealer:', err);
            return res.status(500).render('errors', {
                error: 'Error 500',
                texto1: 'Error loading profile',
                texto2: 'Please try again later.',
                lang: 'en'
            });
        }

        // Obtener el nombre del concesionario o mensaje por defecto
        const concesionario = concesionarioObj?.nombre || 'No dealer assigned';

        // Renderizar la vista con los datos del usuario y concesionario
        res.render('en-profile', {
            usuario: req.session.usuario,
            concesionario
        });
    });
});

module.exports = router;