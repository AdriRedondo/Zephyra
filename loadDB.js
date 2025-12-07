const fs = require('fs');
const path = require('path');
const pool = require('./db');
const bcrypt = require('bcrypt');
const Concesionario = require('./models/Concesionario');
const Usuario = require('./models/Usuario');
const Vehiculo = require('./models/Vehiculo');

function cargarDatosIniciales() {
    const jsonPath = path.join(__dirname, 'data.json');

    if (!fs.existsSync(jsonPath)) {
        console.log('No se encontró el archivo data.json');
        return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Solo verifica si la tabla Concesionarios está vacía
    const consultaC = 'SELECT COUNT(*) AS hayDatosC FROM Concesionarios';
    pool.query(consultaC, (err, res) => {
        if (err) return console.error('Error al verificar Concesionarios:', err);

        if (res[0].hayDatosC === 0) {
            console.log('Base de datos vacía. Iniciando carga de datos...');

            // Cargar todo en secuencia
            cargarConcesionarios(data.concesionarios, () => {
                console.log('Concesionarios del json cargados');

                cargarUsuarios(data.usuarios, () => {
                    console.log('Usuarios del json cargados');

                    cargarVehiculos(data.vehiculos, () => {
                        console.log('Vehículos del json cargados');
                    });
                });
            });
        } else {
            console.log('La base de datos ya tiene datos, no se realiza carga inicial');
        }
    });
}

// Carga de concesionarios usando el modelo
function cargarConcesionarios(concesionarios, callback) {
    if (!concesionarios || concesionarios.length === 0) {
        console.log('No hay concesionarios que cargar');
        return callback();
    }

    let completed = 0;
    const total = concesionarios.length;

    concesionarios.forEach(c => {
        const datos = {
            nombre: c.nombre,
            ciudad: c.ciudad,
            direccion: c.direccion,
            telefono_contacto: c.telefono_contacto
        };

        Concesionario.crear(datos, (err, id) => {
            if (err) {
                console.log(`Error con ${c.nombre}:`, err.message);
            } else {
                console.log(`${c.nombre} insertado (ID: ${id})`);
            }
            completed++;
            if (completed === total) callback();
        });
    });
}

// Carga de usuarios usando el modelo
function cargarUsuarios(usuarios, callback) {
    if (!usuarios || usuarios.length === 0) {
        console.log('No hay usuarios que cargar');
        return callback();
    }

    let completed = 0;
    const total = usuarios.length;
    const saltRounds = 10;

    usuarios.forEach(u => {
        // Se encripta la contraseña del usuario
        bcrypt.hash(u.contraseña, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error(`Error codificando contraseña para ${u.nombre}:`, err);
                if (++completed === total) callback();
                return;
            }

            const datos = {
                nombre: u.nombre,
                correo: u.correo,
                contrasenya: hashedPassword,
                rol: u.rol,
                telefono: u.telefono,
                id_concesionario: u.id_concesionario
            };

            Usuario.crear(datos, (err, id) => {
                if (err) {
                    console.log(`Error al insertar el usuario ${u.nombre}:`, err.message);
                } else {
                    console.log(`Usuario ${u.nombre} insertado (ID: ${id})`);
                }

                completed++;
                if (completed === total) {
                    callback();
                }
            });
        });
    });
}

// Carga de vehículos usando el modelo
function cargarVehiculos(vehiculos, callback) {
    if (!vehiculos || vehiculos.length === 0) {
        console.log('No hay vehículos que cargar');
        return callback();
    }

    let completed = 0;
    const total = vehiculos.length;
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
                } catch (error) {
                    console.error(`Error al leer imagen ${v.imagen}:`, error.message);
                }
            } else {
                console.log(`Advertencia: No se encontró la imagen ${imagePath}`);
            }
        }

        const datos = {
            matricula: v.matricula,
            marca: v.marca,
            modelo: v.modelo,
            anyo_matriculacion: v.anyo_matriculacion,
            numero_plazas: v.numero_plazas,
            autonomia_km: v.autonomia_km,
            color: v.color,
            imagen: imagenBuffer,
            estado: v.estado,
            id_concesionario: v.id_concesionario
        };

        Vehiculo.crear(datos, (err, id) => {
            if (err) {
                console.error(`Error con ${v.matricula}:`, err.message);
            } else {
                console.log(`Vehículo ${v.matricula} insertado (ID: ${id})`);
            }

            completed++;
            if (completed === total) {
                callback();
            }
        });
    });
}


module.exports = {
    cargarDatosIniciales
}