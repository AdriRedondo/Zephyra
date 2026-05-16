const pool = require('../db');

// Middleware para validar datos de usuario 
const validateUser = (req, res, next) => {
    const { nombre, correo, password } = req.body;
    const language = req.body.idioma;
    const isEditing = req.params.id !== undefined;

    // Validar campos obligatorios
    if (!nombre || !correo || nombre.trim() === '' || correo.trim() === '') {
        const error = language === 'english'
            ? 'Name and email are required'
            : 'El nombre y correo son obligatorios';
        return res.status(400).json({ error });
    }

    // Validar password solo si es registro o si se proporciona en edición
    if (!isEditing && !password) {
        const error = language === 'english'
            ? 'Password is required'
            : 'La contraseña es obligatoria';
        return res.status(400).json({ error });
    }

    // Validar formato de email
    const emailRegex = /^[A-Za-z0-9._%+-]+@zephyra.com$/;
    if (!emailRegex.test(correo.trim())) {
        const error = language === 'english'
            ? 'Invalid email format'
            : 'Formato de correo inválido';
        return res.status(400).json({ error });
    }

    // Validar contraseña (solo si se proporciona)
    if (password) {
        // Mínimo 8 caracteres
        if (password.trim().length < 8) {
            const error = language === 'english'
                ? 'Password must be at least 8 characters long'
                : 'La contraseña debe tener al menos 8 caracteres';
            return res.status(400).json({ error });
        }

        // Debe contener al menos una mayúscula
        if (!/[A-Z]/.test(password)) {
            const error = language === 'english'
                ? 'Password must contain at least one uppercase letter'
                : 'La contraseña debe contener al menos una mayúscula';
            return res.status(400).json({ error });
        }

        // Debe contener al menos una minúscula
        if (!/[a-z]/.test(password)) {
            const error = language === 'english'
                ? 'Password must contain at least one lowercase letter'
                : 'La contraseña debe contener al menos una minúscula';
            return res.status(400).json({ error });
        }

        // Debe contener al menos un número
        if (!/[0-9]/.test(password)) {
            const error = language === 'english'
                ? 'Password must contain at least one number'
                : 'La contraseña debe contener al menos un número';
            return res.status(400).json({ error });
        }
    }

    // Almacenar datos validados en req para uso posterior
    req.validatedData = {
        nombre: nombre.trim(),
        correo: correo.trim(),
        password: password ? password.trim() : null,
        telefono: req.body.telefono || null,
        rol: (req.body.rol === 'admin') ? 'admin' : 'empleado',
        id_concesionario: req.body.concesionario || null
    };

    next();
};

//Middleware para validar datos de concesionario
const validateDealer = (req, res, next) => {
    const { nombre, ciudad, direccion } = req.body;
    const language = req.body.idioma;

    // Validar campos obligatorios
    if (!nombre || !ciudad || !direccion ||
        nombre.trim() === '' || ciudad.trim() === '' || direccion.trim() === '') {
        const error = language === 'english'
            ? 'Name, city and address are required'
            : 'El nombre, ciudad y dirección son obligatorios';
        return res.status(400).json({ error });
    }

    // Almacenar datos validados
    req.validatedData = {
        nombre: nombre.trim(),
        ciudad: ciudad.trim(),
        direccion: direccion.trim(),
        telefono_contacto: req.body.telefono || null
    };

    next();
};

