const express = require('express');
const router = express.Router();
const pool = require('../db');
const requiredAdminId = require('../autorizaciones').requiredAdminId;
const bcrypt = require('bcrypt');

// GET de la página de registro en español
router.get('/es-registro', (req, res) => {

    //Cargamos los concesionarios de la BD
    obtenerConcesionarios((err, concesionarios) => {
        if (err) {

            // Si falla la consulta, mostramos la vista con el error y registramos el error en consola
            console.error('Error al cargar concesionarios:', err);
            res.render('es-registro', {
                error: 'Error al cargar concesionarios',
                success: undefined,
                concesionarios: []
            });
        }

        // Mostramos la vista de registro con los concesionarios disponibles
        res.render('es-registro', {
            error: undefined,
            success: undefined,
            concesionarios: concesionarios
        });
    });

});

// GET de la página de registro en inglés
router.get('/en-sign-up', (req, res) => {
    res.render('en-sign-up');
});

// GET de la página de administrador en español, con su middleware de verificación de acceso
router.get('/es-admin', requiredAdminId, (req, res) => {

    //Cargamos loos cencesionarios
    obtenerConcesionarios((err, concesionarios) => {
        if (err) {
            // Si falla la consulta, mostramos la vista con el error y registramos el error en consola
            console.error('Error al cargar concesionarios:', err);
            res.render('es-admin', {
                error: 'Error al cargar concesionarios',
                success: undefined,
                concesionarios: []
            });
        }

        // Mostramos la vista de administrador con los concesionarios disponibles
        res.render('es-admin', {
            error: undefined,
            success: undefined,
            concesionarios: concesionarios
        });
    });

});

// GET de la página de administrador en inglés, con su middleware de verificación de acceso
router.get('/en-admin', (req, res) => {
    res.render('en-admin');
});

// POST del registro de un nuevo usuario
router.post('/submit-register', (req, res) => {
    try {
        //Datos enviados desde el form
        console.log(req.body);
        const language = req.body.idioma;
        const name = req.body.nombre;
        const email = req.body.correo;
        const password = req.body.password;
        const telephone = req.body.telefono;
        const role = req.body.rol;
        const idConcesionario = req.body.concesionario;

        //Consultamos si el correo existe ya en la BD
        const consulta1 = 'SELECT * FROM Usuarios WHERE correo = ?';
        pool.query(consulta1, [email], (err, results) => {
            if (err) {
                console.error('Error al verificar el correo:', err);
                return res.status(500);
            }

            //Si el correo ya existe, entonces mostramos mensaje de error
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

            //Gestionamos los valores opcionales
            const telephoneValue = telephone === '' ? null : telephone;
            const concesionarioValue = idConcesionario === '' ? null : idConcesionario;

            //El rol por defecto será el empleado
            const roleValue = (role && role.trim() === 'admin') ? 'admin' : 'empleado';

            //Gestionamos la encriptación de la contraseña antes de guardala en la BD
            const saltRounds = 10;
            bcrypt.hash(password, saltRounds, (errEncriptacion, hashedPassword) => {
                if (errEncriptacion) {
                    console.error('Error al encriptar la contraseña: ', errEncriptacion);
                    return res.status(500);

                }

                //Consulta para insertar al usuario
                const consulta = `INSERT INTO Usuarios (nombre, correo, contraseña, rol, telefono, id_concesionario) 
                          VALUES (?, ?, ?, ?, ?, ?)`;
                pool.query(consulta, [name, email, hashedPassword, roleValue, telephoneValue, concesionarioValue], errInsert => {
                    if (errInsert) {

                        //Si ocurre un error en la inserción, mostramos el error en la vista y por consula
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

                    //Si no hubo errores, se muestra en la vista un mensaje de éxito en el registro del usuario
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
        //Si se obtiene cualquier error desconocido, se envía un error500
        console.error('Error en el registro de un usuario: ', err);
        res.status(500);
    }

});

//Función auxiliar para obtener los concesionarios disponibles en la BD
const obtenerConcesionarios = (callback) => {
    const consulta = 'SELECT id_concesionario, nombre, ciudad FROM Concesionarios';
    pool.query(consulta, (err, results) => {
        if (err) return callback(err, null)
        callback(null, results)
    });
};

module.exports = router;