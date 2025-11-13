const express = require('express');
const router = express.Router();

router.get('/es-admin', (req, res) => {
    res.render('es-admin');
});

router.get('/en-admin', (req, res) => {
    res.render('en-admin');
});

module.exports = router;