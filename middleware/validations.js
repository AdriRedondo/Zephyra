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

    // Validar formato de email corporativo @zephyra.com
    const emailRegex = /^[^\s@]+@zephyra\.com$/;
    if (!emailRegex.test(correo.trim())) {
        const error = language === 'english'
            ? 'Email must be from corporate domain @zephyra.com'
            : 'El correo debe ser del dominio corporativo @zephyra.com';
        return res.status(400).json({ error });
    }

    // Validar contraseña segura (solo si se proporciona): mínimo 8 caracteres, 1 mayúscula, 1 número
    if (password) {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password.trim())) {
            const error = language === 'english'
                ? 'Password must have at least 8 characters, 1 uppercase letter and 1 number'
                : 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número';
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