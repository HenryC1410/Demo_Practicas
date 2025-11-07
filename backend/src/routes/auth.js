import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { requireFields } from '../middlewares/validate.js';
import { authJwt } from '../middlewares/authJwt.js';

const router = Router();

router.post('/register', requireFields([
  'universidad', 'nombre', 'cedula', 'correo', 'telefono',
  'direccion', 'provincia', 'ciudad', 'facultad', 'carrera',
  'nacimiento', 'genero', 'password'
]), register);

router.post('/login', requireFields(['correo', 'password']), login);

router.get('/me', authJwt, me);

export default router;
