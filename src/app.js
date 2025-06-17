import express from 'express';
import mongoose from 'mongoose';
import handlebars from 'express-handlebars';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(addLogger);
app.use(cors());

app.engine('handlebars', handlebars.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, 'public')));

const spec = swaggerJSDoc(swaggerOptions);
app.use('/api/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(spec));

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

app.use('/', statusRouter);

app.get('/', (req, res) => {
    req.logger.info('Accessed root path / - Rendering home view');
    res.status(200).render('home', {
        title: 'Inicio BE3SHOP',
        welcomeMessage: '¡Bienvenido a BE3SHOP!',
    });
});

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/mocks', mockRouter);
app.use('/api/sessions', sessionsRouter);

app.use((req, res) => {
    logger.warning(`Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

export default app;
