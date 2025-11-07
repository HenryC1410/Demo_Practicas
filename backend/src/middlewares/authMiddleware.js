// Ejemplo de middleware simple de autenticación
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || token !== 'mi_token_seguro') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};
