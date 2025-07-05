import express from 'express'
import morgan  from 'morgan';
import dotenv from 'dotenv/config'
import connectDB from './connection/db.js';

connectDB();
const app = express();

app.use(morgan('dev'));

export default app;

