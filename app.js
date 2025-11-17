const express = require('express');
const path = require('path');
const pool = require('./db');

const vehiculosRouter = require('./routes/vehiculos');
const reservasRouter = require('./routes/reservas');
const contactoRouter = require('./routes/contacto');
const loginRouter = require('./routes/login').router;
const logoutRouter = require('./routes/logout');
const adminRouter = require('./routes/admin');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', vehiculosRouter);
app.use('/', reservasRouter);
app.use('/', contactoRouter);
app.use('/', loginRouter);
app.use('/', logoutRouter);
app.use('/', adminRouter);

app.get('/', (req, res) => {
    res.redirect('es-inicio');
});

app.get('/es-inicio', (req, res) => {
    res.render('es-inicio');
});

app.get('/error404', (req, res) => {
    res.render('error404');
});

app.get('/error500', (req, res) => {
    res.render('error500');
});

app.get('/en-home', (req, res) => {
    res.render('en-home');
});


app.get('/users', (req, res) => {

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
    res.status(404).render("error404", { url: req.url });
});

app.use(function (err, req, res, next) {
    res.status(500).render("error500", { err: 'Error interno del servidor' });
});

module.exports = app;