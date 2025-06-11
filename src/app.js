import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors'; 

import usersRouter from './routes/users.routes.js';
import productsRouter from './routes/product.routes.js'; 
import cartRouter from './routes/cart.routes.js'; 
import orderRouter from './routes/order.routes.js'; 
import mockRouter from './routes/mocks.routes.js'; 


import { logger } from './utils/logger.js';
import { addLogger } from './middlewares/infoLoggers.js';

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import { swaggerOptions } from './config/swaggerOptions.config.js';

dotenv.config()

const app = express();
const PORT = process.env.PORT||8080;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
    logger.error("MONGO_URL not defined in .env file. Please check your configuration.");
    process.exit(1); // Sale de la aplicación si no hay URL de Mongo
}

mongoose.connect(MONGO_URL)
    .then(() => {
        logger.info("Successfully connected to MongoDB.");
    })
    .catch(err => {
        logger.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1); // Sale de la aplicación si falla la conexión a MongoDB
    });

app.use(express.json());
app.use(express.urlencoded({ extended: true}))
app.use(cookieParser());
app.use(addLogger)
app.use(cors());


const spec = swaggerJSDoc(swaggerOptions)
app.use('/api/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(spec))



app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter); 
app.use('/api/carts', cartRouter);       
app.use('/api/orders', orderRouter);     
app.use('/api/mocks', mockRouter);

app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found'});
});
// En vez de utilizar console.log, utilizamos logger.info para que indique por consola
app.listen(PORT,()=> logger.info(`Server is running on http://localhost:${PORT}`))
