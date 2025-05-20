import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    password: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }
})

export default mongoose.model('User', userSchema);