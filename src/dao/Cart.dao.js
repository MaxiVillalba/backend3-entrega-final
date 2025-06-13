import cartModel from "./models/cart.model.js";
export default class CartDAO { // Renamed to CartDAO for clarity

    /**
     * Retrieves carts based on query parameters and options.
     * @param {Object} query - MongoDB query object.
     * @param {Object} options - Options for population, pagination, sorting.
     * @returns {Promise<Array|Object>} Array of carts or a paginated result.
     */
    async get(query = {}, options = {}) {
        try {
            // Cart DAOs usually don't need full pagination like products/users
            // but the structure allows it if an admin view needed to list carts.
            const { populate } = options;

            let cartQuery = cartModel.find(query).lean();
            if (populate) {
                cartQuery = cartQuery.populate(populate);
            }
            const carts = await cartQuery;
            return carts; // For carts, usually just return the found carts directly.
        } catch (error) {
            console.error("Error fetching carts:", error);
            throw new Error(`Failed to retrieve carts: ${error.message}`);
        }
    }

    /**
     * Retrieves a single cart by specific parameters.
     * @param {Object} params - Parameters to find the cart (e.g., { user: 'userId' }).
     * @param {Object} options - Options for population (e.g., { populate: 'products.product' }).
     * @returns {Promise<Object|null>} The found cart document or null.
     */
    async getBy(params, options = {}) {
        try {
            let cartQuery = cartModel.findOne(params).lean();
            if (options.populate) {
                cartQuery = cartQuery.populate(options.populate);
            }
            return await cartQuery;
        } catch (error) {
            console.error("Error fetching cart by params:", params, error);
            throw new Error(`Failed to retrieve cart: ${error.message}`);
        }
    }

    /**
     * Creates a new cart.
     * @param {Object} doc - The cart document to save.
     * @returns {Promise<Object>} The created cart document.
     */
    async save(doc) {
        try {
            return await cartModel.create(doc);
        } catch (error) {
            console.error("Error saving cart:", doc, error);
            if (error.code === 11000) { // MongoDB duplicate key error (for unique user field)
                throw new Error("This user already has a cart.");
            }
            throw new Error(`Failed to save cart: ${error.message}`);
        }
    }

    /**
     * Updates a cart by its ID.
     * @param {string} id - The ID of the cart to update.
     * @param {Object} doc - The fields to update in the cart document.
     * @returns {Promise<Object|null>} The updated cart document or null if not found.
     */
    async update(id, doc) {
        try {
            return await cartModel.findByIdAndUpdate(id, { $set: doc }, { new: true }).lean();
        } catch (error) {
            console.error("Error updating cart:", id, doc, error);
            throw new Error(`Failed to update cart: ${error.message}`);
        }
    }

    /**
     * Deletes a cart by its ID.
     * @param {string} id - The ID of the cart to delete.
     * @returns {Promise<Object|null>} The deleted cart document or null if not found.
     */
    async delete(id) {
        try {
            return await cartModel.findByIdAndDelete(id).lean();
        } catch (error) {
            console.error("Error deleting cart:", id, error);
            throw new Error(`Failed to delete cart: ${error.message}`);
        }
    }
}