// Middleware para validar datos de vehículo
const validateVehicle = (req, res, next) => {
    const { matricula, marca, modelo, concesionario, anyo_matriculacion, numero_plazas, color, autonomia_km } = req.body;
    const id_concesionario = concesionario;
    const language = req.body.idioma;

    // Validar campos obligatorios
    if (!matricula || !marca || !modelo || !id_concesionario || !anyo_matriculacion ||
        !numero_plazas || !color || !autonomia_km ||
        matricula.trim() === '' || marca.trim() === '' || modelo.trim() === '' || color.trim() === '') {
        const error = language === 'english'
            ? 'All fields are required'
            : 'Todos los campos son obligatorios';
        return res.status(400).json({ error });
    }

    // Validar formato de matrícula (ejemplo: 1234ABC o 1234-ABC)
    const matriculaRegex = /^[0-9]{4}[A-Z]{3}$|^[0-9]{4}-[A-Z]{3}$/;
    if (!matriculaRegex.test(matricula.trim())) {
        const error = language === 'english'
            ? 'Invalid license plate format (use: 1234ABC)'
            : 'Formato de matrícula inválido (usa: 1234ABC)';
        return res.status(400).json({ error });
    }

    // Validar año de matriculación
    const currentYear = new Date().getFullYear();
    const anyo = parseInt(anyo_matriculacion);
    if (!anyo || anyo < 1900 || anyo > currentYear + 1) {
        const error = language === 'english'
            ? `Year must be between 1900 and ${currentYear + 1}`
            : `El año debe estar entre 1900 y ${currentYear + 1}`;
        return res.status(400).json({ error });
    }

    // Validar número de plazas
    const plazas = parseInt(numero_plazas);
    if (!plazas || plazas < 1 || plazas > 9) {
        const error = language === 'english'
            ? 'Number of seats must be between 1 and 9'
            : 'El número de plazas debe estar entre 1 y 9';
        return res.status(400).json({ error });
    }

    // Validar autonomía
    const autonomia = parseFloat(autonomia_km);
    if (!autonomia || autonomia < 0 || autonomia > 1000) {
        const error = language === 'english'
            ? 'Autonomy must be between 0 and 1000 km'
            : 'La autonomía debe estar entre 0 y 1000 km';
        return res.status(400).json({ error });
    }

    // Almacenar datos validados
    req.validatedData = {
        matricula: matricula.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anyo_matriculacion: anyo,
        numero_plazas: plazas,
        autonomia_km: autonomia,
        color: color.trim(),
        estado: req.body.estado || 'disponible',
        id_concesionario: parseInt(id_concesionario)
    };

    next();
};

// Middleware para verificar dependencias antes de eliminar un concesionario
const checkDealerDependencies = (req, res, next) => {
    const id = req.params.id;
    const language = req.body.idioma;

    const consulta = `
        SELECT 
            (SELECT COUNT(*) FROM Vehiculos WHERE id_concesionario = ?) as vehiculos,
            (SELECT COUNT(*) FROM Usuarios WHERE id_concesionario = ?) as usuarios
    `;

    pool.query(consulta, [id, id], (err, results) => {
        if (err) {
            console.error('Error al verificar dependencias:', err);
            return res.status(500).json({
                error: language === 'english'
                    ? 'Database error'
                    : 'Error de base de datos'
            });
        }

        const vehiculos = results[0].vehiculos;
        const usuarios = results[0].usuarios;

        if (vehiculos > 0 || usuarios > 0) {
            const mensaje = language === 'english'
                ? `Cannot delete dealer: ${vehiculos} vehicles and ${usuarios} users associated`
                : `No se puede eliminar: hay ${vehiculos} vehículos y ${usuarios} usuarios asociados`;
            return res.status(400).json({ message: mensaje });
        }

        next();
    });
};

