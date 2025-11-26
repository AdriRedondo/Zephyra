const express = require('express');
const router = express.Router();
const pool = require('../db');
const requiredAdminId = require('../autorizaciones').requiredAdminId;
const bcrypt = require('bcrypt');

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
router.post('/user-register', (req, res) => {
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

// POST para registrar un nuevo concesionario
router.post('/dealer-register', requiredAdminId, (req, res) => {
    try {
        const language = req.body.idioma;
        const nombre = req.body.nombre;
        const ciudad = req.body.ciudad;
        const direccion = req.body.direccion;
        const telefono = req.body.telefono;

        // Validación de campos obligatorios
        if (!nombre || !ciudad || !direccion) {
            return obtenerConcesionarios((errConc, concesionarios) => {
                if (errConc) concesionarios = [];

                if (language === 'english')
                    return res.render('en-admin', {
                        error: 'Name, city and address are required',
                        success: undefined,
                        concesionarios
                    });
                else
                    return res.render('es-admin', {
                        error: 'El nombre, ciudad y dirección son obligatorios',
                        success: undefined,
                        concesionarios
                    });
            });
        }

        // Gestionar teléfono opcional
        const telefonoValue = telefono === '' ? null : telefono;

        // Consulta para insertar el concesionario
        const consulta = `INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) 
                          VALUES (?, ?, ?, ?)`;

        pool.query(consulta, [nombre, ciudad, direccion, telefonoValue], (errInsert, result) => {
            if (errInsert) {
                console.error('Error al insertar concesionario:', errInsert);

                return obtenerConcesionarios((errConc, concesionarios) => {
                    if (errConc) concesionarios = [];

                    if (language === 'english')
                        return res.render('en-admin', {
                            error: 'Error registering dealer',
                            success: undefined,
                            concesionarios
                        });
                    else
                        return res.render('es-admin', {
                            error: 'Error al registrar el concesionario',
                            success: undefined,
                            concesionarios
                        });
                });
            }

            // Registro exitoso
            console.log(`Concesionario registrado con ID: ${result.insertId}`);

            obtenerConcesionarios((errConc, concesionarios) => {
                if (errConc) concesionarios = [];

                if (language === 'english')
                    res.render('en-admin', {
                        error: undefined,
                        success: `Dealer ${nombre} registered successfully!`,
                        concesionarios
                    });
                else
                    res.render('es-admin', {
                        error: undefined,
                        success: `Concesionario ${nombre} registrado correctamente`,
                        concesionarios
                    });
            });
        });

    } catch (err) {
        console.error('Error en el registro de concesionario:', err);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/es-dealer/edit/:id', requiredAdminId, (req, res) => {
    const language = req.body.idioma;

    const query = `
        SELECT *
        FROM Concesionarios
        WHERE id_concesionario = ?
    `;

    pool.query(query, [req.params.id], (err, resultados) => {
        if (err) {
            console.error('Error al obtener concesionario:', err);
            return res.status(500);
        }

        const concesionario = resultados[0];

        if (!concesionario) {
            return res.status(404);
        }

        if (language === 'english')
            res.render('en-dealer-form', { editar: true, concesionario, error: null });
        else
            res.render('es-dealer-form', { editar: true, concesionario, error: null });
    });
});


// POST para editar un concesionario existente
router.post('/dealer-edit/:id', requiredAdminId, (req, res) => {
    try {
        const id = req.params.id;

        const language = req.body.idioma;
        const nombre = req.body.nombre;
        const ciudad = req.body.ciudad;
        const direccion = req.body.direccion;
        const telefono = req.body.telefono;

        // Validación de campos obligatorios
        if (!nombre || !ciudad || !direccion || !telefono) {
            return obtenerConcesionarios((errConc, concesionarios) => {
                if (errConc) concesionarios = [];

                if (language === 'english')
                    return res.render('/en-admin', {
                        error_lista: 'Name, city and address are required',
                        concesionarios
                    });
                else
                    return res.render('/es-admin', {
                        error_lista: 'El nombre, ciudad y dirección son obligatorios',
                        concesionarios
                    });
            });
        }


        // Consulta para actualizar el concesionario
        const consulta = `UPDATE Concesionarios 
                          SET nombre = ?, ciudad = ?, direccion = ?, telefono_contacto = ?
                          WHERE id_concesionario = ?`;

        pool.query(consulta, [nombre, ciudad, direccion, telefono, id], (errUpdate) => {
            if (errUpdate) {
                console.error('Error al actualizar concesionario:', errUpdate);

                return obtenerConcesionarios((errConc, concesionarios) => {
                    if (errConc) concesionarios = [];

                    if (language === 'english')
                        return res.render('/en-admin', {
                            error_lista: 'Error updating dealer',
                            success: undefined,
                            concesionarios
                        });
                    else
                        return res.render('/es-admin', {
                            error_lista: 'Error al actualizar el concesionario',
                            success: undefined,
                            concesionarios
                        });
                });
            }

            console.log(`Concesionario actualizado con ID: ${id}`);

            obtenerConcesionarios((errConc, concesionarios) => {
                if (errConc) concesionarios = [];

                if (language === 'english')
                    res.redirect('/en-admin');
                else
                    res.redirect('/es-admin');
            });
        });

    } catch (err) {
        console.error('Error al editar concesionario:', err);
        res.status(500);
    }
});

// POST para eliminar un concesionario
router.post('/dealer-delete/:id', requiredAdminId, (req, res) => {
    try {
        const id = req.params.id;
        const language = req.body.idioma;

        // Primero verificar si hay vehículos o usuarios asociados
        const consultaVerificar = `
            SELECT 
                (SELECT COUNT(*) FROM Vehiculos WHERE id_concesionario = ?) as vehiculos,
                (SELECT COUNT(*) FROM Usuarios WHERE id_concesionario = ?) as usuarios
        `;

        pool.query(consultaVerificar, [id, id], (errVerif, results) => {
            if (errVerif) {
                console.error('Error al verificar dependencias:', errVerif);
                return res.status(500);
            }

            const vehiculosAsociados = results[0].vehiculos;
            const usuariosAsociados = results[0].usuarios;

            // Si hay vehículos o usuarios asociados, no permitir eliminar
            if (vehiculosAsociados > 0 || usuariosAsociados > 0) {
                return obtenerConcesionarios((errConc, concesionarios) => {
                    if (errConc) concesionarios = [];

                    if (language === 'english')
                        return res.render('en-admin', {
                            error_lista: `Cannot delete dealer: ${vehiculosAsociados} vehicles and ${usuariosAsociados} users associated`,
                            success: undefined,
                            concesionarios
                        });
                    else
                        return res.render('es-admin', {
                            error_lista: `No se puede eliminar: hay ${vehiculosAsociados} vehículos y ${usuariosAsociados} usuarios asociados`,
                            success: undefined,
                            concesionarios
                        });
                });
            }

            // Si no hay dependencias, proceder a eliminar
            const consultaEliminar = 'DELETE FROM Concesionarios WHERE id_concesionario = ?';

            pool.query(consultaEliminar, [id], (errDelete) => {
                if (errDelete) {
                    console.error('Error al eliminar concesionario:', errDelete);

                    return obtenerConcesionarios((errConc, concesionarios) => {
                        if (errConc) concesionarios = [];

                        if (language === 'english')
                            return res.render('en-admin', {
                                error_lista: 'Error deleting dealer',
                                success: undefined,
                                concesionarios
                            });
                        else
                            return res.render('es-admin', {
                                error_lista: 'Error al eliminar el concesionario',
                                success: undefined,
                                concesionarios
                            });
                    });
                }

                console.log(`Concesionario eliminado con ID: ${id}`);

                obtenerConcesionarios((errConc, concesionarios) => {
                    if (errConc) concesionarios = [];

                    if (language === 'english')
                        res.render('en-admin', {
                            success_lista: 'Dealer deleted successfully!',
                            concesionarios
                        });
                    else
                        res.render('es-admin', {
                            success_lista: 'Concesionario eliminado correctamente',
                            concesionarios
                        });
                });
            });
        });

    } catch (err) {
        console.error('Error al eliminar concesionario:', err);
        res.status(500);
    }
});


//Función auxiliar para obtener los concesionarios disponibles en la BD
const obtenerConcesionarios = (callback) => {
    const consulta = 'SELECT id_concesionario, nombre, ciudad, direccion, telefono_contacto FROM Concesionarios';
    pool.query(consulta, (err, results) => {
        if (err) return callback(err, null)
        callback(null, results)
    });
};

module.exports = router;