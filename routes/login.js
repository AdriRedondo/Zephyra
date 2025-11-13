const express = require('express');
const router = express.Router();

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
    console.log(req.body);

    let email = req.body.correo;
    let password = req.body.contraseña;

    if (req.body.idioma === 'english')
        res.render('en-user', { correo: email });
    else
        res.render('es-usuario', { correo: email });
});


module.exports = {
    router,
    usuarios
};