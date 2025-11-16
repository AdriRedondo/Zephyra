const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.get('/es-registro', async (req, res) => {
    try {
        const concesionarios = await obtenerConcesionarios();
        res.render('es-registro', {
            error: undefined,
            success: undefined,
            concesionarios: concesionarios
        });
    } catch (err) {
        console.error('Error al cargar concesionarios:', err);
        res.render('es-registro', {
            error: 'Error al cargar concesionarios',
            success: undefined,
            concesionarios: []
        });
    }
});

router.get('/en-sign-up', (req, res) => {
    res.render('en-sign-up');
});

router.get('/es-admin', async (req, res) => {
    try {
        const concesionarios = await obtenerConcesionarios();
        res.render('es-admin', {
            error: undefined,
            success: undefined,
            concesionarios: concesionarios
        });
    } catch (err) {
        console.error('Error al cargar concesionarios:', err);
        res.render('es-admin', {
            error: 'Error al cargar concesionarios',
            success: undefined,
            concesionarios: []
        });
    }
});

router.get('/en-admin', (req, res) => {
    res.render('en-admin');
});

router.post('/submit-register', (req, res) => {
    try {
        console.log(req.body);
        const language = req.body.idioma;
        const name = req.body.nombre;
        const email = req.body.correo;
        const password = req.body.password;
        const telephone = req.body.telefono;
        const role = req.body.rol;
        const idConcesionario = req.body.dConcesionario;

        const consulta1 = 'SELECT * FROM Usuarios WHERE correo = ?';
        pool.query(consulta1, [email], async (err, results) => {
            if (err) {
                console.error('Error al verificar el correo:', err);
                return res.status(500).render('error500', { err: 'Error en el registro' });
            }

            if (results.length > 0) {
                const concesionarios = await obtenerConcesionarios();
                if (language === 'english')
                    return res.render('en-admin', {
                        error: 'Email already registered',
                        success: undefined,
                        concesionarios
                    });
                else
                    return res.render('es-admin', {
                        error: 'El correo ya está registrado',
                        success: undefined,
                        concesionarios
                    });
            }

            const telephoneValue = telephone === '' ? null : telephone;
            const concesionarioValue = idConcesionario === '' ? null : idConcesionario;
            const rolevalue = role === null || role === ' empleado' ? 'empleado' : 'administrador';

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const consulta = `INSERT INTO Usuarios (nombre, correo, contraseña, rol, telefono, id_concesionario) 
                          VALUES (?, ?, ?, ?, ?, ?)`;

            pool.query(consulta, [name, email, hashedPassword, roleValue, telephoneValue, concesionarioValue], async (err, results) => {
                if (err) {
                    console.error('Error al insertar usuario:', err);
                    const concesionarios = await obtenerConcesionarios();
                    if (language === 'english')
                        return res.render('en-admin', {
                            error: 'Registration error',
                            success: undefined,
                            concesionarios
                        });
                    else
                        return res.render('es-admin', {
                            error: 'Error en el registro',
                            success: undefined,
                            concesionarios
                        });
                }
                const concesionarios = await obtenerConcesionarios();
                if (language === 'english')
                    res.render('en-admin', {
                        error: undefined,
                        success: `User ${name} registered successfully!`,
                        concesionarios
                    });
                else
                    res.render('es-admin', {
                        error: undefined,
                        success: `Usuario ${name} registrado correctamente`,
                        concesionarios
                    });
            });
        });
    }
    catch (err) {
        console.error('Error en el registro de un usuario: ', err);
        res.status(500).render('error500', { err: 'Error en el registro' });
    }

});

const obtenerConcesionarios = () => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id_concesionario, nombre, ciudad FROM Concesionarios', (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

module.exports = router;