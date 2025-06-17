import request from 'supertest';
import app from '../src/app.js'; 
import mongoose from 'mongoose';
import User from '../src/models/userModel.js'; 
import Assert from 'node:assert';

const assert = Assert.strict;

const MONGODB_API_TEST_URI = process.env.MONGO_API_TEST_URL || 'mongodb://127.0.0.1:27017/be3shop_api_test';

describe('User API Integration Tests', function() {
    this.timeout(10000);

    before(async function() {
        await mongoose.connect(MONGODB_API_TEST_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a la DB de pruebas de API.');
    });

    beforeEach(async function() {
        try {
            await User.deleteMany({});
        } catch (e) {
            if (e.code === 26 || e.message.includes('ns not found')) {
                 console.log('Colección de usuarios no encontrada en la DB de API, se creará al insertar.');
            } else {
                throw e;
            }
        }
    });

    after(async function() {
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
        console.log('DB de pruebas de API eliminada y conexión cerrada.');
    });

    it('debería registrar un nuevo usuario exitosamente (POST /api/users/register)', async function() {
        const userData = {
            username: 'apiuser1',
            email: 'api1@example.com',
            password: 'ApiPassword123!',
        };

        const res = await request(app)
            .post('/api/users/register')
            .send(userData);

        assert.strictEqual(res.statusCode, 201, 'El código de estado debería ser 201');
        assert.strictEqual(res.body.message, 'Usuario registrado exitosamente', 'El mensaje de éxito debería coincidir');
        assert.ok(res.body.user._id, 'El usuario retornado debería tener un ID');
        assert.strictEqual(res.body.user.username, userData.username, 'El nombre de usuario debería coincidir');
        assert.strictEqual(res.body.user.email, userData.email, 'El email debería coincidir');
        assert.ok(!res.body.user.password, 'La contraseña no debería ser retornada en la respuesta');
    });

    it('debería retornar 400 si faltan campos obligatorios durante el registro (POST /api/users/register)', async function() {
        const userData = {
            username: 'incompleteapiuser',
            email: 'incompleteapi@example.com',
        };

        const res = await request(app)
            .post('/api/users/register')
            .send(userData);

        assert.strictEqual(res.statusCode, 400, 'El código de estado debería ser 400');
        assert.ok(res.body.message, 'Debería haber un mensaje de error definido');
        assert.ok(res.body.message.includes('password') || res.body.message.includes('Missing fields'), 'El mensaje de error debería indicar la falta de datos');
    });

    it('debería iniciar sesión a un usuario existente y retornar un token (POST /api/users/login)', async function() {
        const userData = {
            username: 'loginapiuser',
            email: 'loginapi@example.com',
            password: 'LoginApiPassword123!',
        };
        await request(app).post('/api/users/register').send(userData);

        const loginCredentials = {
            email: userData.email,
            password: userData.password,
        };

        const res = await request(app)
            .post('/api/users/login')
            .send(loginCredentials);

        assert.strictEqual(res.statusCode, 200, 'El código de estado debería ser 200');
        assert.ok(res.body.token, 'La respuesta debería contener un token');
        assert.strictEqual(res.body.message, 'Inicio de sesión exitoso', 'El mensaje de éxito de login debería coincidir');
    });

    it('debería obtener el perfil del usuario para un usuario autenticado (GET /api/users/me)', async function() {
        const userData = {
            username: 'profileapiuser',
            email: 'profileapi@example.com',
            password: 'ProfileApiPassword123!',
        };
        await request(app).post('/api/users/register').send(userData);

        const loginRes = await request(app)
            .post('/api/users/login')
            .send({ email: userData.email, password: userData.password });
        const token = loginRes.body.token;

        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        assert.strictEqual(res.statusCode, 200, 'El código de estado debería ser 200');
        assert.strictEqual(res.body.username, userData.username, 'El nombre de usuario en el perfil debería coincidir');
        assert.strictEqual(res.body.email, userData.email, 'El email en el perfil debería coincidir');
        assert.ok(!res.body.password, 'La contraseña no debería estar presente en el perfil retornado');
    });

    it('debería retornar 401 si se intenta acceder al perfil sin un token de autenticación (GET /api/users/me)', async function() {
        const res = await request(app)
            .get('/api/users/me');

        assert.strictEqual(res.statusCode, 401, 'El código de estado debería ser 401');
        assert.ok(res.body.message, 'Debería haber un mensaje de error definido');
        assert.strictEqual(res.body.message, 'No autorizado', 'El mensaje de error debería ser "No autorizado"');
    });
});