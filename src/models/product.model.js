import mongosee from 'mongoose';

const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    stock: Number
})

export default mongoose.model('Product', productSchema);