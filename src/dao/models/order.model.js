// src/dao/models/Order.model.js
import mongoose from "mongoose";

const collection = "orders";

const schema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'users', // References the 'users' collection (from User.model.js)
        required: true,
    },
    products: [
        {
            _id: false, // Prevents Mongoose from creating an _id for each subdocument if not needed
            product: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'products', // References the 'products' collection (from Product.model.js)
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            priceAtPurchase: { // Crucial: captures the price when the order was made
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'shipped', 'cancelled'],
        default: 'pending'
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    // Optional: Add timestamps for creation/update
    // createdAt: { type: Date, default: Date.now }, // Can remove if using timestamps: true
    // updatedAt: { type: Date, default: Date.now }  // Can remove if using timestamps: true
}, {
    // Add timestamps option here for automatic createdAt and updatedAt fields
    timestamps: true
});

// This index is fine here, as 'user' is not marked as unique directly in the field definition.
schema.index({ user: 1 });

const orderModel = mongoose.model(collection, schema);

export default orderModel;