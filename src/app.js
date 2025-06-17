import express from 'express';
import mongoose from 'mongoose';
import handlebars from 'express-handlebars'
import cookieParser from 'cookie-parser';


import cors from 'cors';

import usersRouter from './routes/users.routes.js';
import productsRouter from './routes/product.routes.js';
import cartRouter from './routes/cart.routes.js';
import orderRouter from './routes/order.routes.js';
import mockRouter from './routes/mocks.routes.js';
import sessionsRouter from './routes/session.routes.js';
import statusRouter from './routes/status.routes.js';

import { logger } from './utils/logger.js';
import { addLogger } from './middlewares/infoLoggers.js'; 

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import { swaggerOptions } from './config/swaggerOptions.config.js';


const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 
app.use(addLogger); 
app.use(cors()); 

const spec = swaggerJSDoc(swaggerOptions);
app.use('/api/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(spec));
app.use('/', statusRouter); //las rutas de health y ready estarán disponibles en la raiz

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/mocks', mockRouter);
app.use('/api/sessions', sessionsRouter);

app.get('/', (req, res) => {
    req.logger.info('Accessed root path / - Sending API welcome message');
    res.status(200).json({
        status: 'success',
        message: 'Welcome to the E-commerce API!',
        apiVersion: '1.0',
        documentation: '/api/docs' 
    });
});

app.use((req, res) => {
    req.logger.warning(`Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

app.get('/favicon.ico', (req, res) => {
    // 204 No Content significa que la solicitud fue exitosa pero no hay contenido para enviar.
    // Esto evita que el navegador pida el favicon repetidamente o que genere un 404 en tus logs.
    res.status(204).end();
});

app.use((req, res) => {
    req.logger.warning(`Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

export default app;