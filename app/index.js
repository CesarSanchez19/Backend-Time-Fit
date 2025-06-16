import express from "express";
import 'dotenv/config';
import cors from 'cors';

import { UserAdminRoutes } from './routes/WebApp/userAdmin/userAdmin.routes.js'; 

const app = express();
const port = process.env.APP_PORT || 3001;

const userAdminRoutes = new UserAdminRoutes();
userAdminRoutes.iniUserRouter(app);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
