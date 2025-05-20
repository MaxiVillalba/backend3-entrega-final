import mongoose from 'mongoose';
import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 8000; 

mongoose.connect(process.env.MONGO_URI)
.then(()=> {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    })
})
.catch(error => console.error('Connection Error:', error));