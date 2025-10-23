const http = require('node:http');

const server = http.createServer((request, response) => {
    response.statusCode = 200;
    response.end('Bienvenido al servidor!');
});

server.listen(3000, (err) => {
    if(err){
        console.log(`Error al abrir un servidor en el puerto 3000: ${err}`);
    }
    else {
        console.log('Servidor en 3000.');
    }
});