// Maneja respuestas exitosas
export const handleSuccess = (res, data, status = 200) => {
  res.status(status).json({
    ok: true,
    data,
  });
};

// Maneja errores del servidor o de validación
export const handleError = (res, message, status = 500) => {
  res.status(status).json({
    ok: false,
    error: message,
  });
};
