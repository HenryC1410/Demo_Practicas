import { supabase } from '../config/supabase.js';

const PUBLIC_USER_FIELDS =
  'id,universidad,nombre,cedula,correo,telefono,direccion,provincia,ciudad,facultad,carrera,nacimiento,genero,created_at';

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select(PUBLIC_USER_FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const getUserByCorreo = async (correo) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id,correo,password_hash')
    .eq('correo', (correo || '').toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

export const createUserRaw = async (payload) => {
  const { data, error } = await supabase
    .from('usuarios')
    .insert([payload])
    .select('id,correo')
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getProfileById = async (id) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select(PUBLIC_USER_FIELDS)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};
