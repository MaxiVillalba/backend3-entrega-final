// src/config/swaggerOptions.config.js

export const swaggerOptions = {
    definition: {
        openapi: '3.0.0', // Especificación OpenAPI
        info: {
            title: 'Documentación de la API de la "Entrega Final - BE3SHOP"', // Título de tu API
            version: '1.0.0', // Versión de tu API
            description: 'API para la gestión de productos, usuarios, carritos y órdenes de un e-commerce.',
            contact: {
                name: 'Maximiliano Villalba',
                email: 'Massevillalba@gmail.com'
            }
        },
        // Configuración para el servidor donde se despliega tu API
        servers: [
            {
                url: 'http://localhost:8000/api', // Asegúrate de que este sea el puerto correcto de tu API
                description: 'Servidor de desarrollo local'
            },
            // Puedes añadir más servidores, por ejemplo, uno de producción
            // {
            //    url: 'https://api.tu-dominio.com/api',
            //    description: 'Servidor de producción'
            // }
        ]
    },
    // Rutas a tus archivos de documentación (YML o JS)
    // Asegúrate de que esta ruta sea correcta para tus archivos .yml
    // Basado en tu estructura, parece que tus docs están en src/docs/
    apis: ['./src/docs/*.yml'] // Puedes añadir más patrones si tienes documentación en diferentes lugares o formatos
    // Por ejemplo, si también documentas en los propios controladores con JSDoc:
    // apis: ['./src/docs/*.yml', './src/controllers/*.js', './src/routes/*.js']
};

// Si en app.js lo importaras como "import swaggerOptions from...", entonces sería "export default swaggerOptions"
// Pero como lo importas como "import { swaggerOptions } from...", entonces es "export const swaggerOptions"