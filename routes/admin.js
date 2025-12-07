const express = require('express');
const router = express.Router();
const requiredAdminId = require('../middleware/autorizaciones').requiredAdminId;
const Concesionario = require('../models/Concesionario');
const Vehiculo = require('../models/Vehiculo');
const Usuario = require('../models/Usuario');
const Reserva = require('../models/Reserva');

// GET de la página de administrador en español, con su middleware de verificación de acceso
router.get('/es-admin', requiredAdminId, (req, res) => {

    //Cargamos los concesionarios
    Concesionario.obtenerTodos((err, concesionarios) => {
        // Si falla la consulta, mostramos la vista con el error y registramos el error en consola
        if (err) {
            console.error('Error al obtener todos los concesionarios: ', err);
            return res.status(500).send('Error al obtener todos los concesionarios');
        }
        Usuario.obtenerTodos((errU, usuarios) => {
            // Si falla la consulta, mostramos la vista con el error y registramos el error en consola
            if (errU) {
                console.error('Error al obtener todos los usuarios: ', errU);
                return res.status(500).send('Error al obtener todos los usuarios');
            }
            Vehiculo.obtenerTodos((errV, vehiculos) => {
                // Si falla la consulta, mostramos la vista con el error y registramos el error en consola
                if (errV) {
                    console.error('Error al obtener todos los vehículos: ', errV);
                    return res.status(500).send('Error al obtener todos los vehículos');
                }
                Reserva.obtenerTodas((errR, reservas) => {
                    // Si falla la consulta, simplemente mostrar sin reservas
                    if (errR) {
                        console.error('Error al obtener todas las reservas: ', errR);
                        // Mostrar vista sin reservas en lugar de error
                        return res.render('es-admin', {
                            concesionarios,
                            vehiculos,
                            usuarios,
                            reservas: []
                        });
                    }

                    // Debug: mostrar estados de reservas
                    console.log('Reservas cargadas:', reservas.length);
                    if (reservas.length > 0) {
                        reservas.forEach(r => {
                            console.log(`Reserva ${r.id_reserva}: estado="${r.estado}"`);
                        });
                    }

                    res.render('es-admin', {
                        concesionarios,
                        vehiculos,
                        usuarios,
                        reservas: reservas || []
                    });
                });
            });
        });
    });

});

// GET de la página de administrador en inglés, con su middleware de verificación de acceso
router.get('/en-admin', (req, res) => {
    res.render('en-admin');
});

// GET de la página de estadísticas (solo admin)
router.get('/es-estadisticas', requiredAdminId, (req, res) => {
    res.render('es-estadisticas');
});

router.get('/en-statistics', requiredAdminId, (req, res) => {
    res.render('en-statistics');
});

module.exports = router;