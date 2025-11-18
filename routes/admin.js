const express = require('express');
const router = express.Router();
const pool = require('../db');
const requiredAdminId = require('../autorizaciones').requiredAdminId;
const bcrypt = require('bcrypt');

router.get('/es-registro', (req, res) => {
    obtenerConcesionarios((err, concesionarios) => {
        if (err) {
            console.error('Error al cargar concesionarios:', err);
            res.render('es-registro', {
                error: 'Error al cargar concesionarios',
                success: undefined,
                concesionarios: []
            });
        }
        res.render('es-registro', {
            error: undefined,
            success: undefined,
            concesionarios: concesionarios
        });
    });

});

router.get('/en-sign-up', (req, res) => {
    res.render('en-sign-up');
});

router.get('/es-admin', requiredAdminId, (req, res) => {
    obtenerConcesionarios((err, concesionarios) => {
        if (err) {
            console.error('Error al cargar concesionarios:', err);
            res.render('es-admin', {
                error: 'Error al cargar concesionarios',
                success: undefined,
                concesionarios: []
            });
        }
        res.render('es-admin', {
            error: undefined,
            success: undefined,
            concesionarios: concesionarios
        });
    });

});

router.get('/en-admin', (req, res) => {
    res.render('en-admin');
});

router.post('/submit-register', (req, res) => {
    try {
        console.log(req.body);
        const language = req.body.idioma;
        const name = req.body.nombre;
        const email = req.body.correo;
        const password = req.body.password;
        const telephone = req.body.telefono;
        const role = req.body.rol;
        const idConcesionario = req.body.concesionario;

        const consulta1 = 'SELECT * FROM Usuarios WHERE correo = ?';
        pool.query(consulta1, [email], (err, results) => {
            if (err) {
                console.error('Error al verificar el correo:', err);
                return res.status(500).render('error500', { err: 'Error en el registro' });
            }

            if (results.length > 0) {
                return obtenerConcesionarios((error, concesionarios) => {
                    if (error) concesionarios = [];

                    if (language === 'english')
                        return res.render('en-admin', {
                            error: 'Email already registered',
                            success: undefined,
                            concesionarios
                        });
                    else
                        return res.render('es-admin', {
                            error: 'El correo ya está registrado',
                            success: undefined,
                            concesionarios
                        });
                });
            }

            const telephoneValue = telephone === '' ? null : telephone;
            const concesionarioValue = idConcesionario === '' ? null : idConcesionario;
            const roleValue = (role && role.trim() === 'admin') ? 'admin' : 'empleado';
            const saltRounds = 10;
            bcrypt.hash(password, saltRounds, (errEncriptacion, hashedPassword) => {
                if (errEncriptacion) {
                    console.error('Error al encriptar la contraseña: ', errEncriptacion);
                    return res.status(500).render('error500', { err: 'Error en el registro' });

                }
                const consulta = `INSERT INTO Usuarios (nombre, correo, contraseña, rol, telefono, id_concesionario) 
                          VALUES (?, ?, ?, ?, ?, ?)`;

                pool.query(consulta, [name, email, hashedPassword, roleValue, telephoneValue, concesionarioValue], (errInsert) => {
                    if (errInsert) {
                        console.error('Error al insertar usuario:', errInsert);
                        return obtenerConcesionarios((errConc, concesionarios) => {
                            if (errConc) concesionarios = [];
                            if (language === 'english')
                                return res.render('en-admin', {
                                    error: 'Registration error',
                                    success: undefined,
                                    concesionarios
                                });
                            else
                                return res.render('es-admin', {
                                    error: 'Error en el registro',
                                    success: undefined,
                                    concesionarios
                                });
                        });
                    }
                    obtenerConcesionarios((errConc, concesionarios) => {
                        if (errConc) concesionarios = [];
                        if (language === 'english')
                            res.render('en-admin', {
                                error: undefined,
                                success: `User ${name} registered successfully!`,
                                concesionarios
                            });
                        else
                            res.render('es-admin', {
                                error: undefined,
                                success: `Usuario ${name} registrado correctamente`,
                                concesionarios
                            });
                    });

                });
            });
        });
    }
    catch (err) {
        console.error('Error en el registro de un usuario: ', err);
        res.status(500).render('error500', { err: 'Error en el registro' });
    }

});

const obtenerConcesionarios = (callback) => {
    const consulta = 'SELECT id_concesionario, nombre, ciudad FROM Concesionarios';
    pool.query(consulta, (err, results) => {
        if (err) return callback(err, null)
        callback(null, results)
    });
};

module.exports = router;