const express = require('express');
const router = express.Router();
const requiredAdminId = require('../middleware/autorizaciones').requiredAdminId;
const Concesionario = require('../models/Concesionario');

const { validateDealer, checkDealerDependencies } = require('../middleware/validations');

// GET para registrar un nuevo concesionario
router.get('/es-dealer/register', requiredAdminId, (req, res) => {
    const language = req.body.idioma;

    if (language === 'english')
        res.render('en-dealer-form', { error: null });
    else
        res.render('es-dealer-form', { error: null });
});

// POST para registrar un nuevo concesionario
router.post('/dealer-register', requiredAdminId, validateDealer, (req, res) => {
    const language = req.body.idioma;

    // Usar datos validados
    const { nombre, ciudad, direccion, telefono_contacto } = req.validatedData;

    Concesionario.crear({
        nombre,
        ciudad,
        direccion,
        telefono: telefono_contacto,
        latitud: req.body.latitud || null,
        longitud: req.body.longitud || null
    }, (err, nuevoId) => {
        if (err) {
            console.error('Error al insertar concesionario:', err);
            return res.status(500).send('Error al insertar usuario');
        }

        // Registro exitoso
        const vista = language === 'english' ? 'en-admin' : 'es-admin';
        console.log(`Concesionario creado con ID: ${nuevoId}`);

        res.redirect(vista);
    });
});

router.get('/es-dealer/edit/:id', requiredAdminId, (req, res) => {
    const language = req.body.idioma;
    const id = req.params.id;
    Concesionario.obtenerPorId(id, (err, concesionario) => {
        if (err) {
            console.error(`Error al obtener concesionario con id ${id}: `, err);
            return res.status(500).send(`Error al obtener concesionario con id ${id}`);
        }

        if (!concesionario) {
            return res.status(404).send(`No hay un concesionario con el ID ${id}`);
        }

        if (language === 'english')
            res.render('en-dealer-form', { editar: true, concesionario, error: null });
        else
            res.render('es-dealer-form', { editar: true, concesionario, error: null });
    });
});

// POST para editar un concesionario existente
router.post('/dealer-edit/:id', requiredAdminId, validateDealer, (req, res) => {
    const id = req.params.id;
    const language = req.body.idioma;

    // Usar datos validados
    const { nombre, ciudad, direccion, telefono_contacto, latitud, longitud } = req.validatedData;

    Concesionario.actualizar(id, {
        nombre,
        ciudad,
        direccion,
        telefono: telefono_contacto,
        latitud: req.body.latitud || null,    // ← añadir
        longitud: req.body.longitud || null
    }, (err, filasAfectadas) => {
        if (err) {
            console.error(`Error al actualizar el concesionario con ID ${id}`, err);
            return res.status(500).send(`Error al actualizar el concesionario con ID ${id}`);
        }

        if (filasAfectadas === 0) {
            return res.status(404).send(`No se ha encontrado un concesionario con ID ${id}`);
        }

        if (language === 'english')
            res.redirect('/en-admin');
        else
            res.redirect('/es-admin');
    });
});

const requiredLoggedIn = require('../middleware/autorizaciones').requiredLoggedIn;

// GET mapa de concesionarios
router.get('/es-mapa', requiredLoggedIn, (req, res) => {
    Concesionario.obtenerTodos((err, concesionarios) => {
        if (err) {
            console.error('Error al obtener concesionarios para el mapa:', err);
            return res.status(500).send('Error al cargar el mapa');
        }
        // Solo los que tienen coordenadas
        const conCoords = concesionarios.filter(c => c.latitud && c.longitud);
        res.render('es-mapa-concesionarios', { concesionarios: conCoords });
    });
});

module.exports = router;