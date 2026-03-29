const express = require('express');
const path = require('path');
const apiRouter = require('./routes/api');


//Importación de routers
const vehiculosRouter = require('./routes/vehiculos');
const concesionariosRouter = require('./routes/concesionarios');
const usuariosRouter = require('./routes/usuarios');
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

//Mensajes de error tanto en español como en inglés
const errorMessages = {
    es: {
        '404-title': 'Error 404',
        '404-text1': 'Lo sentimos, no encontramos la página que está buscando.',
        '404-text2': 'Es posible que hayamos movido o eliminado la página, o que hayas escrito una URL incorrecta.',
        '500-title': 'Error 500',
        '500-text1': 'Hemos encontrado un problema inesperado.',
        '500-text2': 'Por favor, inténtalo de nuevo más tarde.'
    },
    en: {
        '404-title': 'Error 404',
        '404-text1': 'Sorry, we couldn\'t find the page you are looking for.',
        '404-text2': 'We may have moved or deleted the page, or you may have typed an incorrect URL.',
        '500-title': 'Error 500',
        '500-text1': 'We encountered an unexpected problem.',
        '500-text2': 'Please try again later.'
    }
};
//Inicialización de express
const app = express();

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

//Se aplica el middleware de la sesión
app.use(middleWareSession);

app.use((req, res, next) => {
    // Si la sesión NO debe recordarse y existe en BD...
    if (req.session && req.session.recordar === false) {

        // Fuerza a que NO quede persistente
        req.session.cookie.expires = false;
        req.session.cookie.maxAge = null;

        // Y si el usuario cerró el navegador, la sesión no volverá
    }

    next();
});

//Middleware para compartir datos de sesión con las vistas EJS
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.usuario = req.session.usuario || null;


    // Detectar idioma desde la URL si no está en sesión
    let lang = req.session.lang || 'es';

    // Si la URL contiene '/en-' o termina con rutas en inglés, usar inglés
    if (req.path.includes('/en-') || req.path.startsWith('/en/')) {
        lang = 'en';
    }
    // Si la URL contiene '/es-' o termina con rutas en español, usar español
    else if (req.path.includes('/es-') || req.path.startsWith('/es/')) {
        lang = 'es';
    }

    res.locals.lang = lang;
    next();
});

// Middleware para establecer el idioma en la sesión si se envía en el body
app.use((req, res, next) => {

    if (req.method === 'POST' && req.body.idioma) {

        const newLang = req.body.idioma === 'english' ? 'en' : 'es';
        req.session.lang = newLang;
    }
    next();
});

// Middleware para actualizar automáticamente los estados de las reservas
app.use((req, res, next) => {
    const Reserva = require('./models/Reserva');

    // Actualizar estados de reservas automáticamente
    Reserva.actualizarEstadosAutomaticamente((err, resultado) => {
        if (err) {
            console.error('Error al actualizar estados de reservas:', err);
        } else if (resultado && (resultado.finalizadas > 0 || resultado.liberados > 0)) {
            console.log(`Actualización automática: ${resultado.finalizadas} reservas finalizadas, ${resultado.liberados} vehículos liberados`);
        }
        // Continuar con la petición independientemente del resultado
        next();
    });
});

//Rutas principales de la app
app.use('/api', apiRouter);

app.use('/', vehiculosRouter);
app.use('/', concesionariosRouter);
app.use('/', usuariosRouter);
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
    res.render('es-inicio', {
        usuario: req.session.usuario || null,
        lang: res.locals.lang || 'es'
    });
});
app.get('/en-home', (req, res) => {
    res.render('en-home');
});


//Manejador del error 404
app.use(function (req, res, next) {

    const lang = res.locals.lang || 'es';
    const messages = errorMessages[lang] || errorMessages['es'];

    const error = messages['404-title'];
    const texto1 = messages['404-text1'];
    const texto2 = messages['404-text2'];

    res.status(404).render("errors", {
        error,
        texto1,
        texto2,
        lang,
        usuario: (req.session && req.session.usuario) || null
    });
});

//Manejador del error 500
app.use(function (err, req, res, next) {

    const lang = res.locals.lang || 'es';
    const messages = errorMessages[lang] || errorMessages['es'];

    const error = messages['500-title'];
    const texto1 = messages['500-text1'];
    const texto2 = messages['500-text2'];

    console.error('Error 500:', err); // Registrar el error


    res.status(500).render("errors", {
        error,
        texto1,
        texto2,
        lang,
        usuario: (req.session && req.session.usuario) || null
    });
});

module.exports = app;