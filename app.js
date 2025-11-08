const express = require('express');
const path = require('path');

const vehiculosRouter = require('./routes/vehiculos');
const reservasRouter = require('./routes/reservas');
const contactoRouter = require('./routes/contacto');
const registroRouter = require('./routes/registro');

const app = express();
const PORT = 3000;

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
    res.render('es-inicio');
});

app.get('/:dir', (req, res) => {
    res.render(req.params.dir);
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