import { Router } from 'express';
import ProductDAO from '../dao/Product.dao.js';
import UsersDAO from '../dao/Users.dao.js';
import { generateMockUser, generateMockProduct } from '../mocking/mock.gen.js';
import { isAdmin } from '../middlewares/auth.js';

const mockRouter = Router();
const productDAO = new ProductDAO();
const usersDAO = new UsersDAO();

// GET /api/mocks/users: Generates and returns 50 mock users (does not save to DB)
mockRouter.get('/users', async (req, res) => {
    try {
        const users = await Promise.all(Array.from({ length: 50 }, generateMockUser));
        res.status(200).json({ status: 'success', payload: users });
    } catch (error) {
        console.error('Error generating mock users:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate mock users.' });
    }
});

mockRouter.get('/products', (req, res) => {
    try {
        const products = Array.from({ length: 20 }, generateMockProduct);
        res.status(200).json({ status: 'success', payload: products });
    } catch (error) {
        console.error('Error generating mock products:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate mock products.' });
    }
});

// POST /api/mocks/generate-data: Generates and inserts specified number of mock users and products into DB
// Example: POST /api/mocks/generate-data?users=10&products=50
mockRouter.post('/generate-data', isAdmin, async (req, res) => {
    try {
        const numUsers = parseInt(req.query.users) || 0;
        const numProducts = parseInt(req.query.products) || 0;

        if (numUsers < 0 || numProducts < 0) {
            return res.status(400).json({ status: 'error', message: 'Number of users and products must be non-negative.' });
        }

        const usersToInsert = [];
        if (numUsers > 0) {
            for (let i = 0; i < numUsers; i++) {
                usersToInsert.push(generateMockUser());
            }
        }

        const productsToInsert = [];
        if (numProducts > 0) {
            for (let i = 0; i < numProducts; i++) {
                productsToInsert.push(generateMockProduct());
            }
        }

        let insertedUsersCount = 0;
        let insertedProductsCount = 0;

        if (usersToInsert.length > 0) {
            const userSavePromises = usersToInsert.map(user => usersDAO.save(user));
            const savedUsers = await Promise.all(userSavePromises);
            insertedUsersCount = savedUsers.length;
        }

        if (productsToInsert.length > 0) {
            const productSavePromises = productsToInsert.map(product => productDAO.save(product));
            const savedProducts = await Promise.all(productSavePromises);
            insertedProductsCount = savedProducts.length;
        }

        res.status(201).json({
            status: 'success',
            message: 'Mock data generated and inserted successfully!',
            usersInserted: insertedUsersCount,
            productsInserted: insertedProductsCount
        });

    } catch (error) {
        console.error('Error creating mock data:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate and insert mock data.' });
    }
});

export default mockRouter;