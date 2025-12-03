const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requiredLoggedIn } = require('../autorizaciones');

const reservas = [];   // <-- ARRAY EN MEMORIA

router.get('/es-reservas', (req, res) => {
    res.render('es-reservas');
});

router.get('/en-bookings', (req, res) => {
    res.render('en-bookings');
});

router.post('/submit-bookings', (req, res) => {

    const language = req.body.idioma;
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const vehiculo = req.body.vehiculos_form;
    const fecha = req.body.fecha;
    const horas = req.body.horas;
    const telefono = req.body.telefono;


    // Validar campos obligatorios
    if (!nombre || !correo || !vehiculo || !fecha || !horas || !telefono) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'Name, email, vehicle, date and hours are required' });
        else
            return res.render('es-reservas', { error: 'El nombre, correo, vehículo, fecha y horas son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.correo.trim())) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'Invalid email format' });
        else
            return res.render('es-reservas', { error: 'Formato de correo inválido' });
    }
    const nuevaReserva = {
        nombre: nombre,
        correo: correo,
        vehiculo: vehiculo,
        fecha: fecha,
        horas: horas,
        telefono: telefono
    };

    reservas.push(nuevaReserva);

    if (req.body.idioma === 'english')
        res.redirect('en-bookings');
    else
        res.redirect('es-reservas');
});

router.get('/listareservas', (req, res) => {
    res.render('es-listareservas', { reservas });
});

// Ruta para el histórico de reservas del usuario loggeado
router.get('/es-historial', requiredLoggedIn, (req, res) => {
    const id_usuario = req.session.usuario.id_usuario;

    const query = `
        SELECT
            r.id_reserva,
            r.fecha_inicio,
            r.fecha_fin,
            r.estado,
            r.kilometros_recorridos,
            r.incidencias_reportadas,
            v.marca,
            v.modelo,
            v.matricula,
            v.imagen
        FROM Reservas r
        INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
        WHERE r.id_usuario = ?
        ORDER BY r.fecha_inicio DESC
    `;

    pool.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error('Error al obtener el histórico de reservas:', err);
            return res.status(500).render('errors', {
                error: 'Error 500',
                texto1: 'Error al cargar el histórico de reservas',
                texto2: 'Por favor, inténtalo de nuevo más tarde.',
                lang: 'es'
            });
        }

        // Separar reservas activas y finalizadas
        const reservasActivas = results.filter(r => r.estado === 'activa');
        const reservasFinalizadas = results.filter(r => r.estado === 'finalizada' || r.estado === 'cancelada');

        res.render('es-historial', {
            reservasActivas,
            reservasFinalizadas,
            usuario: req.session.usuario
        });
    });
});

// Ruta en inglés para el histórico de reservas
router.get('/en-history', requiredLoggedIn, (req, res) => {
    const id_usuario = req.session.usuario.id_usuario;

    const query = `
        SELECT
            r.id_reserva,
            r.fecha_inicio,
            r.fecha_fin,
            r.estado,
            r.kilometros_recorridos,
            r.incidencias_reportadas,
            v.marca,
            v.modelo,
            v.matricula,
            v.imagen
        FROM Reservas r
        INNER JOIN Vehiculos v ON r.id_vehiculo = v.id_vehiculo
        WHERE r.id_usuario = ?
        ORDER BY r.fecha_inicio DESC
    `;

    pool.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error('Error al obtener el histórico de reservas:', err);
            return res.status(500).render('errors', {
                error: 'Error 500',
                texto1: 'Error loading booking history',
                texto2: 'Please try again later.',
                lang: 'en'
            });
        }

        // Separar reservas activas y finalizadas
        const activeBookings = results.filter(r => r.estado === 'activa');
        const completedBookings = results.filter(r => r.estado === 'finalizada' || r.estado === 'cancelada');

        res.render('en-history', {
            activeBookings,
            completedBookings,
            usuario: req.session.usuario
        });
    });
});

module.exports = router;
