import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv/config';
import connectDB from './connection/db.js';
import adminRoutes from './routes/admin.routes.js';
import gymRoutes from './routes/gym.routes.js';
import colaboratorRoutes from './routes/colaborator.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import clientRoutes from './routes/client.routes.js';

import privateRoutes from './routes/private.routes.js';

connectDB();
const app = express();

app.use(cors({ origin: 'http://localhost:5173' })); // <--- HABILITAR CORS
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));

app.use('/api/admins', adminRoutes);
app.use('/api/colaborators', colaboratorRoutes);
app.use('/api/private', privateRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/clients', clientRoutes);


export default app;
