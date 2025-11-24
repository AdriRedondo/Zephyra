const express = require('express');
const path = require('path');
const pool = require('./db');

const vehiculosRouter = require('./routes/vehiculos');
const reservasRouter = require('./routes/reservas');
const contactoRouter = require('./routes/contacto');
const loginRouter = require('./routes/login').router;
const logoutRouter = require('./routes/logout');
const adminRouter = require('./routes/admin');
const perfilRouter = require('./routes/perfil');

const session = require('express-session');
const mysqlSession = require('express-mysql-session');
const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'zephyra'
});

const middleWareSession = session({
    saveUninitialized: false,
    secret: 'zephyrAA',
    resave: false,
    store: sessionStore
});

const app = express();

app.use(middleWareSession);

app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.usuario = req.session.usuario || null;
    next();
});

app.use('/bootstrap-icons', express.static(__dirname + '/node_modules/bootstrap-icons'));

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
app.use('/', perfilRouter);

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

app.use(function (req, res, next) {
    const error = 'Error 404';
    const texto1 = 'Hemos encontrado un problema inesperado.';
    const texto2 = 'Por favor, inténtalo de nuevo más tarde.'
    res.status(404).render("errors", { error, texto1, texto2 });
});

app.use(function (err, req, res, next) {
    const error = 'Error 500';
    const texto1 = 'Lo sentimos - no encontramos la página que está buscando.';
    const texto2 = 'Es posible que hayamos movido o eliminado la página que estás buscando, o que hayas escrito una  URL incorrecta.';
    res.status(500).render("errors", { error, texto1, texto2 });
});

module.exports = app;