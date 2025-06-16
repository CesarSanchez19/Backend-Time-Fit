import express from "express"; // Importa el módulo 'express' para crear el servidor y manejar rutas


// Clase que define las rutas para la gestión de usuarios
export class UserAdminRoutes {
  // Método para inicializar las rutas de usuario
  iniUserRouter(app = express.application) {
    // Ruta GET que responde con un saludo
    app.get("/hello", (req, res) => {
      res.send("Hello Admin!"); // Envía el mensaje "Hello World!" como respuesta
    });

  }
}