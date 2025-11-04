const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para servir toda la carpeta public como estática
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index');
});

app.use(express.urlencoded({ extended: false }));

app.post('/submit_contact', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let email = req.body.correo;
    let message = req.body.mensaje;

    if (req.body.idioma === 'english')
        res.redirect('contact-en.html');
    else
        res.redirect('/contacto.html');
});

app.post('/submit-register', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let password = req.body.contraseña;

    if (req.body.idioma === 'english')
        res.redirect('register-en.html');
    else
        res.redirect('/registro.html');
});

app.post('/submit-bookings', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let email = req.body.correo;
    let vehicles = req.body.vehiculos_form;
    let start = req.body.correo;
    let hours = req.body.horas;
    let phone = req.body.telefono;

    if (req.body.idioma === 'english')
        res.redirect('bookings-en.html');
    else
        res.redirect('/reservas.html');
});


app.listen(PORT, (err) => {
    if (err) {
        console.log(`Error al abrir un servidor en el puerto 3000: ${err}`);
    }
    else {
        console.log('Servidor en 3000.');
    }
});