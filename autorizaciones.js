function requiredAdminId(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        console.log('Si estás autorizado');
        next();
    }
    else {
        console.log('No estás autorizado');
        return res.redirect('/es-inicio');
    }
}

function requiredEmployeeId(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'empleado') {
        console.log('Si estás autorizado');
        next();
    }
    else {
        console.log('No estás autorizado');
        return res.redirect('/es-inicio');
    }

}

module.exports = {
    requiredAdminId,
    requiredEmployeeId
};