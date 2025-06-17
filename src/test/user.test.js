import mongoose from "mongoose";
import Users from "../src/dao/Users.dao.js"; // Asegúrate de que esta ruta sea correcta
import Assert from 'node:assert';

// Define la URL de la base de datos de pruebas.
// Es crucial usar una base de datos diferente para los tests para evitar afectar tus datos de desarrollo.
const MONGODB_TEST_URI = 'mongodb://127.0.0.1:27017/be3shop_test'; // Usa un nombre distinto al de tu DB de desarrollo
mongoose.connect(MONGODB_TEST_URI);

const assert = Assert.strict;

describe('Testing User Dao', function() {
    before(function(){
        this.userDao = new Users();
    });

    beforeEach(async function () {
        // Asegúrate de que la colección 'users' exista antes de intentar .drop()
        // Opcional: Puedes verificar si la colección existe antes de dropear para evitar errores si está vacía
        try {
            await mongoose.connection.collections.users.drop();
        } catch (e) {
            // Ignorar si la colección no existe (por ejemplo, en la primera ejecución)
            if (e.code === 26 || e.message.includes('ns not found')) {
                console.log('Colección de usuarios no encontrada, creando una nueva.');
            } else {
                throw e; // Relanza otros errores
            }
        }
        this.timeout(5000); // Aumenta el timeout para operaciones de DB
    });

    after(async function() {
        // Cierra la conexión de Mongoose después de todas las pruebas
        await mongoose.connection.close();
    });

    it('El debe poder obtener los usuarios en formato arreglo', async function () {
        const result = await this.userDao.get();
        assert.strictEqual(Array.isArray(result), true);
    });

    it('El dao debe agregar un ususario correctamente a la base de datos', async function() {
        let mockUser = {
            first_name: 'Federico',
            last_name: 'Osandón',
            email: 'f@gmail.com',
            password: '123456'
        };

        const result= await this.userDao.save(mockUser);

        assert.ok(result._id);
    });

    it('El dao agregará al documento insertado un arreglo de mascotas vacío por defecto', async function () {
        let mockUser = {
            first_name: 'Federico',
            last_name: 'Osandón',
            email: 'f@gmail.com',
            password: '123456'
        };

        const result= await this.userDao.save(mockUser);
        assert.deepStrictEqual(result.pets, []);
    });

    it('El dao puede obtener a un usuario por email', async function () {
        let mockUser = {
            first_name: 'Federico',
            last_name: 'Osandón',
            email: 'f@gmail.com',
            password: '123456'
        };

        const result= await this.userDao.save(mockUser);

        const user = await this.userDao.getBy({email: result.email});
        assert.strictEqual(typeof user, 'object');
    });

    it('El dao debe actualizar la información de un usuario existente correctamente', async function () {
        // 1. Crear y guardar un usuario de prueba en la base de datos
        let mockUser = {
            first_name: 'Original',
            last_name: 'Apellido',
            email: 'original@example.com',
            password: 'password123'
        };
        const savedUser = await this.userDao.save(mockUser);
        assert.ok(savedUser._id, 'El usuario debería haber sido guardado y tener un ID'); 

        // 2. Definir los nuevos datos para la actualización
        let updateData = {
            first_name: 'Actualizado',
            email: 'actualizado@example.com',
        };

        // 3. Llamar al método de actualización del DAO
        await this.userDao.update({ _id: savedUser._id }, updateData);

        // 4. Obtener el usuario actualizado de la base de datos para verificar los cambios
        const updatedUser = await this.userDao.getBy({ _id: savedUser._id });

        // 5. Verificar que los campos se hayan actualizado correctamente
        assert.strictEqual(updatedUser.first_name, updateData.first_name, 'El nombre debería haberse actualizado');
        assert.strictEqual(updatedUser.email, updateData.email, 'El email debería haberse actualizado');
        assert.strictEqual(updatedUser.last_name, mockUser.last_name, 'El apellido no debería haber cambiado (ya que no se actualizó)');
        assert.strictEqual(updatedUser.password, mockUser.password, 'La contraseña no debería haber cambiado (ya que no se actualizó)');
    });
});