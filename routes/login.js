const express = require('express');
const router = express.Router();
const pool = require('../db')
const bcrypt = require('bcrypt')

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
router.post('/submit_login', (req, res) => {
    try {
        //Datos enviados desde el form de inicio de sesión
        console.log(req.body);
        const language = req.body.idioma;
        const email = req.body.correo;
        const password = req.body.password;


        // Validar campos obligatorios
        if (!email || !password || email.trim() === '' || password.trim() === '') {
            if (language === 'english')
                return res.render('en-login', { error: 'Email and password are required' });
            else
                return res.render('es-login', { error: 'El correo y la contraseña son obligatorios' });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            if (language === 'english')
                return res.render('en-login', { error: 'Invalid email format' });
            else
                return res.render('es-login', { error: 'Formato de correo inválido' });
        }

        //Consulta para obtener el usuario según el correo único
        const consulta = 'SELECT * FROM Usuarios WHERE correo = ?';
        pool.query(consulta, [email], async (err, results) => {
            if (err) {

                //Si hay algún error en la consulta lo muestra como error500
                console.error('Error al consultar la base de datos sobre el usuario:', err);
                return res.status(500);
            }

            //Si no se encuentra ningún usuario con ese correo, muestra el error en la vista
            if (results.length === 0) {
                if (language === 'english')
                    return res.render('en-login', { error: `User not found` });
                else
                    return res.render('es-login', { error: `Usuario no encontrado` });
            }

            //Se encuentra el usuario y mostramos sus datos por consola
            const usuario = results[0];
            console.log(`Contraseña usuario de la BD: ${usuario.contraseña}`);
            console.log(`Contraseña usuario del form: ${password}`);

            //Verificamos la contraseña encriptada
            const compare = await bcrypt.compare(password, usuario.contraseña);
            if (!compare) {

                //Si la contraseña es incorrecta, mostramos el error en la vista
                if (language === 'english')
                    return res.render('en-login', { error: 'Incorrect password' });
                else
                    return res.render('es-login', { error: 'Contraseña incorrecta' });
            }

            //Si el usuario marcó 'Recordar contraseña', extendemos la vida de la cookie a 7días
            if (req.body.recordar) {
                req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
            } else {
                //Si no lo marcó, entonces expirará al cerrar el navegador
                req.session.cookie.expires = false;
            }

            //Guardamos lso datos del usuario en la sesión si todo salió bien
            req.session.usuario = {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
                telefono: usuario.telefono,
                id_concesionario: usuario.id_concesionario
            };

            //Redirigimos la vista según el idioma
            if (language === 'english')
                res.redirect('en-user');
            else
                res.redirect('login');

        });
    }
    catch (err) {
        //Si se obtiene cualquier error desconocido, se envía un error500
        res.status(500);

    }
});


module.exports = {
    router
};