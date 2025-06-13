import app from './src/app.js'; 
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from './src/utils/logger.js'; 

dotenv.config(); 

const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL; 

if (!MONGO_URL) {
    logger.fatal("MONGO_URL not defined in .env file. Exiting application.");
    process.exit(1);
}

mongoose.connect(MONGO_URL)
    .then(() => {
        logger.info('MongoDB connected successfully!');
        app.listen(PORT, () => {
            logger.info(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        logger.fatal(`Failed to connect to MongoDB: ${error.message}`);
        process.exit(1); 
    });