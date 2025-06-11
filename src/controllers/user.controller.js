// src/controllers/user.controller.js
import UsersDAO from '../daos/Users.dao.js'; // Importamos el DAO de usuarios
import { logger } from '../utils/logger.js';

const usersDAO = new UsersDAO(); // Instanciamos el DAO

class UserController {
    /**
     * Obtiene el perfil del usuario autenticado.
     * GET /api/users/profile
     */
    async getProfile(req, res) {
        try {
            if (!req.user || !req.user._id) {
                logger.warning('Intento de acceso a perfil sin autenticación.');
                return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
            }
            const user = await usersDAO.getBy({ _id: req.user._id });
            if (!user) {
                logger.error(`Perfil de usuario no encontrado para ID autenticado: ${req.user._id}`);
                return res.status(404).json({ status: 'error', message: 'User profile not found.' });
            }
            // Eliminar información sensible antes de enviar (ej. contraseña)
            const { password, __v, ...userProfile } = user;
            res.json({ status: 'success', payload: userProfile });
        } catch (error) {
            logger.error(`Error en UserController.getProfile: ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener perfil: ${error.message}` });
        }
    }

    /**
     * Actualiza el perfil del usuario autenticado.
     * PUT /api/users/profile
     */
    async updateProfile(req, res) {
        try {
            if (!req.user || !req.user._id) {
                logger.warning('Intento de actualización de perfil sin autenticación.');
                return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
            }
            const updatedData = req.body;
            // No permitir que un usuario cambie su rol o estado de activo a través de esta ruta
            delete updatedData.role;
            delete updatedData.isActive;

            const updatedUser = await usersDAO.update(req.user._id, updatedData);
            if (!updatedUser) {
                logger.error(`No se pudo actualizar el perfil del usuario autenticado: ${req.user._id}. No encontrado.`);
                return res.status(404).json({ status: 'error', message: 'User profile not found.' });
            }
            const { password, __v, ...userProfile } = updatedUser;
            logger.info(`Perfil de usuario actualizado: ${updatedUser._id}`);
            res.json({ status: 'success', message: 'Profile updated successfully.', payload: userProfile });
        } catch (error) {
            logger.error(`Error en UserController.updateProfile (${req.user?._id}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al actualizar perfil: ${error.message}` });
        }
    }

    /**
     * Obtiene todos los usuarios (solo Admin).
     * GET /api/users
     */
    async getAllUsers(req, res) {
        try {
            const { page, limit, role, sort, email } = req.query;
            const query = {};
            if (role) query.role = role;
            if (email) query.email = { $regex: email, $options: 'i' };

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                select: '-password -__v', // No enviar contraseñas ni versiones
            };
            if (sort) options.sort = sort;

            const result = await usersDAO.get(query, options);

            res.json({
                status: 'success',
                payload: result.users,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
            });
        } catch (error) {
            logger.error(`Error en UserController.getAllUsers: ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener usuarios: ${error.message}` });
        }
    }

    /**
     * Obtiene un usuario por su ID (solo Admin).
     * GET /api/users/:uid
     */
    async getUserById(req, res) {
        try {
            const { uid } = req.params;
            const user = await usersDAO.getBy({ _id: uid });
            if (!user) {
                logger.warning(`Usuario no encontrado con ID: ${uid}`);
                return res.status(404).json({ status: 'error', message: 'User not found.' });
            }
            const { password, __v, ...userProfile } = user;
            res.json({ status: 'success', payload: userProfile });
        } catch (error) {
            logger.error(`Error en UserController.getUserById (${req.params.uid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener usuario: ${error.message}` });
        }
    }

    /**
     * Actualiza un usuario por su ID (solo Admin).
     * PUT /api/users/:uid
     */
    async updateUser(req, res) {
        try {
            const { uid } = req.params;
            const updatedData = req.body;
            const updatedUser = await usersDAO.update(uid, updatedData);
            if (!updatedUser) {
                logger.warning(`Intento de actualización de usuario fallido: ID no encontrado ${uid}`);
                return res.status(404).json({ status: 'error', message: 'User not found.' });
            }
            const { password, __v, ...userProfile } = updatedUser;
            logger.info(`Usuario actualizado exitosamente: ${updatedUser._id}`);
            res.json({ status: 'success', message: 'User updated successfully.', payload: userProfile });
        } catch (error) {
            logger.error(`Error en UserController.updateUser (${req.params.uid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al actualizar usuario: ${error.message}` });
        }
    }

    /**
     * Elimina lógicamente un usuario por su ID (soft delete, solo Admin).
     * DELETE /api/users/:uid
     */
    async deleteUser(req, res) {
        try {
            const { uid } = req.params;
            const deletedUser = await usersDAO.delete(uid); // Soft delete en el DAO
            if (!deletedUser) {
                logger.warning(`Intento de eliminación de usuario fallido: ID no encontrado o ya inactivo ${uid}`);
                return res.status(404).json({ status: 'error', message: 'User not found or already inactive.' });
            }
            logger.info(`Usuario eliminado (soft delete) exitosamente: ${deletedUser._id}`);
            res.json({ status: 'success', message: 'User soft-deleted successfully.', payload: deletedUser });
        } catch (error) {
            logger.error(`Error en UserController.deleteUser (${req.params.uid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al eliminar usuario: ${error.message}` });
        }
    }
}

export default new UserController(); // Exportamos una instancia del controlador