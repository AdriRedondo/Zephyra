const express = require('express');
const router = express.Router();
const requiredAdminId = require('../middleware/autorizaciones').requiredAdminId;
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const Concesionario = require('../models/Concesionario');

const { validateUser } = require('../middleware/validations');

// GET para mostrar el formulario de registro de usuario
router.get('/es-user/register', requiredAdminId, (req, res) => {
    const language = req.query.idioma || 'español';
    Concesionario.obtenerTodos((err, concesionarios) => {
        if (err) concesionarios = [];
        const vista = language === 'english' ? 'en-usuario-form' : 'es-usuario-form';
        res.render(vista, { concesionarios, error: null });
    });
});

// POST del registro de un nuevo usuario
router.post('/user-register', requiredAdminId, validateUser, (req, res) => {
    try {
        const language = req.body.idioma;

        // Usar datos validados del middleware
        const { nombre, correo, password, telefono, rol, id_concesionario } = req.validatedData;

        //Consultamos si el correo existe ya en la BD
        Usuario.obtenerPorCorreo(correo, (err, userCorreo) => {
            if (err) {
                console.error('Error al verificar el correo:', err);
                return res.status(500).send('Error al verificar el correo');
            }

            //Si el correo ya existe, entonces mostramos mensaje de error
            if (userCorreo) {
                return Concesionario.obtenerTodos((error, concesionarios) => {
                    if (error) {
                        console.error('Error al obtener los concesionarios:', err);
                        return res.status(500).send('Error al obtener los concesionarios');
                    }

                    const vista = language === 'english' ? 'en-usuario-form' : 'es-usuario-form';
                    const errorMsg = language === 'english' ? 'Email already registered' : 'El correo ya está registrado';

                    return res.render(vista, {
                        error: errorMsg,
                        concesionarios
                    });
                });
            }

            //Gestionamos la encriptación de la contraseña antes de guardala en la BD
            const saltRounds = 10;
            bcrypt.hash(password, saltRounds, (errEncriptacion, hashedPassword) => {
                if (errEncriptacion) {
                    console.error('Error al encriptar la contraseña: ', errEncriptacion);
                    return res.status(500), send('Error al encriptar la contraseña');
                }
                Usuario.crear({
                    nombre,
                    correo,
                    contrasenya: hashedPassword,
                    rol,
                    telefono,
                    id_concesionario
                }, (errInsert, nuevoId) => {
                    if (errInsert) {
                        console.error('Error al insertar usuario:', errInsert);
                        return res.status(500).send('Error al insertar usuario');
                    }

                    // Registro exitoso
                    const vista = language === 'english' ? 'en-admin' : 'es-admin';
                    console.log(`Usuario creado con ID: ${result.insertId}`);

                    res.redirect(vista);
                })
            });
        });
    }
    catch (err) {
        //Si se obtiene cualquier error desconocido, se envía un error500
        console.error('Error en el registro de un usuario: ', err);
        res.status(500).send('Error en el registro de un usuario: ');
    }
});


router.get('/es-user/edit/:id', requiredAdminId, (req, res) => {
    const id = req.params.id;

    Usuario.obtenerPorId(id, (err, user) => {

        if (err) {
            console.error(`Error al obtener el usuario con ID ${id}:`, err);
            return res.status(500).send(`Error al obtener el usuario con ID ${id}:`);
        }
        if (!user) {
            return res.status(404).send(`No hay un usario con el ID ${id}`);
        }

        Concesionario.obtenerTodos((errConc, concesionarios) => {
            if (errConc) {
                console.error("Error al obtener los concesionarios:", err);
                return res.status(500).send("Error al obtener los concesionarios");
            }

            res.render('es-usuario-form', {
                user,
                concesionarios
            });
        });
    });
});

router.post('/user-edit/:id', requiredAdminId, validateUser, (req, res) => {
    const id = req.params.id;
    const { nombre, correo, password, telefono, rol, id_concesionario } = req.validatedData;

    const actualizar = (hashedPass = null) => {
        Usuario.actualizar(
            id,
            {
                nombre,
                correo,
                telefono,
                rol,
                id_concesionario,
                contrasenya: hashedPass
            },
            (err, filasAfectadas) => {
                if (err) {
                    console.error("Error al actualizar usuario:", err);
                    return res.status(500).send("Error al actualizar usuario");
                }

                if (filasAfectadas === 0) {
                    return res.status(404).send(`No se ha encontrado un concesionario con ID ${id}`);
                }

                res.redirect('/es-admin');
            }
        );
    };

    // Si el admin no cambia la contraseña -> no actualizarla
    if (!password) {
        actualizar();
    } else {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error al encriptar contraseña:', err);
                return res.status(500).send('Error al encriptar contraseña');
            }
            actualizar(hashedPassword);
        });
    }
});

router.post('/user-delete/:id', requiredAdminId, (req, res) => {
    const id = req.params.id;

    Usuario.eliminar(id, (err, filasAfectadas) => {
        if (err) {
            console.error(`Error al eliminar el vehículo con ID ${id}:`, err);
            return res.status(500).send("Error interno al eliminar vehículo");
        }

        if (filasAfectadas === 0) {
            return res.status(404).send(`Vehículo con ID ${id} no encontrado`);
        }

        console.log(`Vehículo eliminado con ID: ${id}`);

        //Hay que cambiarlo con ajax ??
        res.redirect('/es-admin');
    });
});

module.exports = router;