const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para servir toda la carpeta public como estática
app.use(express.static(path.join(__dirname, 'public')));




app.listen(PORT, (err) => {
    if (err) {
        console.log(`Error al abrir un servidor en el puerto 3000: ${err}`);
    }
    else {
        console.log('Servidor en 3000.');
    }
});