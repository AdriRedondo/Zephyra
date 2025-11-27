const express = require('express');
const router = express.Router();

router.get('/es-contacto', (req, res) => {
    res.render('es-contacto');
});

router.get('/en-contact', (req, res) => {
    res.render('en-contact');
});

router.post('/submit_contact', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let email = req.body.correo;
    let message = req.body.mensaje;
    const language = req.body.idioma;

    // Validar campos obligatorios
    if (!name || !email || !message ||
        name.trim() === '' || email.trim() === '' || message.trim() === '') {
        if (language === 'english')
            return res.render('en-contact', { error: 'Name, email and message are required' });
        else
            return res.render('es-contacto', { error: 'El nombre, correo y mensaje son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        if (language === 'english')
            return res.render('en-contact', { error: 'Invalid email format' });
        else
            return res.render('es-contacto', { error: 'Formato de correo inválido' });
    }

    if (language === 'english')
        res.redirect('en-contact');
    else
        res.redirect('es-contacto');
});


module.exports = router;