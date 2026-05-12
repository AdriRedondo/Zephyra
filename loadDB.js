const mysql = require('mysql');
const bcrypt = require('bcrypt');

const DB_NAME = 'zephyra';

// Configuración para XAMPP
const CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: ''
};

// 1. Conexión inicial para crear la BD
const connection = mysql.createConnection(CONFIG);

connection.connect((err) => {
    if (err) {
        console.error('Error de conexión:', err.message);
        return;
    }

    // 2. Crear base de datos
    connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`, (err) => {
        if (err) {
            console.error('Error creando la base de datos:', err.message);
            connection.end();
            return;
        }
        // Cerrar conexión inicial
        connection.end();

        // 3. Nueva conexión con la BD seleccionada
        const dbConnection = mysql.createConnection({
            ...CONFIG,
            database: DB_NAME
        });

        dbConnection.connect((err) => {
            if (err) {
                console.error('Error conectando a la base de datos:', err.message);
                return;
            }

            // 4. Crear tablas

            const tablas = [
                {
                    nombre: 'Concesionarios',
                    consulta: `CREATE TABLE IF NOT EXISTS Concesionarios (
                        id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
                        nombre VARCHAR(100) NOT NULL,
                        ciudad VARCHAR(100) NOT NULL,
                        direccion VARCHAR(200),
                        telefono_contacto VARCHAR(20),
                        latitud DECIMAL(10, 7),
                        longitud DECIMAL(11, 7)
                    )`
                },
                {
                    nombre: 'Cliente',
                    consulta: `CREATE TABLE IF NOT EXISTS Cliente (
                        id_cliente INT AUTO_INCREMENT PRIMARY KEY,
                        nombre VARCHAR(100) NOT NULL,
                        correo VARCHAR(150) NOT NULL UNIQUE,
                        telefono VARCHAR(20)
                    )`
                },
                {
                    nombre: 'Usuarios',
                    consulta: `CREATE TABLE IF NOT EXISTS Usuarios (
                        id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                        nombre VARCHAR(100) NOT NULL,
                        correo VARCHAR(150) NOT NULL UNIQUE,
                        contraseña VARCHAR(255) NOT NULL, 
                        rol ENUM('empleado', 'admin') DEFAULT 'empleado',
                        telefono VARCHAR(20),
                        id_concesionario INT,
                        preferencias_accesibilidad JSON,
                        CONSTRAINT fk_usuario_concesionario
                            FOREIGN KEY (id_concesionario)
                            REFERENCES Concesionarios(id_concesionario)
                            ON DELETE SET NULL
                            ON UPDATE CASCADE
                    )`
                },
                {
                    nombre: 'Vehiculos',
                    consulta: `CREATE TABLE IF NOT EXISTS Vehiculos (
                        id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
                        matricula VARCHAR(20) NOT NULL UNIQUE,
                        marca VARCHAR(50) NOT NULL,
                        modelo VARCHAR(50) NOT NULL,
                        anyo_matriculacion YEAR,
                        numero_plazas INT,
                        autonomia_km DECIMAL(6,1),
                        color VARCHAR(30),
                        imagen LONGBLOB,
                        estado ENUM('disponible', 'reservado', 'mantenimiento') DEFAULT 'disponible',
                        id_concesionario INT NOT NULL,
                        CONSTRAINT fk_vehiculo_concesionario
                            FOREIGN KEY (id_concesionario)
                            REFERENCES Concesionarios(id_concesionario)
                            ON DELETE CASCADE
                            ON UPDATE CASCADE
                    )`
                },
                {
                    nombre: 'Reservas',
                    consulta: `CREATE TABLE IF NOT EXISTS Reservas (
                        id_reserva INT AUTO_INCREMENT PRIMARY KEY,
                        id_usuario INT,
                        id_cliente INT NOT NULL,
                        id_vehiculo INT NOT NULL,
                        fecha_inicio DATETIME NOT NULL,
                        fecha_fin DATETIME NOT NULL,
                        estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
                        kilometros_recorridos DECIMAL(8,2),
                        incidencias_reportadas TEXT,
                        puntuacion TINYINT CHECK (puntuacion BETWEEN 1 AND 5),
                        comentario TEXT,
                        CONSTRAINT fk_reserva_usuario
                            FOREIGN KEY (id_usuario)
                            REFERENCES Usuarios(id_usuario)
                            ON DELETE SET NULL
                            ON UPDATE CASCADE,
                        CONSTRAINT fk_reserva_cliente
                            FOREIGN KEY (id_cliente)
                            REFERENCES Cliente(id_cliente)
                            ON DELETE CASCADE
                            ON UPDATE CASCADE,
                        CONSTRAINT fk_reserva_vehiculo
                            FOREIGN KEY (id_vehiculo)
                            REFERENCES Vehiculos(id_vehiculo)
                            ON DELETE CASCADE
                            ON UPDATE CASCADE
                    )`
                }
            ];

            // Función recursiva para crear tablas
            let i = 0;
            const crearSiguienteTabla = () => {
                if (i >= tablas.length) {
                    console.log('');
                    // 5. Crear usuario admin
                    crearUsuarioAdmin(dbConnection);
                    return;
                }

                const tabla = tablas[i];
                dbConnection.query(tabla.consulta, (err) => {
                    if (err) {
                        console.error(`Error creando la tabla "${tabla.nombre}":`, err.message);
                        dbConnection.end();
                        return;
                    }
                    console.log(`Tabla "${tabla.nombre}" creada`);
                    i++;
                    crearSiguienteTabla();
                });
            };

            crearSiguienteTabla();
        });
    });
});

// Función para crear usuario admin
function crearUsuarioAdmin(dbConnection) {

    // Verificar si ya existe
    dbConnection.query(
        'SELECT id_usuario FROM Usuarios WHERE correo = ?',
        ['admin@zephyra.com'],
        (err, results) => {
            if (err) {
                console.error('Error verificando usuario admin:', err.message);
                dbConnection.end();
                return;
            }

            if (results.length > 0) {
                console.log('Usuario admin ya existe, omitiendo...');
                dbConnection.end();

                return;
            }

            // Cifrar contraseña
            bcrypt.hash('Admin123!', 10, (err, passwordHash) => {
                if (err) {
                    console.error('Error cifrando contraseña:', err.message);
                    dbConnection.end();
                    return;
                }

                // Insertar usuario admin
                dbConnection.query(
                    `INSERT INTO Usuarios (nombre, correo, contraseña, rol) 
                     VALUES (?, ?, ?, ?)`,
                    ['Administrador', 'admin@zephyra.com', passwordHash, 'admin'],
                    (err) => {
                        if (err) {
                            console.error('❌ Error creando usuario admin:', err.message);
                            dbConnection.end();
                            return;
                        }

                        console.log('Usuario admin creado');
                        console.log('Email: admin@zephyra.com');
                        console.log('Password: Admin123!');
                        dbConnection.end();

                    }
                );
            });
        }
    );
}