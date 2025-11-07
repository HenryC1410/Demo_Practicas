import { getAllUsers } from '../services/usersService.js';
import { handleError, handleSuccess } from '../utils/responseHandler.js';

export const listarUsuarios = async (_req, res) => {
  try {
    const usuarios = await getAllUsers();
    handleSuccess(res, usuarios);
  } catch (err) {
    handleError(res, err.message);
  }
};
