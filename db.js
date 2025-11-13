
const mysql = require('mysql');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'zephyra'
});

pool.getConnection((err, connection) => {
    if (err) {
        console.log(`Error al obtener la conexión: ${err.message}`);
    }
    else {
        console.log(`Conectado a la BD de ${pool.config.connectionConfig.database}`);
        connection.release();
        crearTablas();
    }
});

const crearTablas = async () => {
    const tablas = [
        `CREATE TABLE IF NOT EXISTS Concesionarios (
                id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                ciudad VARCHAR(100) NOT NULL,
                direccion VARCHAR(200),
                telefono_contacto VARCHAR(20)
            )`,
        `CREATE TABLE IF NOT EXISTS Usuarios (
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
                    REFERENCES concesionarios (id_concesionario)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
            )`,
        `CREATE TABLE IF NOT EXISTS Vehiculos (
                id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
                matricula VARCHAR(20) NOT NULL UNIQUE,
                marca VARCHAR(50) NOT NULL,
                modelo VARCHAR(50) NOT NULL,
                año_matriculacion YEAR,
                numero_plazas INT,
                autonomia_km DECIMAL(6,1),
                color VARCHAR(30),
                imagen VARCHAR(255),
                estado ENUM('disponible', 'reservado', 'mantenimiento') DEFAULT 'disponible',
                id_concesionario INT NOT NULL,
                CONSTRAINT fk_vehiculo_concesionario
                    FOREIGN KEY (id_concesionario)
                    REFERENCES concesionarios (id_concesionario)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            )`,
        ` CREATE TABLE IF NOT EXISTS Reservas (
                id_reserva INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                id_vehiculo INT NOT NULL,
                fecha_inicio DATETIME NOT NULL,
                fecha_fin DATETIME NOT NULL,
                estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
                kilometros_recorridos DECIMAL(8,2),
                incidencias_reportadas TEXT,
                CONSTRAINT fk_reserva_usuario
                    FOREIGN KEY (id_usuario)
                    REFERENCES usuarios (id_usuario)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                CONSTRAINT fk_reserva_vehiculo
                    FOREIGN KEY (id_vehiculo)
                    REFERENCES vehiculos (id_vehiculo)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            )`
    ];
    tablas.forEach((tabla) => {
        pool.query(tabla, (err) => {
            if (err) {
                console.log('Error creando una tabla');
            }
        });
        console.log('Tablas creadas correctamente');

    });
}

module.exports = pool;