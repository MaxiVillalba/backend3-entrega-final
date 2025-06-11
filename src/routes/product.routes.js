import { Router } from 'express';
import ProductDAO from '../dao/Product.dao.js';
import productController from '../controllers/product.controller.js';
import { isAdmin, isAuthenticated } from '../middlewares/auth.js'; 

const productsRouter = Router();
const productDAO = new ProductDAO(); // Corrected instantiation

// GET all products with pagination, filters, and sorting
// Example: /api/products?page=1&limit=10&category=electronics&sort=price_asc
productsRouter.get('/', productController.getAllProducts, async (req, res) => {
    try {
        const { page, limit, category, sort, name } = req.query;

        const query = {};
        if (category) {
            query.category = category;
        }
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            select: '-__v',
        };

        if (sort) {
            const sortOrder = {};
            if (sort === 'price_asc') {
                sortOrder.price = 1;
            } else if (sort === 'price_desc') {
                sortOrder.price = -1;
            }
            options.sort = sortOrder;
        }

        const result = await productDAO.get(query, options);

        res.json({
            status: 'success',
            payload: result.products,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${result.limit}&${new URLSearchParams(query).toString()}&sort=${sort || ''}` : null,
            nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${result.limit}&${new URLSearchParams(query).toString()}&sort=${sort || ''}` : null,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET product by ID
productsRouter.get('/:pid', productController.getProductById, async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productDAO.getBy({ _id: pid });
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Product not found.' });
        }
        res.json({ status: 'success', payload: product });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST a new product (Admin only)
productsRouter.post('/', isAdmin, productController.createProduct, async (req, res) => {
    try {
        const productData = req.body;
        if (!productData.name || !productData.price || !productData.stock || !productData.category) {
            req.logger.warning(`Intento de creación de producto fallido: faltan campos. IP: ${req.ip}`);
            return res.status(400).json({ status: 'error', message: 'Missing required product fields.' });
        }
        const newProduct = await productDAO.save(productData);
        req.logger.info(`Producto creado exitosamente: ${newProduct._id}`);
        res.status(201).json({ status: 'success', message: 'Product added successfully.', payload: newProduct });
    } catch (error) {
        req.logger.error(`Error al guardar producto: ${error.message}`, { productData, user: req.user?._id }); // Puedes añadir metadatos
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT (update) a product by ID (Admin only)
productsRouter.put('/:pid', isAdmin, productController.updateProduct, async (req, res) => {
    try {
        const { pid } = req.params;
        const updatedData = req.body;
        const updatedProduct = await productDAO.update(pid, updatedData);
        if (!updatedProduct) {
            return res.status(404).json({ status: 'error', message: 'Product not found.' });
        }
        res.json({ status: 'success', message: 'Product updated successfully.', payload: updatedProduct });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE (soft delete) a product by ID (Admin only)
productsRouter.delete('/:pid', isAdmin, productController.deleteProduct, async (req, res) => {
    try {
        const { pid } = req.params;
        const deletedProduct = await productDAO.delete(pid);
        if (!deletedProduct) {
            return res.status(404).json({ status: 'error', message: 'Product not found or already inactive.' });
        }
        res.json({ status: 'success', message: 'Product soft-deleted successfully.', payload: deletedProduct });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default productsRouter;