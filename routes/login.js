const express = require('express');
const router = express.Router();
const pool = require('../db')
const bcrypt = require('bcrypt')

router.get('/es-login', (req, res) => {
    res.render('es-login');
});

router.get('/en-login', (req, res) => {
    res.render('en-login');
});

//Esto es temporal
router.get('/es-usuario', (req, res) => {
    res.render('es-usuario');
});

router.get('/en-user', (req, res) => {
    res.render('en-user');
});

router.post('/submit_login', (req, res) => {
    try {
        console.log(req.body);

        const language = req.body.idioma;
        const email = req.body.correo;
        const password = req.body.password;

        const consulta = 'SELECT * FROM Usuarios WHERE correo = ?';
        pool.query(consulta, [email], async (err, results) => {
            if (err) {
                console.error('Error al consultar la base de datos sobre el usuario:', err);
                return res.status(500);
            }

            //No se encuentra el usuario con ese correo
            if (results.length === 0) {
                if (language === 'english')
                    return res.render('en-login', { error: `User not found` });
                else
                    return res.render('es-login', { error: `Usuario no encontrado` });
            }

            //Se encuentra el usuario
            const usuario = results[0];
            console.log(`Contraseña usuario de la BD: ${usuario.contraseña}`);
            console.log(`Contraseña usuario del form: ${password}`);
            const compare = await bcrypt.compare(password, usuario.contraseña);
            if (!compare) {
                if (language === 'english')
                    return res.render('en-login', { error: 'Incorrect password' });
                else
                    return res.render('es-login', { error: 'Contraseña incorrecta' });
            }

            req.session.usuario = {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
                telefono: usuario.telefono,
                id_concesionario: usuario.id_concesionario
            };

            if (language === 'english')
                res.redirect('en-user');
            else
                res.redirect('es-usuario');

        });
    }
    catch (err) {
        res.status(500);

    }
});


module.exports = {
    router
};