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
import productRoutes from './routes/product.routes.js';
import supplierRoutes from './routes/supplier.routes.js';

import privateRoutes from './routes/private.routes.js';

connectDB();
const app = express();

app.use(cors())
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));

app.use('/api/admins', adminRoutes);
app.use('/api/colaborators', colaboratorRoutes);
app.use('/api/private', privateRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);


export default app;
