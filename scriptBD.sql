-- Tabla CONCESIONARIOS
CREATE TABLE concesionarios (
  id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  direccion VARCHAR(200),
  telefono_contacto VARCHAR(20)
);

-- Tabla USUARIOS
CREATE TABLE usuarios (
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
);

-- Tabla VEHÍCULOS
CREATE TABLE vehiculos (
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
);

-- Tabla RESERVAS
CREATE TABLE reservas (
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
);

-- Casos de prueba
INSERT INTO concesionarios (nombre, ciudad, direccion, telefono_contacto) VALUES
('Concesionario Centro', 'Madrid', 'Calle Mayor 12', '911223344'),
('Concesionario Norte', 'Bilbao', 'Avenida Euskadi 45', '944112233');

INSERT INTO usuarios (nombre, correo, contraseña, rol, id_concesionario) VALUES
('Ana López', 'ana@empresa.com', '1234', 'admin', 1),
('Carlos Ruiz', 'carlos@empresa.com', '1234', 'empleado', 2);

INSERT INTO vehiculos (matricula, marca, modelo, año_matriculacion, numero_plazas, autonomia_km, color, id_concesionario) VALUES
('1234ABC', 'Tesla', 'Model 3', 2022, 5, 450.5, 'Blanco', 1),
('5678DEF', 'Nissan', 'Leaf', 2021, 5, 300.0, 'Negro', 2);

INSERT INTO reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado) VALUES
(1, 1, '2025-11-10 10:00:00', '2025-11-12 18:00:00', 'activa');
