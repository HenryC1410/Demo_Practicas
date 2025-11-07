import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUserRaw, getUserByCorreo } from './usersService.js';

export const registerUser = async (body) => {
  const correo = (body.correo || '').toLowerCase();

  const exists = await getUserByCorreo(correo);
  if (exists) throw new Error('El correo ya está registrado');

  const password_hash = await bcrypt.hash(body.password, 10);

  const payload = {
    universidad: body.universidad ?? null,
    nombre: body.nombre ?? null,        // nombre completo
    cedula: body.cedula ?? null,
    correo,
    telefono: body.telefono ?? null,
    direccion: body.direccion ?? null,
    provincia: body.provincia ?? null,
    ciudad: body.ciudad ?? null,
    facultad: body.facultad ?? null,
    carrera: body.carrera ?? null,
    nacimiento: body.nacimiento ?? null,
    genero: body.genero ?? null,
    password_hash
  };

  const newUser = await createUserRaw(payload);

  // token directo tras registro
  const token = jwt.sign({ id: newUser.id, correo }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '2d'
  });

  return { id: newUser.id, correo, token };
};

export const loginUser = async ({ correo, password }) => {
  const user = await getUserByCorreo((correo || '').toLowerCase());
  if (!user) throw new Error('Credenciales inválidas');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('Credenciales inválidas');

  const token = jwt.sign({ id: user.id, correo: user.correo }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '2d'
  });

  return { id: user.id, correo: user.correo, token };
};
