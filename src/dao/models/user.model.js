import mongoose from 'mongoose';
import bcrypt from 'bcrypt'; // 

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true } // Añadido para soft delete
});

// Pre-save hook para hashear la contraseña antes de guardar o actualizar
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) { // Solo hashear si la contraseña ha sido modificada
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Método para comparar contraseñas
userSchema.methods.isValidPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

export default mongoose.model('users', userSchema);