const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, (err) => {
    if (err) {
        console.log(`Error al abrir un servidor en el puerto ${PORT}: ${err}`);
    }
    else {
        console.log(`Servidor escuchando en el puerto ${PORT}.`);
    }
});