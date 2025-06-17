import mongoose from "mongoose";
import Users from "../src/dao/Users.dao.js";
import Assert from 'node:assert';

const MONGODB_TEST_URI = process.env.MONGO_TEST_URL || 'mongodb://127.0.0.1:27017/be3shop_test';
mongoose.connect(MONGODB_TEST_URI);

const assert = Assert.strict;

describe('Testing User Dao', function() {
    before(function(){
        this.userDao = new Users();
    });

    beforeEach(async function () {
        try {
            await mongoose.connection.collections.users.drop();
        } catch (e) {
            if (e.code === 26 || e.message.includes('ns not found')) {
                console.log('Colección de usuarios no encontrada, creando una nueva.');
            } else {
                throw e;
            }
        }
        this.timeout(5000);
    });

    after(async function() {
        await mongoose.connection.close();
    });

    it('El debe poder obtener los usuarios en formato arreglo', async function () {
        const result = await this.userDao.get();
        assert.strictEqual(Array.isArray(result), true);
    });

    it('El dao debe agregar un ususario correctamente a la base de datos', async function() {
        let mockUser = {
            firstName: 'Federico',
            lastName: 'Osandón',
            email: 'f@gmail.com',
            password: '123456'
        };

        const result= await this.userDao.save(mockUser);
        assert.ok(result._id);
    });

    it('El dao agregará al documento insertado un arreglo de mascotas vacío por defecto', async function () {
        let mockUser = {
            firstName: 'Federico',
            lastName: 'Osandón',
            email: 'f@gmail.com',
            password: '123456'
        };

        const result= await this.userDao.save(mockUser);
        assert.deepStrictEqual(result.pets, []);
    });

    it('El dao puede obtener a un usuario por email', async function () {
        let mockUser = {
            firstName: 'Federico',
            lastName: 'Osandón',
            email: 'f@gmail.com',
            password: '123456'
        };

        const result= await this.userDao.save(mockUser);

        const user = await this.userDao.getBy({email: result.email});
        assert.strictEqual(typeof user, 'object');
    });

    it('El dao debe actualizar la información de un usuario existente correctamente', async function () {
        let mockUser = {
            firstName: 'Original',
            lastName: 'Apellido',
            email: 'original@example.com',
            password: 'password123'
        };
        const savedUser = await this.userDao.save(mockUser);
        assert.ok(savedUser._id);

        let updateData = {
            firstName: 'Actualizado',
            email: 'actualizado@example.com',
        };

        await this.userDao.update({ _id: savedUser._id }, updateData);

        const updatedUser = await this.userDao.getBy({ _id: savedUser._id });

        assert.strictEqual(updatedUser.firstName, updateData.firstName);
        assert.strictEqual(updatedUser.email, updateData.email);
        assert.strictEqual(updatedUser.lastName, mockUser.lastName);
        assert.strictEqual(updatedUser.password, mockUser.password);
    });
});