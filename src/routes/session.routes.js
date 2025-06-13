// src/routes/sessions.router.js
import { Router } from 'express';
import sessionController from '../controllers/session.controller.js'; // Importamos el controlador
// import { isAuthenticated } from '../middlewares/auth.js'; // Para la ruta '/current' si la tienes

const sessionsRouter = Router();

sessionsRouter.post('/register', sessionController.register);
sessionsRouter.post('/login', sessionController.login);
sessionsRouter.post('/logout', sessionController.logout);
sessionsRouter.get('/current', /* isAuthenticated, */ sessionController.current); // Protegida por autenticación

export default sessionsRouter;