// Middleware para validar datos de reserva
const validateReservation = (req, res, next) => {
    const { id_vehiculo, fecha_inicio, fecha_fin, nombre_cliente, correo_cliente, telefono_cliente } = req.body;
    const language = req.body.idioma;

    // Verificar que hay un usuario logueado (solo empleados pueden crear reservas)
    if (!req.session || !req.session.usuario) {
        const error = language === 'english'
            ? 'You must be logged in to create a reservation'
            : 'Debes estar logueado para crear una reserva';
        return res.status(401).json({ error });
    }

    // Validar campos obligatorios de reserva
    if (!id_vehiculo || !fecha_inicio || !fecha_fin) {
        const error = language === 'english'
            ? 'Vehicle, start date and end date are required'
            : 'El vehículo, fecha de inicio y fecha de fin son obligatorios';
        return res.status(400).json({ error });
    }

    // SIEMPRE validar datos del cliente (son obligatorios)
    if (!nombre_cliente || !correo_cliente) {
        const error = language === 'english'
            ? 'Client name and email are required'
            : 'El nombre y correo del cliente son obligatorios';
        return res.status(400).json({ error });
    }

    // Validar formato de correo del cliente
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo_cliente.trim())) {
        const error = language === 'english'
            ? 'Invalid email format'
            : 'Formato de correo inválido';
        return res.status(400).json({ error });
    }

    // Validar formato de teléfono si se proporciona
    if (telefono_cliente) {
        const telefonoRegex = /^[0-9]{9}$/;
        if (!telefonoRegex.test(telefono_cliente.trim())) {
            const error = language === 'english'
                ? 'Invalid phone format (use 9 digits)'
                : 'Formato de teléfono inválido (usa 9 dígitos)';
            return res.status(400).json({ error });
        }
    }

    // Validar fechas
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    const ahora = new Date();

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        const error = language === 'english'
            ? 'Invalid date format'
            : 'Formato de fecha inválido';
        return res.status(400).json({ error });
    }

    if (inicio < ahora) {
        const error = language === 'english'
            ? 'Start date cannot be in the past'
            : 'La fecha de inicio no puede ser en el pasado';
        return res.status(400).json({ error });
    }

    if (fin <= inicio) {
        const error = language === 'english'
            ? 'End date must be after start date'
            : 'La fecha de fin debe ser posterior a la fecha de inicio';
        return res.status(400).json({ error });
    }

    // Validar duración máxima (ejemplo: 30 días)
    const duracionDias = (fin - inicio) / (1000 * 60 * 60 * 24);
    if (duracionDias > 30) {
        const error = language === 'english'
            ? 'Reservation cannot exceed 30 days'
            : 'La reserva no puede exceder 30 días';
        return res.status(400).json({ error });
    }

    req.validatedData = {
        id_vehiculo: parseInt(id_vehiculo),
        fecha_inicio: inicio,
        fecha_fin: fin,
        kilometros_recorridos: req.body.kilometros_recorridos || null,
        incidencias_reportadas: req.body.incidencias_reportadas || null,
        estado: req.body.estado || 'activa',
        // SIEMPRE incluir datos del cliente
        datosCliente: {
            nombre: nombre_cliente.trim(),
            correo: correo_cliente.trim(),
            telefono: telefono_cliente ? telefono_cliente.trim() : null,
            direccion: req.body.direccion_cliente ? req.body.direccion_cliente.trim() : null,
            codigo_postal: req.body.codigo_postal ? req.body.codigo_postal.trim() : null
        }
    };

    next();
};

// Middleware para validar datos de login
const validateLogin = (req, res, next) => {
    const { correo, password } = req.body;
    const language = req.body.idioma;

    // Validar campos obligatorios
    if (!correo || !password || correo.trim() === '' || password.trim() === '') {
        const error = language === 'english'
            ? 'Email and password are required'
            : 'El correo y la contraseña son obligatorios';

        const vista = language === 'english' ? 'en-login' : 'es-login';
        return res.render(vista, { error });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
        const error = language === 'english'
            ? 'Invalid email format'
            : 'Formato de correo inválido';

        const vista = language === 'english' ? 'en-login' : 'es-login';
        return res.render(vista, { error });
    }

    // Almacenar datos validados
    req.validatedData = {
        correo: correo.trim(),
        password: password.trim(),
        recordar: req.body.recordar || false
    };

    next();
};

module.exports = {
    validateUser,
    validateDealer,
    validateVehicle,
    checkDealerDependencies,
    validateReservation,
    validateLogin
};