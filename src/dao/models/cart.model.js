import mongoose from "mongoose";

const collection = "carts";

const schema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'users', // References the 'users' collection (from User.model.js)
        required: true,
        unique: true // Ensures a user can only have one active cart
    },
    products: [
        {
            _id: false, // Prevents Mongoose from creating an _id for each subdocument
            product: { // The ID of the product
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'products', // References the 'products' collection (from Product.model.js)
                required: true
            },
            quantity: { // The quantity of this specific product in the cart
                type: Number,
                required: true,
                min: 1
            }
        }
    ],
    // Optional: Add timestamps for creation/update
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Optional: Add an index for faster lookup by user
schema.index({ user: 1 });

const cartModel = mongoose.model(collection, schema);

export default cartModel;