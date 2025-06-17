import express from "express";
import 'dotenv/config';
import cors from 'cors';

import { userAdminRoutes } from './src/routes/web/routeAdmin/userAdmin.routes.js'; 

const app = express();
const port = process.env.APP_PORT || 5001;

const adminRoutesInstance = new userAdminRoutes();
adminRoutesInstance.iniUserRouter(app);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
