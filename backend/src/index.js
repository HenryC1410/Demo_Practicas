import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import api from './routes/index.js';
import { supabase } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// raíz + prueba DB
app.get('/', (_req, res) => res.send('Servidor funcionando correctamente 🚀'));
app.get('/test-db', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('usuarios').select('id').limit(1);
    if (error) throw error;
    res.json({ success: true, message: 'Conexión a Supabase exitosa', data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// API
app.use('/api/v1', api);

// 404
app.use((_req, res) => res.status(404).json({ success: false, error: 'Ruta no encontrada' }));

app.listen(PORT, () => console.log(`✅ Servidor activo en puerto ${PORT}`));
