//Función que revisa si el usuario tiene autorización de administrador
function requiredAdminId(req, res, next) {
    if (req.session?.usuario && req.session.usuario.rol === 'admin') {
        next();
    }
    else {
        //Si no está autorizado, lanza error 401
        const error = 'Error 401';
        const texto1 = 'Acceso no autorizado.';
        const texto2 = 'Se ha intentado acceder a una página a la que no se tiene autorización.'
        return res.status(401).render("errors", { error, texto1, texto2 });
    }
}

//Función que revisa si el usuario tiene autorización de administrador o empleado
function requiredEmployeeId(req, res, next) {
    if (req.session?.usuario && req.session.usuario.rol === 'empleado') {
        next();
    }
    else {
        //Si no está autorizado, lanza error 401
        const error = 'Error 401';
        const texto1 = 'Acceso no autorizado.';
        const texto2 = 'Se ha intentado acceder a una página a la que no se tiene autorización.'
        return res.status(401).render("errors", { error, texto1, texto2 });
    }
}

//Función que revisa si el usuario está loggeado (empleado o admin)
function requiredLoggedIn(req, res, next) {
    if (req.session?.usuario) {
        next();
    }
    else {
        //Si no está loggeado, redirigir a login
        const lang = res.locals.lang || 'es';
        return res.redirect(`/${lang}-login`);
    }
}

module.exports = {
    requiredAdminId,
    requiredEmployeeId,
    requiredLoggedIn
};