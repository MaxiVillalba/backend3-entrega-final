import { Router } from 'express';
import UsersDAO from '../dao/Users.dao.js';
import userController from '../controllers/user.controller.js';
import { isAuthenticated, isAdmin } from '../middlewares/auth.js'; 

const usersRouter = Router();
const usersDAO = new UsersDAO(); 

// GET authenticated user's profile
usersRouter.get('/profile', isAuthenticated, userController.getProfile, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
        }
        const user = await usersDAO.getBy({ _id: req.user._id });
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User profile not found.' });
        }
        const { password, ...userProfile } = user;
        res.json({ status: 'success', payload: userProfile });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT (update) authenticated user's profile
usersRouter.put('/profile', isAuthenticated, userController.updateProfile, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
        }
        const updatedData = req.body;
        delete updatedData.role;
        delete updatedData.isActive;

        const updatedUser = await usersDAO.update(req.user._id, updatedData);
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'User profile not found.' });
        }
        const { password, ...userProfile } = updatedUser;
        res.json({ status: 'success', message: 'Profile updated successfully.', payload: userProfile });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET all users with pagination, filters, sorting (Admin only)
usersRouter.get('/', isAdmin, userController.getAllUsers, async (req, res) => {
    try {
        const { page, limit, role, sort, email } = req.query;
        const query = {};
        if (role) {
            query.role = role;
        }
        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            select: '-password -__v',
        };
        if (sort) {
            options.sort = sort;
        }

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
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET user by ID (Admin only)
usersRouter.get('/:uid', isAdmin, userController.getUserById, async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await usersDAO.getBy({ _id: uid });
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }
        const { password, ...userProfile } = user;
        res.json({ status: 'success', payload: userProfile });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT (update) user by ID (Admin only)
usersRouter.put('/:uid', isAdmin, userController.updateUser, async (req, res) => {
    try {
        const { uid } = req.params;
        const updatedData = req.body;
        const updatedUser = await usersDAO.update(uid, updatedData);
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }
        const { password, ...userProfile } = updatedUser;
        res.json({ status: 'success', message: 'User updated successfully.', payload: userProfile });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE (soft delete) user by ID (Admin only)
usersRouter.delete('/:uid', isAdmin, userController.deleteUser, async (req, res) => {
    try {
        const { uid } = req.params;
        const deletedUser = await usersDAO.delete(uid);
        if (!deletedUser) {
            return res.status(404).json({ status: 'error', message: 'User not found or already inactive.' });
        }
        res.json({ status: 'success', message: 'User soft-deleted successfully.', payload: deletedUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default usersRouter;