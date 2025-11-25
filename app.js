const express = require('express');
const path = require('path');
const pool = require('./db');


//Importación de routers
const vehiculosRouter = require('./routes/vehiculos');
const reservasRouter = require('./routes/reservas');
const contactoRouter = require('./routes/contacto');
const loginRouter = require('./routes/login').router;
const logoutRouter = require('./routes/logout');
const adminRouter = require('./routes/admin');
const perfilRouter = require('./routes/perfil');

//Módulos para manejo de sesiones
const session = require('express-session');
const mysqlSession = require('express-mysql-session');
const MySQLStore = mysqlSession(session);

//Configuración del almacenamiento de sesiones en MySQL
const sessionStore = new MySQLStore({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'zephyra'
});

//Configuración del middleware de sesión
const middleWareSession = session({
    saveUninitialized: false,
    secret: 'zephyrAA',
    resave: false,
    store: sessionStore
});

//Inicialización de express
const app = express();

//Se aplica el middleware de la sesión
app.use(middleWareSession);

//Middleware para compartir datos de sesión con las vistas EJS
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.usuario = req.session.usuario || null;
    next();
});

//Para poder usar bootstrap-icons desde el node-modules
app.use('/bootstrap-icons', express.static(__dirname + '/node_modules/bootstrap-icons'));

//Middlewares para leer JSON y formularios POST
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Para usar los archivos estáticos desde public
app.use(express.static(path.join(__dirname, 'public')));

//Para usar las plantillas 'EJS'
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Rutas principales de la app
app.use('/', vehiculosRouter);
app.use('/', reservasRouter);
app.use('/', contactoRouter);
app.use('/', loginRouter);
app.use('/', logoutRouter);
app.use('/', adminRouter);
app.use('/', perfilRouter);

//Gestión de rutas principales
app.get('/', (req, res) => {
    res.redirect('es-inicio');
});
app.get('/es-inicio', (req, res) => {
    res.render('es-inicio');
});
app.get('/en-home', (req, res) => {
    res.render('en-home');
});

//Manejador del error 404
app.use(function (req, res, next) {
    const error = 'Error 404';
    const texto1 = 'Lo sentimos - no encontramos la página que está buscando.';
    const texto2 = 'Es posible que hayamos movido o eliminado la página que estás buscando, o que hayas escrito una  URL incorrecta.';
    res.status(404).render("errors", { error, texto1, texto2 });
});

//Manejador del error 500
app.use(function (err, req, res, next) {
    const error = 'Error 500';
    const texto1 = 'Hemos encontrado un problema inesperado.';
    const texto2 = 'Por favor, inténtalo de nuevo más tarde.'
    res.status(500).render("errors", { error, texto1, texto2 });
});

module.exports = app;