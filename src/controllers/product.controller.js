import ProductDAO from '../dao/Product.dao.js'; 
import { logger } from '../utils/logger.js'; 

const productDAO = new ProductDAO(); 

class ProductController {

    async getAllProducts(req, res) {
        try {
            const { page, limit, category, sort, name } = req.query;

            const query = {};
            if (category) query.category = category;
            if (name) query.name = { $regex: name, $options: 'i' };

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                select: '-__v', // Excluye el campo __v de Mongoose
            };

            if (sort) {
                const sortOrder = {};
                if (sort === 'price_asc') sortOrder.price = 1;
                else if (sort === 'price_desc') sortOrder.price = -1;
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
                // links para la paginación
                prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${result.limit}&${new URLSearchParams(query).toString()}&sort=${sort || ''}` : null,
                nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${result.limit}&${new URLSearchParams(query).toString()}&sort=${sort || ''}` : null,
            });
        } catch (error) {
            logger.error(`Error en ProductController.getAllProducts: ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener productos: ${error.message}` });
        }
    }


    async getProductById(req, res) {
        try {
            const { pid } = req.params;
            const product = await productDAO.getBy({ _id: pid });
            if (!product) {
                logger.warning(`Producto no encontrado con ID: ${pid}`);
                return res.status(404).json({ status: 'error', message: 'Product not found.' });
            }
            res.json({ status: 'success', payload: product });
        } catch (error) {
            logger.error(`Error en ProductController.getProductById (${req.params.pid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al obtener producto: ${error.message}` });
        }
    }


    async createProduct(req, res) {
        try {
            const productData = req.body;
            // Aquí podrías añadir validación de datos más compleja, por ejemplo con Joi o express-validator
            if (!productData.name || !productData.price || !productData.stock || !productData.category) {
                logger.warning('Intento de creación de producto fallido: faltan campos requeridos.');
                return res.status(400).json({ status: 'error', message: 'Missing required product fields: name, price, stock, category.' });
            }
            const newProduct = await productDAO.save(productData);
            logger.info(`Producto creado exitosamente: ${newProduct._id}`);
            res.status(201).json({ status: 'success', message: 'Product added successfully.', payload: newProduct });
        } catch (error) {
            logger.error(`Error en ProductController.createProduct: ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al guardar el producto: ${error.message}` });
        }
    }


    async updateProduct(req, res) {
        try {
            const { pid } = req.params;
            const updatedData = req.body;
            const updatedProduct = await productDAO.update(pid, updatedData);
            if (!updatedProduct) {
                logger.warning(`Intento de actualización de producto fallido: ID no encontrado ${pid}`);
                return res.status(404).json({ status: 'error', message: 'Product not found.' });
            }
            logger.info(`Producto actualizado exitosamente: ${updatedProduct._id}`);
            res.json({ status: 'success', message: 'Product updated successfully.', payload: updatedProduct });
        } catch (error) {
            logger.error(`Error en ProductController.updateProduct (${req.params.pid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al actualizar el producto: ${error.message}` });
        }
    }


    async deleteProduct(req, res) {
        try {
            const { pid } = req.params;
            const deletedProduct = await productDAO.delete(pid); // Esto debería ser un soft delete en tu DAO
            if (!deletedProduct) {
                logger.warning(`Intento de eliminación de producto fallido: ID no encontrado o ya inactivo ${pid}`);
                return res.status(404).json({ status: 'error', message: 'Product not found or already inactive.' });
            }
            logger.info(`Producto eliminado (soft delete) exitosamente: ${deletedProduct._id}`);
            res.json({ status: 'success', message: 'Product soft-deleted successfully.', payload: deletedProduct });
        } catch (error) {
            logger.error(`Error en ProductController.deleteProduct (${req.params.pid}): ${error.message}`);
            res.status(500).json({ status: 'error', message: `Error al eliminar el producto: ${error.message}` });
        }
    }
}

export default new ProductController(); 