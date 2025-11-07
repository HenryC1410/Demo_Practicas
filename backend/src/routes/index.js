import { Router } from 'express';
import usersRouter from './users.js';
import authRouter from './auth.js';

const api = Router();

api.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

api.use('/auth', authRouter);
api.use('/users', usersRouter);

export default api;
