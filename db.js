
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

const crearTablas = () => {
    const tablas = [
        {
            nombre: 'Concesionarios',
            consulta: `CREATE TABLE IF NOT EXISTS Concesionarios (
                id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                ciudad VARCHAR(100) NOT NULL,
                direccion VARCHAR(200),
                telefono_contacto VARCHAR(20)
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
            nombre: 'Cliente',
            consulta: `CREATE TABLE IF NOT EXISTS Cliente (
                id_cliente INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                correo VARCHAR(150) NOT NULL UNIQUE,
                telefono VARCHAR(20),
                preferencias_accesibilidad JSON,
                direccion VARCHAR(200),
                codigo_postal VARCHAR(5)
            )`
        },
        {
            nombre: 'Reservas',
            consulta: ` CREATE TABLE IF NOT EXISTS Reservas (
                id_reserva INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT,
                id_cliente INT NOT NULL,
                id_vehiculo INT NOT NULL,
                fecha_inicio DATETIME NOT NULL,
                fecha_fin DATETIME NOT NULL,
                estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
                kilometros_recorridos DECIMAL(8,2),
                incidencias_reportadas TEXT,
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
        },

    ];

    let i = 0;
    const crearSiguienteTabla = () => {
        if (i >= tablas.length) {
            console.log('Todas las tablas se han creado correctamente');
            const { cargarDatosIniciales } = require('./loadDB');
            cargarDatosIniciales();
            return;
        }
        pool.query(tablas[i].consulta, (err) => {
            if (err) {
                console.log(`Error creando la tabla de ${tablas[i].nombre}: ${err.message}`);
            }
            else {
                console.log(`Tabla de ${tablas[i].nombre} creadas correctamente`);
            }
            i++;
            crearSiguienteTabla();
        });
    };
    crearSiguienteTabla();

}

module.exports = pool;