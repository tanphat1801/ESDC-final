const express = require('express');
const router = express.Router();

const { authController } = require('../controllers');

router.get('/', (req, res) => {
    res.redirect('auth/login');
});
router.get('/login', authController.loginView);
router.post('/login', authController.login);
router.get('/register', authController.registerView);
router.post('/register', authController.register);
router.get('/logout', authController.logout);

module.exports = router;