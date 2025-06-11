import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    thumbnail: { type: String },
    isActive: { type: Boolean, default: true } // Añadido para soft delete
});

export default mongoose.model('products', productSchema);