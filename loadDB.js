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

    // Carga de clientes si está vacía su tabla
    function cargarClientesSiNecesario() {
        const consulta = 'SELECT COUNT(*) AS hayDatos FROM Cliente';
        pool.query(consulta, (err, res) => {
            if (err) return console.error('Error al verificar Cliente:', err);

            if (res[0].hayDatos === 0) {
                cargarClientes(data.clientes, () => {
                    console.log('Clientes cargados');
                    cargarReservasSiNecesario();
                });
            } else {
                console.log('La tabla Cliente ya tiene datos, no se cargan más');
                cargarReservasSiNecesario();
            }
        });
    }

    // Carga de reservas si está vacía su tabla
    function cargarReservasSiNecesario() {
        const consulta = 'SELECT COUNT(*) AS hayDatos FROM Reservas';
        pool.query(consulta, (err, res) => {
            if (err) return console.error('Error al verificar Reservas:', err);

            if (res[0].hayDatos === 0) {
                cargarReservas(data.reservas, () => {
                    console.log('Reservas cargadas');
                });
            } else {
                console.log('La tabla Reservas ya tiene datos, no se cargan más');
            }
        });
    }

}

// Carga de concesionarios
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

// Carga de usuarios
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

// Carga de vehículos
function cargarVehiculos(vehiculos, callback) {

    if (!vehiculos || vehiculos.length === 0) {
        console.log('No hay vehículos que cargar');
        return callback();
    }

    let completed = 0;
    const imagenesDir = path.join(__dirname, 'public', 'images', 'vehiculos');

    vehiculos.forEach(v => {

        // Leer la imagen PNG desde el archivo si existe
        let imagenBuffer = null;

        if (v.imagen) {
            const imagePath = path.join(imagenesDir, v.imagen);
            if (fs.existsSync(imagePath)) {
                try {
                    // Leer el archivo como Buffer (BLOB)
                    imagenBuffer = fs.readFileSync(imagePath);
                    console.log(`Imagen ${v.imagen} cargada`);
                } catch (error) {
                    console.error(`Error al leer imagen ${v.imagen}:`, error.message);
                }
            } else {
                console.log(`Advertencia: No se encontró la imagen ${imagePath}`);
            }
        }

        const consulta = `INSERT INTO Vehiculos (matricula, marca, modelo, anyo_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        pool.query(consulta, [v.matricula, v.marca, v.modelo, v.anyo_matriculacion, v.numero_plazas, v.autonomia_km, v.color, imagenBuffer, v.estado, v.id_concesionario], err => {
            if (err) console.error(`Error con ${v.matricula}:`, err.message);
            completed++;
            if (completed === vehiculos.length) {
                callback();
            }
        });
    });
}

// Carga de clientes
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

// Carga de reservas
function cargarReservas(reservas, callback) {
    if (!reservas || reservas.length === 0) {
        console.log('No hay reservas que cargar');
        return callback();
    }

    let completed = 0;
    const total = reservas.length;

    reservas.forEach(r => {

        const consulta = `
            INSERT INTO Reservas (id_vehiculo, id_usuario, id_cliente, fecha_inicio, fecha_fin, estado, kilometros_recorridos, incidencias_reportadas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        pool.query(
            consulta,
            [
                r.id_vehiculo,
                r.id_usuario || null,
                r.id_cliente,
                r.fecha_inicio,
                r.fecha_fin,
                r.estado || 'activa',
                r.kilometros_recorridos || null,
                r.incidencias_reportadas || null
            ],
            err => {
                if (err) {
                    console.error(`Error al insertar reserva (Vehículo ${r.id_vehiculo}):`, err.message);
                } else {
                    console.log(`Reserva insertada para vehículo ${r.id_vehiculo}`);
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