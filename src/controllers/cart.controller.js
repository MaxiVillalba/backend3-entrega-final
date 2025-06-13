// src/controllers/cart.controller.js
import CartDAO from '../dao/Cart.dao.js';
import ProductDAO from '../dao/Product.dao.js';
import { logger } from '../utils/logger.js';

const cartDAO = new CartDAO();
const productDAO = new ProductDAO();

class CartController {
    /**
     * Obtiene el carrito del usuario autenticado. Si no existe, crea uno.
     * GET /api/carts/my-cart
     */
    async getUserCart(req, res) {
        try {
            // Asumiendo que req.user está disponible por un middleware de autenticación
            if (!req.user || !req.user._id) {
                return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
            }

            // Popula los detalles completos del producto dentro del carrito
            const cart = await cartDAO.getBy({ user: req.user._id }, { populate: { path: 'products.product', select: 'name price stock thumbnail isActive' } });

            if (!cart) {
                // Si el usuario no tiene un carrito, lo creamos
                logger.info(`Creando un nuevo carrito para el usuario: ${req.user._id}`);
                const newCart = await cartDAO.save({ user: req.user._id, products: [] });
                return res.status(201).json({ status: 'success', message: 'New cart created for user.', payload: newCart });
            }

            res.json({ status: 'success', payload: cart });
        } catch (error) {
            logger.error(`Error en CartController.getUserCart (${req.user?._id}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener el carrito: ${error.message}` });
        }
    }

    /**
     * Agrega un producto al carrito del usuario.
     * POST /api/carts/products/:pid
     */
    async addProductToCart(req, res) {
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
                logger.warning(`Intento de añadir producto inactivo o no encontrado al carrito: ${pid}`);
                return res.status(404).json({ status: 'error', message: 'Product not found or is inactive.' });
            }
            if (product.stock < quantity) {
                logger.warning(`Intento de añadir producto sin stock suficiente (${pid}). Solicitado: ${quantity}, Disponible: ${product.stock}`);
                return res.status(400).json({ status: 'error', message: `Not enough stock for ${product.name}. Available: ${product.stock}` });
            }

            let cart = await cartDAO.getBy({ user: req.user._id });
            if (!cart) {
                logger.info(`Creando un nuevo carrito para el usuario ${req.user._id} al añadir producto.`);
                cart = await cartDAO.save({ user: req.user._id, products: [] });
            }

            const productInCartIndex = cart.products.findIndex(item => item.product.toString() === pid);

            if (productInCartIndex > -1) {
                const newQuantity = cart.products[productInCartIndex].quantity + quantity;
                if (product.stock < newQuantity) {
                    logger.warning(`Intento de añadir más de lo disponible para ${product.name}.`);
                    return res.status(400).json({ status: 'error', message: `Adding ${quantity} units would exceed stock for ${product.name}. Available: ${product.stock - cart.products[productInCartIndex].quantity}` });
                }
                cart.products[productInCartIndex].quantity = newQuantity;
            } else {
                cart.products.push({ product: pid, quantity });
            }

            const updatedCart = await cartDAO.update(cart._id, { products: cart.products });
            logger.info(`Producto ${pid} añadido/actualizado en el carrito de ${req.user._id}.`);
            res.json({ status: 'success', message: 'Product added to cart.', payload: updatedCart });
        } catch (error) {
            logger.error(`Error en CartController.addProductToCart (${req.user?._id}, ${req.params.pid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al añadir producto al carrito: ${error.message}` });
        }
    }

    /**
     * Actualiza la cantidad de un producto en el carrito del usuario.
     * PUT /api/carts/products/:pid
     */
    async updateProductQuantityInCart(req, res) {
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
                logger.warning(`Carrito no encontrado para usuario ${req.user._id} al intentar actualizar cantidad.`);
                return res.status(404).json({ status: 'error', message: 'Cart not found for user.' });
            }

            const productInCartIndex = cart.products.findIndex(item => item.product.toString() === pid);
            if (productInCartIndex === -1) {
                logger.warning(`Producto ${pid} no encontrado en el carrito de ${req.user._id} al intentar actualizar cantidad.`);
                return res.status(404).json({ status: 'error', message: 'Product not found in cart.' });
            }

            // Si la nueva cantidad es mayor que la actual, verificar stock
            if (quantity > cart.products[productInCartIndex].quantity) {
                const product = await productDAO.getBy({ _id: pid });
                if (!product || !product.isActive || product.stock < quantity) {
                    logger.warning(`Stock insuficiente para actualizar cantidad de ${pid} a ${quantity}.`);
                    return res.status(400).json({ status: 'error', message: `Insufficient stock for ${product ? product.name : 'product'}. Available: ${product ? product.stock : 'N/A'}` });
                }
            }

            if (quantity === 0) {
                cart.products.splice(productInCartIndex, 1); // Elimina el producto si la cantidad es 0
            } else {
                cart.products[productInCartIndex].quantity = quantity;
            }

            const updatedCart = await cartDAO.update(cart._id, { products: cart.products });
            logger.info(`Cantidad de producto ${pid} actualizada a ${quantity} en el carrito de ${req.user._id}.`);
            res.json({ status: 'success', message: 'Cart updated successfully.', payload: updatedCart });
        } catch (error) {
            logger.error(`Error en CartController.updateProductQuantityInCart (${req.user?._id}, ${req.params.pid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al actualizar el carrito: ${error.message}` });
        }
    }

    /**
     * Elimina un producto del carrito del usuario.
     * DELETE /api/carts/products/:pid
     */
    async removeProductFromCart(req, res) {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
            }
            const { pid } = req.params;

            let cart = await cartDAO.getBy({ user: req.user._id });
            if (!cart) {
                logger.warning(`Carrito no encontrado para usuario ${req.user._id} al intentar eliminar producto.`);
                return res.status(404).json({ status: 'error', message: 'Cart not found for user.' });
            }

            const initialLength = cart.products.length;
            cart.products = cart.products.filter(item => item.product.toString() !== pid);

            if (cart.products.length === initialLength) {
                logger.warning(`Producto ${pid} no encontrado en el carrito de ${req.user._id} al intentar eliminar.`);
                return res.status(404).json({ status: 'error', message: 'Product not found in cart.' });
            }

            const updatedCart = await cartDAO.update(cart._id, { products: cart.products });
            logger.info(`Producto ${pid} eliminado del carrito de ${req.user._id}.`);
            res.json({ status: 'success', message: 'Product removed from cart.', payload: updatedCart });
        } catch (error) {
            logger.error(`Error en CartController.removeProductFromCart (${req.user?._id}, ${req.params.pid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al eliminar producto del carrito: ${error.message}` });
        }
    }

    /**
     * Vacía completamente el carrito del usuario.
     * DELETE /api/carts/empty
     */
    async emptyCart(req, res) {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
            }

            let cart = await cartDAO.getBy({ user: req.user._id });
            if (!cart) {
                logger.warning(`Carrito no encontrado para usuario ${req.user._id} al intentar vaciar.`);
                return res.status(404).json({ status: 'error', message: 'Cart not found for user.' });
            }

            cart.products = [];
            const updatedCart = await cartDAO.update(cart._id, { products: cart.products });
            logger.info(`Carrito de usuario ${req.user._id} vaciado exitosamente.`);
            res.json({ status: 'success', message: 'Cart emptied successfully.', payload: updatedCart });
        } catch (error) {
            logger.error(`Error en CartController.emptyCart (${req.user?._id}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al vaciar el carrito: ${error.message}` });
        }
    }
}

export default new CartController();