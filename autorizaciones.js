//Función que revisa si el usuario tiene autorización de administrador
function requiredAdminId(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        console.log('Si estás autorizado');
        next();
    }
    else {
        //Si no está autorizado, lanza error 401
        console.log('No estás autorizado');
        const error = 'Error 401';
        const texto1 = 'Acceso no autorizado.';
        const texto2 = 'Se ha intentado acceder a una página a la que no se tiene autorización.'
        return res.status(401).render("errors", { error, texto1, texto2 });
    }
}

//Función que revisa si el usuario tiene autorización de administrador o empleado
function requiredEmployeeId(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'empleado') {
        console.log('Si estás autorizado');
        next();
    }
    else {
        //Si no está autorizado, lanza error 401
        console.log('No estás autorizado');
        const error = 'Error 401';
        const texto1 = 'Acceso no autorizado.';
        const texto2 = 'Se ha intentado acceder a una página a la que no se tiene autorización.'
        return res.status(401).render("errors", { error, texto1, texto2 });
    }
}

module.exports = {
    requiredAdminId,
    requiredEmployeeId
};