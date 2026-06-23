const router = require('express').Router();
const { login, me, esquecerSenha, resetarSenha } = require('../controllers/auth.controller');
const { verificarJWT }    = require('../middleware/auth');
const { verificarTenant } = require('../middleware/tenant');

router.post('/login',          login);
router.get('/me',              verificarJWT, verificarTenant, me);
router.post('/esqueci-senha',  esquecerSenha);
router.post('/resetar-senha',  resetarSenha);

module.exports = router;
