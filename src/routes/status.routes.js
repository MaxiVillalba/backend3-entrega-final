// rutas para saber el estado de la app y bbdd respecto con el service de kubernetes
// El endpoint /health es para la liveness probe (sonda de vida), indica si la app está viva, ejecutandose y hace cuanto.
// El endpoint readiness probe (sonda de preparación), indica si la app esta lista para recibir trafico (ej. si la bbdd está conectada)
import { Router } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const statusRouter = Router();

statusRouter.get('/health', (req, res) => {
logger.info('Received health check request.');
res.status(200).json({
    status: 'ok',
    uptime: process.uptime(), // tiempo que lleva corriendo la app.
    message: 'Application is healthy and running'
})
});

statusRouter.get('/ready', async (req, res) => {
    try {
        // Verifica el estado de la conexión a MongoDB.
        // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (mongoose.connection.readyState === 1) {
            logger.info('Readiness check: Database connected. Application is ready.');
            res.status(200).json({
                status: 'ready',
                database: 'connected',
                message: 'Application is ready to serve traffic.'
            });
        } else {
            logger.warn(`Readiness check: Database disconnected (State: ${mongoose.connection.readyState}). Application not ready.`);
            res.status(503).json({ // 503 Service Unavailable
                status: 'not ready',
                database: 'disconnected',
                message: 'Application not ready, database connection issues.'
            });
        }
    } catch (error) {
        logger.error(`Readiness check failed due to an error: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Internal error during readiness check.'
        });
    }
});

export default statusRouter;
