import orderModel from "./models/order.model.js";
export default class OrderDAO { 

    /**
     * @param {Object} query - MongoDB query object (e.g., { user: 'userId' }).
     * @param {Object} options - Options for population, pagination, sorting (e.g., { populate: 'user', page: 1, limit: 10 }).
     * @returns {Promise<Array|Object>} Array of orders or a paginated result.
     */
    async get(query = {}, options = {}) {
        try {
            // Destructure pagination options
            const { page = 1, limit = 10, sort, populate } = options;
            const skip = (page - 1) * limit;

            let ordersQuery = orderModel.find(query)
                                        .skip(skip)
                                        .limit(limit)
                                        .lean(); // Use .lean() for performance

            if (sort) {
                ordersQuery = ordersQuery.sort(sort);
            }
            if (populate) {
                // Populate multiple paths if specified, e.g., [{ path: 'user', select: 'email' }, { path: 'products.product', select: 'name' }]
                ordersQuery = ordersQuery.populate(populate);
            }

            const orders = await ordersQuery;
            const totalDocs = await orderModel.countDocuments(query);

            return {
                orders,
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
            console.error("Error fetching orders:", error);
            throw new Error(`Failed to retrieve orders: ${error.message}`);
        }
    }

    /**
     * @param {Object} params 
     * @param {Object} options 
     * @returns {Promise<Object|null>} 
     */
    async getBy(params, options = {}) {
        try {
            let orderQuery = orderModel.findOne(params).lean();
            if (options.populate) {
                orderQuery = orderQuery.populate(options.populate);
            }
            return await orderQuery;
        } catch (error) {
            console.error("Error fetching order by params:", params, error);
            throw new Error(`Failed to retrieve order: ${error.message}`);
        }
    }

    /**
     * @param {Object} doc - The order document to save.
     * @returns {Promise<Object>} The created order document.
     */
    async save(doc) {
        try {
            return await orderModel.create(doc);
        } catch (error) {
            console.error("Error saving order:", doc, error);
            throw new Error(`Failed to save order: ${error.message}`);
        }
    }

    /**
     * @param {string} id - The ID of the order to update.
     * @param {Object} doc - The fields to update in the order document.
     * @returns {Promise<Object|null>} The updated order document or null if not found.
     */
    async update(id, doc) {
        try {
            // Mongoose's findByIdAndUpdate updates 'updatedAt' automatically if schema has timestamps.
            return await orderModel.findByIdAndUpdate(id, { $set: doc }, { new: true }).lean();
        } catch (error) {
            console.error("Error updating order:", id, doc, error);
            throw new Error(`Failed to update order: ${error.message}`);
        }
    }

    /**
     * Deletes an order by its ID (hard delete).
     * Consider soft deletion for orders in a production system.
     * @param {string} id - The ID of the order to delete.
     * @returns {Promise<Object|null>} The deleted order document or null if not found.
     */
    async delete(id) {
        try {
            // For orders, soft deletion (e.g., setting an 'isArchived' or 'status' to 'cancelled')
            // is often preferred over hard deletion to maintain historical data.
            // If you want hard delete, this is correct:
            return await orderModel.findByIdAndDelete(id).lean();
        } catch (error) {
            console.error("Error deleting order:", id, error);
            throw new Error(`Failed to delete order: ${error.message}`);
        }
    }
}