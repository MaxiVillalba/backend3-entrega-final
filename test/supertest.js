import chai from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js'; 
import User from '../src/models/userModel.js'; 

const expect = chai.expect;
const requester = supertest(app);

const MONGODB_API_TEST_URI = process.env.MONGO_API_TEST_URL || 'mongodb://127.0.0.1:27017/be3shop_api_test_chai';

describe('Testing de API de Usuarios', () => {
    this.timeout(10000);

    before(async () => {
        await mongoose.connect(MONGODB_API_TEST_URI);
    });

    beforeEach(async () => {
        try {
            await User.deleteMany({});
        } catch (e) {
            if (e.code === 26 || e.message.includes('ns not found')) {
                // Ignorar si la colección no existe
            } else {
                throw e;
            }
        }
    });

    after(async () => {
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
    });

    it('El endpoint POST /api/users/register debe crear un usuario correctamente y devolver un id', async () => {
        const userData = {
            username: 'chaiuser1',
            email: 'chai1@example.com',
            password: 'ChaiPassword123!',
        };

        const result = await requester.post('/api/users/register').send(userData);

        expect(result.status).to.equal(201);
        expect(result.body).to.have.property('message', 'Usuario registrado exitosamente');
        expect(result.body).to.have.property('user');
        expect(result.body.user).to.have.property('_id').and.to.be.a('string');
        expect(result.body.user).to.have.property('username', userData.username);
        expect(result.body.user).to.not.have.property('password');
    });

    it('El endpoint POST /api/users/register debe retornar 400 si faltan campos obligatorios', async () => {
        const userData = {
            username: 'incompleteuser',
            email: 'incomplete@example.com',
        };

        const result = await requester.post('/api/users/register').send(userData);

        expect(result.status).to.equal(400);
        expect(result.body).to.have.property('message');
        expect(result.body.message).to.include('password');
    });

    it('El endpoint POST /api/users/login debe loguear un usuario y devolver un token', async () => {
        const userData = {
            username: 'loginchaiuser',
            email: 'loginchai@example.com',
            password: 'LoginChaiPassword123!',
        };
        await requester.post('/api/users/register').send(userData);

        const loginCredentials = {
            email: userData.email,
            password: userData.password,
        };

        const result = await requester.post('/api/users/login').send(loginCredentials);

        expect(result.status).to.equal(200);
        expect(result.body).to.have.property('token').and.to.be.a('string');
        expect(result.body).to.have.property('message', 'Inicio de sesión exitoso');
    });

    it('El endpoint GET /api/users/me debe devolver el perfil del usuario autenticado', async () => {
        const userData = {
            username: 'profilechaiuser',
            email: 'profilechai@example.com',
            password: 'ProfileChaiPassword123!',
        };
        await requester.post('/api/users/register').send(userData);

        const loginResult = await requester.post('/api/users/login').send({ email: userData.email, password: userData.password });
        const token = loginResult.body.token;

        const result = await requester.get('/api/users/me').set('Authorization', `Bearer ${token}`);

        expect(result.status).to.equal(200);
        expect(result.body).to.have.property('username', userData.username);
        expect(result.body).to.have.property('email', userData.email);
        expect(result.body).to.not.have.property('password');
    });

    it('El endpoint GET /api/users/me debe retornar 401 si no hay token de autenticación', async () => {
        const result = await requester.get('/api/users/me');

        expect(result.status).to.equal(401);
        expect(result.body).to.have.property('message', 'No autorizado');
    });
});