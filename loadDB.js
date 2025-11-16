const fs = require('fs');
const path = require('path');
const pool = require('./db');
const bcrypt = require('bcrypt');

async function cargarDatosIniciales() {
    try {
        const jsonPath = path.join(__dirname, 'data.json');

        if (!fs.existsSync(jsonPath)) {
            console.log('No se encontró el archivo data.json');
            return;
        }

        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const hayDatos = 'SELECT COUNT(*) as hayDatos FROM Usuarios';
        pool.query(hayDatos, async (err, results) => {
            if (err) {
                console.error('Error al verificar si hay datos en la BD: ', err);
                return;
            }

            if (results[0].hayDatos > 0) {
                console.log('La base de datos ya tiene datos. No se cargan más datos iniciales');
                return;
            }

            await cargarConcesionarios(data.concesionarios);
            await cargarUsuarios(data.usuarios);
            await cargarVehiculos(data.vehiculos);
            console.log('Se han cargado los datos iniciales en la base de datos correctamente');

        });
    }
    catch (err) {
        console.error('Error en la carga de datos iniciales en la BD: ', err);

    }
}

function cargarConcesionarios(concesionarios) {
    return new Promise((resolve, reject) => {
        if (!concesionarios || concesionarios.length === 0) {
            console.log('No hay concesionarios que cargar');
            return resolve();
        }
        let completed = 0;
        const total = concesionarios.length;
        concesionarios.forEach(c => {
            const consulta = 'INSERT INTO Concesionarios (nombre, ciudad, direccion, telefono_contacto) VALUES (?, ?, ?, ?) ';
            pool.query(consulta, [c.nombre, c.ciudad, c.direccion, c.telefono_contacto], (err) => {
                if (err) {
                    console.log(`Error con ${c.nombre}: `, err.message);
                }
                else {
                    console.log(`Datos de ${c.nombre} insertados`);
                }
                completed++;
                if (completed === total) resolve();
            });
        });
    });
}

function cargarUsuarios(usuarios) {
    return new Promise(async (resolve, reject) => {
        if (!usuarios || usuarios.length === 0) {
            console.log('No hay usuarios que cargar');
            return;
        }

        let completed = 0;
        const total = usuarios.length;
        const saltRounds = 10;

        for (const u of usuarios) {
            try {
                let id_concesionario = null;
                if (u.concesionario_nombre) {
                    const consultaConcesionario = 'SELECT id_concesionario FROM Concesionarios WHERE nombre = ?';
                    await new Promise((res, rej) => {
                        pool.query(consultaConcesionario, [u.concesionario_nombre], (err, results) => {
                            if (err) {
                                console.error(`Concesionario no encontrado: ${u.concesionario_nombre}`);
                            } else if (results.length > 0) {
                                id_concesionario = results[0].id_concesionario;
                            }
                            res();
                        });
                    });
                }
                // Se encripta la contraseña  del usuario
                const hashedPassword = await bcrypt.hash(u.contraseña, saltRounds);
                console.log(`Hasheando contraseña para ${u.nombre}`);

                const consulta = 'INSERT INTO Usuarios (nombre, correo, contraseña, rol, telefono, id_concesionario) VALUES (?, ?, ?, ?, ?, ?) ';
                pool.query(consulta, [u.nombre, u.correo, hashedPassword, u.rol, u.telefono, id_concesionario], (err) => {
                    if (err) {
                        console.log(`Error al insertar el usuario ${u.nombre}: `, err.message);
                    }
                    else {
                        console.log(`Datos del usuario ${u.nombre} insertados`);
                    }

                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                });
            }
            catch (err) {
                console.error(`Error procesando ${u.nombre}:`, err.message);
                completed++;
                if (completed === total) {
                    resolve();
                }
            }
        }
    });
}

function cargarVehiculos(vehiculos) {
    return new Promise((resolve, reject) => {

        if (!vehiculos || vehiculos.length === 0) {
            console.log('No hay vehículos que cargar');
            return resolve();
        }

        let completed = 0;
        const total = vehiculos.length;

        vehiculos.forEach(v => {
            const consultaConcesionario = 'SELECT id_concesionario FROM Concesionarios WHERE nombre = ?';
            pool.query(consultaConcesionario, [v.concesionario_nombre], (err, results) => {
                if (err || results.length === 0) {
                    console.error(`Concesionario no encontrado para ${v.matricula}}`);
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                    return;
                }
                const id_concesionario = results[0].id_concesionario;
                const consulta = `INSERT INTO Vehiculos (matricula, marca, modelo, año_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                pool.query(consulta, [v.matricula, v.marca, v.modelo, v.año_matriculacion, v.numero_plazas, v.autonomia_km, v.color, v.imagen, v.estado, id_concesionario], (err) => {
                    if (err) {
                        console.error(`Error con ${v.matricula}:`, err.message);
                    } else {
                        console.log(` ${v.marca} ${v.modelo} - ${v.matricula}`);
                    }
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                });
            });
        });
    });
}

module.exports = {
    cargarDatosIniciales
}