const express = require('express');
const router = express.Router();
const requiredAdminId = require('../middleware/autorizaciones').requiredAdminId;
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const Concesionario = require('../models/Concesionario');


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
router.post('/user-register', requiredAdminId, (req, res) => {
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


        //Validamos los campos obligatorios
        if (!name || !email || !password) {
            return Concesionario.obtenerTodos((err, concesionarios) => {
                if (err) {
                    console.error('Error al obtener los concesionarios:', err);
                    return res.status(500).send('Error al obtener los concesionarios');
                }
                const vista = language === 'english' ? 'en-usuario-form' : 'es-usuario-form';
                const errorMsg = language === 'english' ? 'Name, email and password are required' : 'El nombre, correo y contraseña son obligatorios';

                return res.render(vista, {
                    error: errorMsg,
                    concesionarios
                });
            });
        }

        //Validamos el formato del correo electrónico corporativo @zephyra.com
        const emailRegex = /^[^\s@]+@zephyra\.com$/;
        if (!emailRegex.test(email.trim())) {

            return Concesionario.obtenerTodos((err, concesionarios) => {
                if (err) {
                    console.error('Error al obtener los concesionarios:', err);
                    return res.status(500).send('Error al obtener los concesionarios');
                }

                const vista = language === 'english' ? 'en-usuario-form' : 'es-usuario-form';
                const errorMsg = language === 'english' ? 'Email must be from corporate domain @zephyra.com' : 'El correo debe ser del dominio corporativo @zephyra.com';

                return res.render(vista, {
                    error: errorMsg,
                    concesionarios
                });
            });
        }

        // Validar contraseña segura: mínimo 8 caracteres, 1 mayúscula, 1 número
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password.trim())) {
            return Concesionario.obtenerTodos((error, concesionarios) => {
                if (error) {
                    console.error('Error al obtener los concesionarios:', err);
                    return res.status(500).send('Error al obtener los concesionarios');
                }
                const vista = language === 'english' ? 'en-usuario-form' : 'es-usuario-form';
                const errorMsg = language === 'english'
                    ? 'Password must have at least 8 characters, 1 uppercase letter and 1 number'
                    : 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número';

                return res.render(vista, {
                    error: errorMsg,
                    concesionarios
                });
            });
        }


        //Consultamos si el correo existe ya en la BD
        Usuario.obtenerPorCorreo(email, (err, userCorreo) => {
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
                    return res.status(500), send('Error al encriptar la contraseña');
                }
                Usuario.crear({
                    nombre: name,
                    correo: email,
                    contrasenya: hashedPassword,
                    rol: roleValue,
                    telefono: telephoneValue,
                    id_concesionario: concesionarioValue
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

router.post('/user-edit/:id', requiredAdminId, (req, res) => {
    const id = req.params.id;
    const { nombre, correo, password, telefono, rol, concesionario } = req.body;


    // Validar campos obligatorios
    if (!nombre || !correo || nombre.trim() === '' || correo.trim() === '') {
        return res.status(400).send('El nombre y correo son obligatorios');
    }

    // Validar formato de email corporativo @zephyra.com
    const emailRegex = /^[^\s@]+@zephyra\.com$/;
    if (!emailRegex.test(correo.trim())) {
        return res.status(400).send('El correo debe ser del dominio corporativo @zephyra.com');
    }

    const telefonoValue = telefono || null;
    const concesionarioValue = concesionario || null;
    const roleValue = (rol === 'admin') ? 'admin' : 'empleado';

    const actualizar = (hashedPass = null) => {
        Usuario.actualizar(
            id,
            {
                nombre: nombre.trim(),
                correo: correo.trim(),
                telefono: telefonoValue,
                rol: roleValue,
                id_concesionario: concesionarioValue,
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

    // Si el admin no cambia la contraseña → no actualizarla
    if (!password || password.trim() === "") {
        actualizar();
    } else {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
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