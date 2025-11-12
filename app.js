const express = require('express');
const path = require('path');
const pool = require('./db');

const vehiculosRouter = require('./routes/vehiculos');
const reservasRouter = require('./routes/reservas');
const contactoRouter = require('./routes/contacto');
const registroRouter = require('./routes/registro');

const app = express();
const PORT = 3000;

app.use(express.json());

// Middleware para servir toda la carpeta public como estática
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', vehiculosRouter);
app.use('/', reservasRouter);
app.use('/', contactoRouter);
app.use('/', registroRouter);

app.get('/', (req, res) => {
    res.redirect('es-inicio');
});

app.get('/es-inicio', (req, res) => {
    res.render('es-inicio');
});

app.get('/en-home', (req, res) => {
    res.render('en-home');
});


app.get('/users', (req, res) => {
    // Ejemplo de query en la BD
    pool.query('SELECT * FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            res.status(500).send('Error al obtener usuarios');
            return;
        }
        console.log(results);
    });
});

app.use(function (req, res, next) {
    res.status(404);
    res.render("error404", { url: req.url });
});

app.use(function (err, req, res, next) {
    res.status(500);
    res.render("error500", { err: 'Error interno del servidor' });
});




app.listen(PORT, (err) => {
    if (err) {
        console.log(`Error al abrir un servidor en el puerto 3000: ${err}`);
    }
    else {
        console.log('Servidor en 3000.');
    }
});