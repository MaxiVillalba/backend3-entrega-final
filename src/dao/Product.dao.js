import productModel from "./models/product.js"; 
export default class ProductDAO {

    /**
     * @param {Object} query - Objeto de consulta para filtrar (ej: { category: 'electronics' }).
     * @param {Object} options - Opciones de consulta (ej: { page: 1, limit: 10, sort: { price: 1 }, select: 'name price' }).
     * @returns {Promise<Array>} Lista de productos.
     */
    async get(query = {}, options = {}) {
        try {
            
            if (query.isActive === undefined) {
                query.isActive = true; // Solo productos activos por defecto
            }

            // Opciones de paginación y ordenamiento
            const { page = 1, limit = 10, sort, select } = options;
            const skip = (page - 1) * limit;

            let productsQuery = productModel.find(query)
                                            .skip(skip)
                                            .limit(limit)
                                            .lean(); // .lean() para mayor rendimiento en lecturas (retorna objetos JS planos)

            if (sort) {
                productsQuery = productsQuery.sort(sort);
            }
            if (select) {
                productsQuery = productsQuery.select(select);
            }

            const products = await productsQuery;
            const totalDocs = await productModel.countDocuments(query); // Para paginación

            return {
                products,
                totalDocs,
                page,
                limit,
                totalPages: Math.ceil(totalDocs / limit),
                hasPrevPage: page > 1,
                hasNextPage: page * limit < totalDocs,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page * limit < totalDocs ? page + 1 : null
            };

        } catch (error) {
            console.error("Error al obtener productos:", error); // Log del error
            throw new Error(`Error al obtener productos: ${error.message}`);
        }
    }

    /**
     * Obtiene un solo producto por parámetros.
     * @param {Object} params - Parámetros de búsqueda (ej: { _id: '...' } o { name: '...' }).
     * @returns {Promise<Object|null>} El producto encontrado o null.
     */
    async getBy(params) {
        try {
            // Añadir un filtro por `isActive: true` por defecto
            params.isActive = params.isActive !== undefined ? params.isActive : true;
            return await productModel.findOne(params).lean(); // .lean()
        } catch (error) {
            console.error("Error al obtener producto por:", params, error);
            throw new Error(`Error al obtener producto: ${error.message}`);
        }
    }

    /**
     * Guarda un nuevo producto.
     * @param {Object} doc - Documento del producto a guardar.
     * @returns {Promise<Object>} El producto guardado.
     */
    async save(doc) {
        try {
            
            return await productModel.create(doc);
        } catch (error) {
            console.error("Error al guardar producto:", doc, error);
            // Podrías lanzar un error más específico si es de validación de esquema
            throw new Error(`Error al guardar el producto: ${error.message}`);
        }
    }

    /**
     * Actualiza un producto por su ID.
     * @param {string} id - ID del producto.
     * @param {Object} doc - Documento con los campos a actualizar.
     * @returns {Promise<Object|null>} El producto actualizado o null si no se encuentra.
     */
    async update(id, doc) {
        try {
            return await productModel.findByIdAndUpdate(id, { $set: doc }, { new: true }).lean();
        } catch (error) {
            console.error("Error al actualizar producto:", id, doc, error);
            throw new Error(`Error al actualizar el producto: ${error.message}`);
        }
    }

    /**
     * Elimina lógicamente un producto (soft delete).
     * @param {string} id - ID del producto a eliminar.
     * @returns {Promise<Object|null>} El producto "eliminado" (actualizado a inactivo) o null.
     */
    async delete(id) {
        try {
            // En lugar de eliminar, actualizamos el estado a inactivo
            return await productModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
        } catch (error) {
            console.error("Error al eliminar (soft delete) producto:", id, error);
            throw new Error(`Error al eliminar el producto: ${error.message}`);
        }
    }
}