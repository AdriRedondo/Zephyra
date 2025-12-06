const pool = require('../db');

//Middleware para validar datos del usuario
const validateUser = (req, res, next) => {
    const { nombre, correo, password } = req.body;
    const language = req.body.idioma;
    const isEditing = req.params.id !== undefined;

    // Validar campos obligatorios
    if (!nombre || !correo || nombre.trim() === '' || correo.trim() === '') {
        const error = language === 'english' ? 'Name and email are required' : 'El nombre y correo son obligatorios';
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
        const error = language === 'english'
            ? 'Invalid email format'
            : 'Formato de correo inválido';
        return res.status(400).json({ error });
    }

    // Validar longitud de contraseña (solo si se proporciona)
    if (password && password.trim().length < 8) {
        const error = language === 'english'
            ? 'Password must be at least 8 characters long'
            : 'La contraseña debe tener al menos 8 caracteres';
        return res.status(400).json({ error });
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