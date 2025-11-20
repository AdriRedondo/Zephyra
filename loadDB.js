const fs = require('fs');
const path = require('path');
const pool = require('./db');
const bcrypt = require('bcrypt');

function cargarDatosIniciales() {
    const jsonPath = path.join(__dirname, 'data.json');

    if (!fs.existsSync(jsonPath)) {
        console.log('No se encontró el archivo data.json');
        return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    // Carga de concesionarios si está vacía su tabla
    const consultaC = 'SELECT COUNT(*) AS hayDatosC FROM Concesionarios';
    pool.query(consultaC, (err, res) => {
        if (err) return console.error('Error al verificar Concesionarios:', err);

        if (res[0].hayDatosC === 0) {
            cargarConcesionarios(data.concesionarios, () => {
                console.log('Concesionarios cargados');
                cargarUsuariosSiNecesario();
            });
        } else {
            console.log('La tabla de concesionarios ya tiene datos, no se cargan más');
            cargarUsuariosSiNecesario();
        }
    });
    // Carga de usuarios si está vacía su tabla
    function cargarUsuariosSiNecesario() {
        const consultaU = 'SELECT COUNT(*) AS hayDatosU FROM Usuarios';
        pool.query(consultaU, (err, res) => {
            if (err) return console.error('Error al verificar Usuarios:', err);

            if (res[0].hayDatosU === 0) {
                cargarUsuarios(data.usuarios, () => {
                    console.log('Usuarios cargados');
                    cargarVehiculosSiNecesario();
                });
            } else {
                console.log('La tabla de usuarios ya tiene datos, no se cargan más');
                cargarVehiculosSiNecesario();
            }
        });
    }
    // Carga de vehículos si está vacía su tabla
    function cargarVehiculosSiNecesario() {
        const consultaV = 'SELECT COUNT(*) AS hayDatosV FROM Vehiculos';
        pool.query(consultaV, (err, res) => {
            if (err) return console.error('Error al verificar Vehiculos:', err);

            if (res[0].hayDatosV === 0) {
                cargarVehiculos(data.vehiculos, () => {
                    console.log('Vehículos cargados');
                    cargarClientesSiNecesario();
                });
            } else {
                console.log('la tabla de vehículos ya tiene datos, no se cargan más');
                cargarClientesSiNecesario();
            }
        });
    }

    function cargarClientesSiNecesario() {
        const consulta = 'SELECT COUNT(*) AS hayDatos FROM Cliente';
        pool.query(consulta, (err, res) => {
            if (err) return console.error('Error al verificar Cliente:', err);

            if (res[0].hayDatos === 0) {
                cargarClientes(data.clientes, () => {
                    console.log('Clientes cargados');
                });
            } else {
                console.log('La tabla Cliente ya tiene datos, no se cargan más');
            }
        });
    }

}




function cargarConcesionarios(concesionarios, callback) {
    if (!concesionarios || concesionarios.length === 0) {
        console.log('No hay concesionarios que cargar');
        return callback();
    }
    let completed = 0;

    concesionarios.forEach(c => {
        const consulta = 'INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) VALUES (?, ?, ?, ?) ';
        pool.query(consulta, [c.nombre, c.ciudad, c.direccion, c.telefono_contacto], err => {
            if (err) {
                console.log(`Error con ${c.nombre}: `, err.message);
            }
            else {
                console.log(`Datos de ${c.nombre} insertados`);
            }
            completed++;
            if (completed === concesionarios.length) callback();
        });
    });
}

function cargarUsuarios(usuarios, callback) {
    if (!usuarios || usuarios.length === 0) {
        console.log('No hay usuarios que cargar');
        return callback();
    }

    let completed = 0;
    const total = usuarios.length;
    const saltRounds = 10;

    usuarios.forEach(u => {

        // Se encripta la contraseña  del usuario
        bcrypt.hash(u.contraseña, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error(`Error codificando contraseña para ${u.nombre}:`, err);
                if (++completed === total) callback();
                return;
            }
            const consulta = 'INSERT INTO Usuarios (nombre, correo, contraseña, rol, telefono, id_concesionario) VALUES (?, ?, ?, ?, ?, ?) ';
            pool.query(consulta, [u.nombre, u.correo, hashedPassword, u.rol, u.telefono, u.id_concesionario], err => {
                if (err) {
                    console.log(`Error al insertar el usuario ${u.nombre}: `, err.message);
                }
                else {
                    console.log(`Datos del usuario ${u.nombre} insertados`);
                }

                completed++;
                if (completed === total) {
                    callback();
                }
            });
        });

    });
}

function cargarVehiculos(vehiculos, callback) {

    if (!vehiculos || vehiculos.length === 0) {
        console.log('No hay vehículos que cargar');
        return callback();
    }

    let completed = 0;

    vehiculos.forEach(v => {
        const consulta = `INSERT INTO Vehiculos (matricula, marca, modelo, anyo_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        pool.query(consulta, [v.matricula, v.marca, v.modelo, v.anyo_matriculacion, v.numero_plazas, v.autonomia_km, v.color, v.imagen, v.estado, v.id_concesionario], err => {
            if (err) console.error(`Error con ${v.matricula}:`, err.message);
            completed++;
            if (completed === vehiculos.length) {
                callback();
            }
        });
    });
}
function cargarClientes(clientes, callback) {
    if (!clientes || clientes.length === 0) {
        console.log('No hay clientes que cargar');
        return callback();
    }

    let completed = 0;
    const total = clientes.length;

    clientes.forEach(c => {

        const consulta = `
            INSERT INTO Cliente (nombre, correo, telefono, preferencias_accesibilidad, direccion, codigo_postal)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        pool.query(
            consulta,
            [
                c.nombre,
                c.correo,
                c.telefono || null,
                JSON.stringify(c.preferencias_accesibilidad || {}),
                c.direccion || null,
                c.codigo_postal || null
            ],
            err => {
                if (err) {
                    console.error(`Error al insertar cliente ${c.nombre}:`, err.message);
                } else {
                    console.log(`Cliente ${c.nombre} insertado`);
                }

                completed++;
                if (completed === total) callback();
            }
        );
    });
}

module.exports = {
    cargarDatosIniciales
}