const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para servir toda la carpeta public como estática
app.use(express.static(path.join(__dirname, 'public')));

// Rutas para español (por defecto)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-es', 'index.html'));
});

app.get('/html-es', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-es', 'index.html'));
});

app.get('/es/contacto', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-es', 'contacto.html'));
});

app.get('/html-es/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-es', 'registro.html'));
});

app.get('/html-es/reservas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-es', 'reservas.html'));
});

app.get('/html-es/vehiculos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-es', 'vehiculos.html'));
});

// Rutas para inglés
app.get('/html-es', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-en', 'index-en.html'));
});

app.get('/html-es/bookings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-en', 'bookings-en.html'));
});

app.get('/html-es/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-en', 'contact-en.html'));
});

app.get('/html-es/vehicles', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html-en', 'vehicles-en.html'));
});




app.listen(PORT, (err) => {
    if (err) {
        console.log(`Error al abrir un servidor en el puerto 3000: ${err}`);
    }
    else {
        console.log('Servidor en 3000.');
    }
});