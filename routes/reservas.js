const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requiredLoggedIn } = require('../middleware/autorizaciones');
const { validateReservation } = require('../middleware/validations');
const Reserva = require('../models/Reserva');
const Vehiculo = require('../models/Vehiculo');
const Cliente = require('../models/Cliente');

const reservas = [];   //ARRAY EN MEMORIA

router.get('/es-reservas', requiredLoggedIn, (req, res) => {
    res.render('es-reservas');
});

router.get('/en-bookings', requiredLoggedIn, (req, res) => {
    res.render('en-bookings');
});

// routes/reservas.js - POST actualizado

router.post('/submit-bookings', requiredLoggedIn, (req, res) => {
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
    const fecha_inicio_str = req.body.inicio;
    const fecha_fin_str = req.body.fin;
    const telefono = req.body.telefono;
    const id_usuario = req.session.usuario.id_usuario;

    // Validar campos obligatorios
    if (!nombre || !correo || !id_vehiculo || !fecha_inicio_str || !fecha_fin_str || !telefono) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'All fields are required' });
        else
            return res.render('es-reservas', { error: 'Todos los campos son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'Invalid email format' });
        else
            return res.render('es-reservas', { error: 'Formato de correo inválido' });
    }

    // Convertir fechas
    const fecha_inicio = new Date(fecha_inicio_str);
    const fecha_fin = new Date(fecha_fin_str);

    // Validar que fin sea después de inicio
    if (fecha_fin <= fecha_inicio) {
        if (language === 'english')
            return res.render('en-bookings', { error: 'End date must be after start date' });
        else
            return res.render('es-reservas', { error: 'La fecha de fin debe ser posterior a la de inicio' });
    }

    // Validar que el vehículo esté disponible en ese rango
    Reserva.verificarDisponibilidad(id_vehiculo, fecha_inicio, fecha_fin, null, (err, disponible) => {
        if (err) {
            console.error('Error al verificar disponibilidad:', err);
            if (language === 'english')
                return res.render('en-bookings', { error: 'Error checking vehicle availability' });
            else
                return res.render('es-reservas', { error: 'Error al verificar disponibilidad del vehículo' });
        }

        if (!disponible) {
            if (language === 'english')
                return res.render('en-bookings', { error: 'Vehicle is not available for selected dates' });
            else
                return res.render('es-reservas', { error: 'El vehículo no está disponible en las fechas seleccionadas' });
        }

        // Preparar datos del cliente
        const datosCliente = {
            nombre: nombre.trim(),
            correo: correo.trim(),
            telefono: telefono.trim()
        };

        // Buscar o crear el cliente
        Cliente.buscarOCrear(datosCliente, (errCliente, idCliente, esNuevo) => {
            if (errCliente) {
                console.error('Error al buscar/crear cliente:', errCliente);
                if (language === 'english')
                    return res.render('en-bookings', { error: 'Error processing client data' });
                else
                    return res.render('es-reservas', { error: 'Error al procesar datos del cliente' });
            }

            console.log(`Cliente ${esNuevo ? 'creado' : 'encontrado'} con ID: ${idCliente}`);

            // Crear la reserva
            const datosReserva = {
                id_usuario: id_usuario,
                id_vehiculo: id_vehiculo,
                id_cliente: idCliente,
                fecha_inicio: fecha_inicio,
                fecha_fin: fecha_fin,
                estado: 'activa'
            };

            Reserva.crear(datosReserva, (err, idReserva) => {
                if (err) {
                    console.error('Error al crear reserva:', err);
                    if (language === 'english')
                        return res.render('en-bookings', { error: 'Error creating reservation' });
                    else
                        return res.render('es-reservas', { error: 'Error al crear la reserva' });
                }

                // NO CAMBIAR PERMANENTEMENTE EL ESTADO DEL VEHÍCULO
                // El vehículo debe seguir "disponible" pero con reservas activas
                console.log(`Reserva creada: ID ${idReserva} para vehículo ${id_vehiculo}`);
                console.log(`   Desde: ${fecha_inicio} hasta: ${fecha_fin}`);

                if (language === 'english')
                    res.redirect('/en-bookings?success=Reservation created successfully');
                else
                    res.redirect('/es-reservas?success=Reserva creada correctamente');
            });
        });
    });
});
router.get('/listareservas', requiredLoggedIn, (req, res) => {
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
            r.puntuacion,
            r.comentario,
             v.id_vehiculo,
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
            r.puntuacion,
            r.comentario,
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
