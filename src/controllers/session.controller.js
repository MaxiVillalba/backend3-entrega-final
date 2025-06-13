// src/controllers/session.controller.js
import UsersDAO from '../dao/Users.dao.js'; // Necesitarás el DAO de usuarios para registro y validación
import { logger } from '../utils/logger.js';
// Importa las librerías de hashing de contraseñas y JWT si las usas
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import config from '../config/config.js'; // Para tus secretos JWT y otros configs

const usersDAO = new UsersDAO(); // Instanciamos el DAO de Usuarios

class SessionController {

    /**
     * Registra un nuevo usuario.
     * POST /api/sessions/register
     */
    async register(req, res) {
        try {
            const { firstName, lastName, email, age, password, role = 'user' } = req.body;

            if (!firstName || !lastName || !email || !age || !password) {
                logger.warning('Intento de registro fallido: Faltan campos obligatorios.');
                return res.status(400).json({ status: 'error', message: 'All fields are required.' });
            }

            const existingUser = await usersDAO.getBy({ email });
            if (existingUser) {
                logger.warning(`Intento de registro fallido: Email ya registrado (${email}).`);
                return res.status(400).json({ status: 'error', message: 'Email already registered.' });
            }

            // Aquí iría la lógica de hashing de contraseña (ej. bcrypt.hash(password, 10))
            // const hashedPassword = await bcrypt.hash(password, 10);
            const hashedPassword = password; // Esto es solo un placeholder, ¡NUNCA en producción!

            const newUser = await usersDAO.save({
                firstName,
                lastName,
                email,
                age,
                password: hashedPassword,
                role
            });

            // Podrías iniciar sesión automáticamente al registrar
            // req.login(newUser, (err) => {
            //     if (err) return next(err);
            //     return res.status(201).json({ status: 'success', message: 'User registered and logged in successfully.', payload: { userId: newUser._id, email: newUser.email } });
            // });

            logger.info(`Usuario registrado exitosamente: ${newUser.email}`);
            // Excluir la contraseña en la respuesta
            const { password: _, ...userWithoutPassword } = newUser.toObject(); // .toObject() si es un documento Mongoose
            res.status(201).json({ status: 'success', message: 'User registered successfully.', payload: userWithoutPassword });

        } catch (error) {
            logger.error(`Error en SessionController.register: ${error.message}`);
            res.status(500).json({ status: 'error', message: `Registration failed: ${error.message}` });
        }
    }

    /**
     * Inicia sesión de un usuario.
     * POST /api/sessions/login
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                logger.warning('Intento de login fallido: Faltan credenciales.');
                return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
            }

            const user = await usersDAO.getBy({ email });
            if (!user) {
                logger.warning(`Intento de login fallido: Usuario no encontrado (${email}).`);
                return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
            }

            // Aquí iría la lógica de comparación de contraseña (ej. bcrypt.compare(password, user.password))
            // const isPasswordValid = await bcrypt.compare(password, user.password);
            const isPasswordValid = (password === user.password); // Placeholder

            if (!isPasswordValid) {
                logger.warning(`Intento de login fallido: Contraseña incorrecta para ${email}.`);
                return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
            }

            // Si usas Passport.js, la lógica de autenticación se manejaría así:
            // req.login(user, (err) => {
            //     if (err) return next(err);
            //     // Generar JWT o configurar sesión en req.session
            //     // const token = jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: '1h' });
            //     // res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
            //     logger.info(`Usuario logueado exitosamente: ${user.email}`);
            //     const { password: _, ...userWithoutPassword } = user.toObject();
            //     res.json({ status: 'success', message: 'Logged in successfully.', payload: userWithoutPassword });
            // });

            // Para un manejo manual sin Passport:
            // req.session.user = { id: user._id, email: user.email, role: user.role }; // Configurar la sesión
            logger.info(`Usuario logueado exitosamente: ${user.email}`);
            const { password: _, ...userWithoutPassword } = user.toObject();
            res.json({ status: 'success', message: 'Logged in successfully.', payload: userWithoutPassword });


        } catch (error) {
            logger.error(`Error en SessionController.login: ${error.message}`);
            res.status(500).json({ status: 'error', message: `Login failed: ${error.message}` });
        }
    }

    /**
     * Cierra la sesión de un usuario.
     * POST /api/sessions/logout
     */
    async logout(req, res, next) {
        // Asumiendo que usas sesiones de Express o JWTs
        // Si usas sesiones, esto borraría la sesión:
        // req.session.destroy((err) => {
        //     if (err) {
        //         logger.error(`Error al destruir la sesión: ${err.message}`);
        //         return next(err);
        //     }
        //     res.clearCookie('connect.sid'); // Nombre de la cookie de sesión por defecto de express-session
        //     logger.info('Sesión cerrada exitosamente.');
        //     res.json({ status: 'success', message: 'Logged out successfully.' });
        // });

        // Si usas JWT, simplemente borras la cookie del lado del cliente
        // res.clearCookie('jwt');
        logger.info('Sesión (simulada) cerrada exitosamente.');
        res.json({ status: 'success', message: 'Logged out successfully.' });
    }

    /**
     * Obtiene la sesión actual del usuario.
     * GET /api/sessions/current
     * Requiere middleware de autenticación previo (ej. isAuthenticated)
     */
    async current(req, res) {
        try {
            if (!req.user) { // Suponiendo que req.user es populado por tu middleware de autenticación/Passport
                logger.warning('Acceso a sesión actual sin usuario autenticado.');
                return res.status(401).json({ status: 'error', message: 'No active session.' });
            }
            // Eliminar información sensible antes de enviar (ej. contraseña)
            const { password, __v, ...userProfile } = req.user.toObject();
            res.json({ status: 'success', payload: userProfile });
        } catch (error) {
            logger.error(`Error en SessionController.current: ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener sesión actual: ${error.message}` });
        }
    }

    // Aquí podrías añadir métodos para:
    // async requestPasswordReset(req, res) { /* ... */ }
    // async resetPassword(req, res) { /* ... */ }
}

export default new SessionController();