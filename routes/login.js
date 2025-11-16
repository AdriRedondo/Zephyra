const express = require('express');
const router = express.Router();
const pool = require('../db')
const bcrypt = require('bcrypt')

const usuarios = [
    {
        nombre: 'Antonio Admin',
        rol: 'admin',
        correo: 'admin@ucm.es',
        telefono: '123456789'
    }
]

router.get('/es-login', (req, res) => {
    res.render('es-login');
});

router.get('/en-login', (req, res) => {
    res.render('en-login');
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
                return res.status(500).render('error500', { err: 'Error al verificar usuario para el login' });
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

            if (language === 'english')
                res.render('en-user', { correo: email });
            else
                res.render('es-usuario', { correo: email });

        });
    }
    catch (err) {
        res.status(500).render('error500', { err: 'Error al logear el usuario: ', err });

    }
});


module.exports = {
    router,
    usuarios
};