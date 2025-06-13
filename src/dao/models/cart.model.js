// src/dao/models/Cart.model.js
import mongoose from "mongoose";

const collection = "carts";

const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', // References the 'users' collection (from User.model.js)
        required: true,
        unique: true // Ensures a user can only have one active cart. This creates a unique index.
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
    // Mongoose has a built-in option for this, which is cleaner
    // createdAt: { type: Date, default: Date.now }, // Can remove if using timestamps: true
    // updatedAt: { type: Date, default: Date.now }  // Can remove if using timestamps: true
}, {
    // Add timestamps option here for automatic createdAt and updatedAt fields
    timestamps: true
});

// REMOVED: schema.index({ user: 1 });
// The 'unique: true' property on the 'user' field already creates the necessary unique index.
// This was the cause of the "Duplicate schema index" warning.

const cartModel = mongoose.model(collection, schema);

export default cartModel;