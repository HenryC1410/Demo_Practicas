import { Router } from 'express';
import { listarUsuarios } from '../controllers/usersController.js';
import { authJwt } from '../middlewares/authJwt.js';

const router = Router();

// Protegido (opcional): solo coordinador en el futuro
router.get('/', authJwt, listarUsuarios);

export default router;
