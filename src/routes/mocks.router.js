import { Router } from 'express';

import { generateMockUser, generateMockProduct } from '../mocking/mock.gen.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';

const router = Router();

router.get('/mockingusers', async (req, res) => {
    const users = await Promise.all(Array.from({ length: 50}, generateMockUser));
    res.json(users);
});

router.get('/mockingproducts', (req, res) => {
    const products = Array.from({ length: 20 }, generateMockProduct);
    res.json(products);
});

router.post('/generateData', async (req, res) => {
    const numUsers = parseInt(req.query.users) || 0;
    const numProducts = parseInt(req.query.products) || 0;

    const users = await Promise.all(Array.from({ length: numProducts }, generateMockProduct));
    const products = Array.from({ length: numProducts }, generateMockProduct);

    const insertedUsers = await User.insertMany(users);
    const insertedProducts = await Product.insertMany(products);

    res.json({
        message: 'Mock data created',
        users: insertedUsers.length,
        products: insertedProducts.length

    });
});

export default router;