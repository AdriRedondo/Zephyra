const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requiredLoggedIn } = require('../middleware/autorizaciones');
const { validateReservation } = require('../middleware/validations');
const Reserva = require('../models/Reserva');
const Vehiculo = require('../models/Vehiculo');

const reservas = [];   //ARRAY EN MEMORIA

router.get('/es-reservas', (req, res) => {
    res.render('es-reservas');
});

router.get('/en-bookings', (req, res) => {
    res.render('en-bookings');
});

router.post('/submit-bookings', (req, res) => {
    // Verificar que el usuario esté loggeado
    if (!req.session.usuario) {
        if (req.body.idioma === 'english')
            return res.render('en-bookings', { error: 'You must be logged in to make a reservation' });
        else
            return res.render('es-reservas', { error: 'Debes iniciar sesión para hacer una reserva' });
    }

    const language = req.body.idioma;
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const id_vehiculo = req.body.vehiculo;
    const fecha = req.body.inicio;
    const horas = parseInt(req.body.horas);
    const telefono = req.body.telefono;
    const id_usuario = req.session.usuario.id_usuario;

    // Validar campos obligatorios
    if (!nombre || !correo || !id_vehiculo || !fecha || !horas || !telefono) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'Name, email, vehicle, date and hours are required' });
        else
            return res.render('es-reservas', { error: 'El nombre, correo, vehículo, fecha y horas son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'Invalid email format' });
        else
            return res.render('es-reservas', { error: 'Formato de correo inválido' });
    }

    // Calcular fechas
    const fecha_inicio = new Date(fecha);
    const fecha_fin = new Date(fecha_inicio.getTime() + (horas * 60 * 60 * 1000));

    // Guardar en base de datos
    const query = `
        INSERT INTO Reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado)
        VALUES (?, ?, ?, ?, 'activa')
    `;

    pool.query(query, [id_usuario, id_vehiculo, fecha_inicio, fecha_fin], (err, result) => {
        if (err) {
            console.error('Error al crear reserva:', err);
            if (language === 'english')
                return res.render('en-bookings', { error: 'Error creating reservation' });
            else
                return res.render('es-reservas', { error: 'Error al crear la reserva' });
        }

        // Actualizar estado del vehículo
        pool.query('UPDATE Vehiculos SET estado = ? WHERE id_vehiculo = ?',
            ['reservado', id_vehiculo], (errUpdate) => {
                if (errUpdate) {
                    console.error('Error al actualizar vehículo:', errUpdate);
                }


                if (language === 'english')
                    res.redirect('en-bookings');
                else
                    res.redirect('es-reservas');
            });
    });
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
