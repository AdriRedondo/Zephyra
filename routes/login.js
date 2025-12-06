const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const { validateLogin } = require('../middleware/validations');
const Usuario = require('../models/Usuario');



//GET de la página de inicio de sesión en español
router.get('/es-login', (req, res) => {
    res.render('es-login');
});

//GET de la página de inicio de sesión en inglés
router.get('/en-login', (req, res) => {
    res.render('en-login');
});

//GET de la página de inicio de sesión después de haber iniciado sesión en español
router.get('/login', (req, res) => {
    res.render('es-inicio', { login: true });
});

//GET de la página de inicio de sesión después de haber iniciado sesión en inglés
router.get('/en-user', (req, res) => {
    res.render('en-home', { login: true });
});

//POST del envío del form de inicio de sesión de un usuario
router.post('/submit_login', validateLogin, (req, res) => {
    const language = req.body.idioma;

    // Usar datos validados del middleware
    const { correo, password, recordar } = req.validatedData;

    Usuario.obtenerPorCorreo(correo, (err, user) => {
        if (err) {
            //Si hay algún error en la consulta lo muestra como error500
            console.error('Error al consultar la base de datos sobre el usuario:', err);
            return res.status(500).send('Error al cargar un usuario por su correo');
        }

        //Si no se encuentra ningún usuario con ese correo, muestra el error en la vista
        if (!user) {
            const vista = language === 'english' ? 'en-login' : 'es-login';
            const error = language === 'english'
                ? 'User not found'
                : 'Usuario no encontrado';
            return res.render(vista, { error });
        }

        //Verificamos la contraseña encriptada
        bcrypt.compare(password, user.contraseña, (errCompare, match) => {
            if (errCompare) {
                console.error('Error al comparar contraseñas:', errCompare);
                const vista = language === 'english' ? 'en-login' : 'es-login';
                const error = language === 'english'
                    ? 'Authentication error'
                    : 'Error de autenticación';
                return res.status(500).render(vista, { error });
            }

            if (!match) {
                //Si la contraseña es incorrecta, mostramos el error en la vista
                const vista = language === 'english' ? 'en-login' : 'es-login';
                const error = language === 'english'
                    ? 'Incorrect password'
                    : 'Contraseña incorrecta';
                return res.render(vista, { error });
            }

            //Si el usuario marcó 'Recordar contraseña', extendemos la vida de la cookie a 7días
            if (recordar) {
                req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
            } else {
                //Si no lo marcó, entonces expirará al cerrar el navegador
                req.session.cookie.expires = false;
            }

            //Guardamos lso datos del usuario en la sesión si todo salió bien
            req.session.usuario = {
                id_usuario: user.id_usuario,
                nombre: user.nombre,
                correo: user.correo,
                rol: user.rol,
                telefono: user.telefono,
                id_concesionario: user.id_concesionario
            };

            //Redirigimos la vista según el idioma
            if (language === 'english')
                res.redirect('/en-user');
            else
                res.redirect('/login');

        });
    });
});

module.exports = {
    router
};