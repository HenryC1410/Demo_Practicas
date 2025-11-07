// src/controllers/authController.js
import { handleError, handleSuccess } from '../utils/responseHandler.js';
import { loginUser, registerUser } from '../services/authService.js';
import { getProfileById } from '../services/usersService.js';

// 🟢 Registrar nuevo usuario
export const register = async (req, res) => {
  try {
    const data = await registerUser(req.body);
    handleSuccess(res, data, 201);
  } catch (err) {
    const msg = err.message?.includes('duplicate') ? 'Correo ya registrado' : err.message;
    handleError(res, msg, 400);
  }
};

// 🟢 Iniciar sesión
export const login = async (req, res) => {
  try {
    const data = await loginUser(req.body);
    handleSuccess(res, data);
  } catch (err) {
    handleError(res, err.message, 401);
  }
};

// 🟢 Obtener perfil del usuario actual
export const me = async (req, res) => {
  try {
    const data = await getProfileById(req.user.id);
    handleSuccess(res, data);
  } catch (err) {
    handleError(res, err.message);
  }
};
