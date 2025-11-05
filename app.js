const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para servir toda la carpeta public como estática
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('es-inicio');
});

app.get('/:dir', (req, res) => {
    res.render(req.params.dir);
});


app.post('/submit_contact', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let email = req.body.correo;
    let message = req.body.mensaje;

    if (req.body.idioma === 'english')
        res.redirect('en-contact');
    else
        res.redirect('es-contacto');
});

app.post('/submit-register', (req, res) => {
    console.log(req.body);

    let name = req.body.nombre;
    let password = req.body.contraseña;

    if (req.body.idioma === 'english')
        res.redirect('en-sign-in');
    else
        res.redirect('es-registro');
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
        res.redirect('en-bookings');
    else
        res.redirect('es-reservas');
});


app.listen(PORT, (err) => {
    if (err) {
        console.log(`Error al abrir un servidor en el puerto 3000: ${err}`);
    }
    else {
        console.log('Servidor en 3000.');
    }
});