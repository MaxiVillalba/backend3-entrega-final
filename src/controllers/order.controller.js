// src/controllers/order.controller.js
import OrderDAO from '../dao/Order.dao.js';
import CartDAO from '../dao/Cart.dao.js';
import ProductDAO from '../dao/Product.dao.js';
import { logger } from '../utils/logger.js';

const orderDAO = new OrderDAO();
const cartDAO = new CartDAO();
const productDAO = new ProductDAO();

class OrderController {
    /**
     * Crea una orden a partir del carrito del usuario.
     * POST /api/orders/purchase
     */
    async createOrderFromCart(req, res) {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
            }

            const userId = req.user._id;
            // Popula los productos para verificar stock y obtener precios
            const cart = await cartDAO.getBy({ user: userId }, { populate: 'products.product' });

            if (!cart || cart.products.length === 0) {
                logger.warning(`Intento de compra de carrito vacío para usuario: ${userId}`);
                return res.status(400).json({ status: 'error', message: 'Cart is empty. Cannot create an order.' });
            }

            let totalAmount = 0;
            const productsForOrder = [];
            const productsToUpdateStock = []; // Para acumular las actualizaciones de stock

            // Verificación y preparación de la orden
            for (const item of cart.products) {
                const product = item.product; // Producto populado
                const requestedQuantity = item.quantity;

                if (!product || !product.isActive) {
                    logger.warning(`Producto inactivo o no encontrado en el carrito al crear orden: ${product?._id || item.product.toString()}`);
                    return res.status(400).json({ status: 'error', message: `Product ${product ? product.name : item.product.toString()} is no longer active or found in cart.` });
                }
                if (product.stock < requestedQuantity) {
                    logger.warning(`Stock insuficiente para ${product.name} al crear orden. Solicitado: ${requestedQuantity}, Disponible: ${product.stock}`);
                    return res.status(400).json({ status: 'error', message: `Not enough stock for ${product.name}. Requested: ${requestedQuantity}, Available: ${product.stock}` });
                }

                productsForOrder.push({
                    product: product._id,
                    quantity: requestedQuantity,
                    priceAtPurchase: product.price // Registrar el precio en el momento de la compra
                });
                totalAmount += product.price * requestedQuantity;

                productsToUpdateStock.push({
                    productId: product._id,
                    newStock: product.stock - requestedQuantity
                });
            }

            // Crear la orden
            const newOrder = await orderDAO.save({
                user: userId,
                products: productsForOrder,
                totalAmount: totalAmount,
                status: 'pending' // Estado inicial de la orden
            });

            // Actualizar el stock de los productos
            const stockUpdatePromises = productsToUpdateStock.map(p =>
                productDAO.update(p.productId, { stock: p.newStock })
            );
            await Promise.all(stockUpdatePromises); // Esperar a que todas las actualizaciones de stock se completen

            // Vaciar el carrito después de la compra exitosa
            await cartDAO.update(cart._id, { products: [] });

            logger.info(`Orden creada exitosamente para usuario ${userId}: ${newOrder._id}`);
            res.status(201).json({ status: 'success', message: 'Order created successfully.', payload: newOrder });

        } catch (error) {
            logger.error(`Error en OrderController.createOrderFromCart (${req.user?._id}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al crear la orden: ${error.message}` });
        }
    }

    /**
     * Obtiene todas las órdenes del usuario autenticado.
     * GET /api/orders/my-orders
     */
    async getUserOrders(req, res) {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
            }
            // Puedes pasar opciones de paginación si tus DAOs lo soportan
            const result = await orderDAO.get({ user: req.user._id }, { populate: { path: 'products.product', select: 'name price' } });
            res.json({ status: 'success', payload: result.orders });
        } catch (error) {
            logger.error(`Error en OrderController.getUserOrders (${req.user?._id}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener órdenes del usuario: ${error.message}` });
        }
    }

    /**
     * Obtiene una orden específica por ID (propia del usuario o si es Admin).
     * GET /api/orders/:oid
     */
    async getOrderById(req, res) {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({ status: 'error', message: 'User not authenticated.' });
            }
            const { oid } = req.params;

            const order = await orderDAO.getBy({ _id: oid }, { populate: { path: 'products.product', select: 'name price' } });

            if (!order) {
                logger.warning(`Orden no encontrada con ID: ${oid}`);
                return res.status(404).json({ status: 'error', message: 'Order not found.' });
            }

            // Aquí se verificaría si el usuario es Admin O si la orden le pertenece.
            // if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
            //     logger.warning(`Intento de acceso no autorizado a orden ${oid} por usuario ${req.user._id}`);
            //     return res.status(403).json({ status: 'error', message: 'Forbidden: You do not have permission to view this order.' });
            // }

            res.json({ status: 'success', payload: order });
        } catch (error) {
            logger.error(`Error en OrderController.getOrderById (${req.params.oid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener orden: ${error.message}` });
        }
    }

    /**
     * Obtiene todas las órdenes (solo Admin).
     * GET /api/orders
     */
    async getAllOrders(req, res) {
        try {
            const { page, limit, status, sort, user } = req.query;
            const query = {};
            if (status) query.status = status;
            if (user) query.user = user; // Filtrar por ID de usuario

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                sort: sort ? JSON.parse(sort) : null, // Espera un JSON string para sort (ej. '{"purchaseDate":-1}')
                // Popula tanto el usuario como los productos en la orden
                populate: [{ path: 'user', select: 'email firstName lastName' }, { path: 'products.product', select: 'name price' }]
            };

            const result = await orderDAO.get(query, options);

            res.json({
                status: 'success',
                payload: result.orders,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevLink: result.hasPrevPage ? `/api/orders?page=${result.prevPage}&limit=${result.limit}&${new URLSearchParams(query).toString()}&sort=${sort || ''}` : null,
                nextLink: result.hasNextPage ? `/api/orders?page=${result.nextPage}&limit=${result.limit}&${new URLSearchParams(query).toString()}&sort=${sort || ''}` : null,
            });
        } catch (error) {
            logger.error(`Error en OrderController.getAllOrders: ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener todas las órdenes: ${error.message}` });
        }
    }

    /**
     * Actualiza el estado de una orden (solo Admin).
     * PUT /api/orders/:oid
     */
    async updateOrderStatus(req, res) {
        try {
            const { oid } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ status: 'error', message: 'Status field is required.' });
            }

            const allowedStatuses = ['pending', 'completed', 'shipped', 'cancelled'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ status: 'error', message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
            }

            const updatedOrder = await orderDAO.update(oid, { status });
            if (!updatedOrder) {
                logger.warning(`Intento de actualización de estado de orden fallido: ID no encontrado ${oid}`);
                return res.status(404).json({ status: 'error', message: 'Order not found.' });
            }
            logger.info(`Estado de orden ${oid} actualizado a: ${status}`);
            res.json({ status: 'success', message: 'Order status updated successfully.', payload: updatedOrder });
        } catch (error) {
            logger.error(`Error en OrderController.updateOrderStatus (${req.params.oid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al actualizar el estado de la orden: ${error.message}` });
        }
    }
}

export default new OrderController();