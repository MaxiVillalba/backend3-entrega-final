import { Router } from 'express';
import CartDAO from '../dao/Cart.dao.js';
import ProductDAO from '../dao/Product.dao.js';
import cartController from '../controllers/cart.controller.js';
import { isAuthenticated } from '../middlewares/auth.js'; 

const cartRouter = Router();
const cartDAO = new CartDAO();        
const productDAO = new ProductDAO();    

// GET the authenticated user's cart
cartRouter.get('/my-cart', isAuthenticated, cartController.getUserCart, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
        }
        const cart = await cartDAO.getBy({ user: req.user._id }, { populate: { path: 'products.product', select: 'name price stock thumbnail' } });

        if (!cart) {
            const newCart = await cartDAO.save({ user: req.user._id, products: [] });
            return res.json({ status: 'success', message: 'New cart created for user.', payload: newCart });
        }
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST: Add a product to the authenticated user's cart
cartRouter.post('/products/:pid',  cartController.addProductToCart, isAuthenticated, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
        }
        const { pid } = req.params;
        const { quantity = 1 } = req.body;

        if (quantity <= 0) {
            return res.status(400).json({ status: 'error', message: 'Quantity must be a positive number.' });
        }

        const product = await productDAO.getBy({ _id: pid });
        if (!product || !product.isActive) {
            return res.status(404).json({ status: 'error', message: 'Product not found or is inactive.' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ status: 'error', message: `Not enough stock for ${product.name}. Available: ${product.stock}` });
        }

        let cart = await cartDAO.getBy({ user: req.user._id });

        if (!cart) {
            cart = await cartDAO.save({ user: req.user._id, products: [] });
        }

        const productInCartIndex = cart.products.findIndex(item => item.product.toString() === pid);

        if (productInCartIndex > -1) {
            const newQuantity = cart.products[productInCartIndex].quantity + quantity;
            if (product.stock < newQuantity) {
                return res.status(400).json({ status: 'error', message: `Adding ${quantity} units would exceed stock for ${product.name}. Available: ${product.stock - cart.products[productInCartIndex].quantity}` });
            }
            cart.products[productInCartIndex].quantity = newQuantity;
        } else {
            cart.products.push({ product: pid, quantity });
        }

        const updatedCart = await cartDAO.update(cart._id, { products: cart.products });

        res.json({ status: 'success', message: 'Product added to cart.', payload: updatedCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT: Update quantity of a product in the authenticated user's cart
cartRouter.put('/products/:pid', isAuthenticated, cartController.updateProductQuantityInCart, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
        }
        const { pid } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ status: 'error', message: 'Quantity must be a non-negative number.' });
        }

        let cart = await cartDAO.getBy({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Cart not found for user.' });
        }

        const productInCartIndex = cart.products.findIndex(item => item.product.toString() === pid);

        if (productInCartIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Product not found in cart.' });
        }

        if (quantity > cart.products[productInCartIndex].quantity) {
            const product = await productDAO.getBy({ _id: pid });
            if (!product || !product.isActive || product.stock < quantity) {
                return res.status(400).json({ status: 'error', message: `Insufficient stock for ${product ? product.name : 'product'}. Available: ${product ? product.stock : 'N/A'}` });
            }
        }

        if (quantity === 0) {
            cart.products.splice(productInCartIndex, 1);
        } else {
            cart.products[productInCartIndex].quantity = quantity;
        }

        const updatedCart = await cartDAO.update(cart._id, { products: cart.products });

        res.json({ status: 'success', message: 'Cart updated successfully.', payload: updatedCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE: Remove a product from the authenticated user's cart
cartRouter.delete('/products/:pid', cartController.removeProductFromCart, isAuthenticated, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
        }
        const { pid } = req.params;

        let cart = await cartDAO.getBy({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Cart not found for user.' });
        }

        const initialLength = cart.products.length;
        cart.products = cart.products.filter(item => item.product.toString() !== pid);

        if (cart.products.length === initialLength) {
            return res.status(404).json({ status: 'error', message: 'Product not found in cart.' });
        }

        const updatedCart = await cartDAO.update(cart._id, { products: cart.products });

        res.json({ status: 'success', message: 'Product removed from cart.', payload: updatedCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE: Empty the authenticated user's cart
cartRouter.delete('/empty', cartController.emptyCart, isAuthenticated, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
        }

        let cart = await cartDAO.getBy({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Cart not found for user.' });
        }

        cart.products = [];
        const updatedCart = await cartDAO.update(cart._id, { products: cart.products });

        res.json({ status: 'success', message: 'Cart emptied successfully.', payload: updatedCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default cartRouter;