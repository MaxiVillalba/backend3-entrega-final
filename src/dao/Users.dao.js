import userModel from "./models/user.model.js";
export default class UsersDAO {

    /**
     * Obtiene usuarios con paginación, filtros y ordenamiento.
     * @param {Object} query - Objeto de consulta para filtrar (ej: { role: 'admin' }).
     * @param {Object} options - Opciones de consulta (ej: { page: 1, limit: 10, sort: { email: 1 } }).
     * @returns {Promise<Array>} Lista de usuarios.
     */
    async get(query = {}, options = {}) {
        try {
            if (query.isActive === undefined) {
                query.isActive = true; // Solo usuarios activos por defecto
            }

            const { page = 1, limit = 10, sort, select } = options;
            const skip = (page - 1) * limit;

            let usersQuery = userModel.find(query)
                                      .skip(skip)
                                      .limit(limit)
                                      .lean(); // .lean() para mayor rendimiento

            if (sort) {
                usersQuery = usersQuery.sort(sort);
            }
            if (select) {
                usersQuery = usersQuery.select(select);
            }

            const users = await usersQuery;
            const totalDocs = await userModel.countDocuments(query);

            return {
                users,
                totalDocs,
                page,
                limit,
                totalPages: Math.ceil(totalDocs / limit),
                hasPrevPage: page > 1,
                hasNextPage: page * limit < totalDocs,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page * limit < totalDocs ? page + 1 : null
            };
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            throw new Error(`Error al obtener usuarios: ${error.message}`);
        }
    }

    /**
     * Obtiene un único usuario según parámetros específicos.
     * @param {Object} params - Parámetros de búsqueda.
     * @returns {Promise<Object|null>} El usuario encontrado o null.
     */
    async getBy(params) {
        try {
            params.isActive = params.isActive !== undefined ? params.isActive : true;
            return await userModel.findOne(params).lean();
        } catch (error) {
            console.error("Error al obtener usuario por:", params, error);
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
    }

    /**
     * Guarda un nuevo usuario.
     * @param {Object} doc - Documento del usuario a guardar.
     * @returns {Promise<Object>} El usuario guardado.
     */
    async save(doc) {
        try {
            // El hashing de contraseña debería hacerse en el esquema (models/User.js) con un pre-save hook
            return await userModel.create(doc);
        } catch (error) {
            console.error("Error al guardar el usuario:", doc, error);
            // Si el error es por email duplicado, podrías lanzar un error más específico.
            if (error.code === 11000) { // Error de duplicidad de índice (ej. email único)
                throw new Error("El email ya está registrado.");
            }
            throw new Error(`Error al guardar el usuario: ${error.message}`);
        }
    }

    /**
     * Actualiza un usuario dado un id.
     * @param {string} id - ID del usuario.
     * @param {Object} doc - Documento con los campos a actualizar.
     * @returns {Promise<Object|null>} El usuario actualizado o null.
     */
    async update(id, doc) {
        try {
            // Si se intenta actualizar la contraseña, el hashing debe manejarse en el esquema.
            return await userModel.findByIdAndUpdate(id, { $set: doc }, { new: true }).lean();
        } catch (error) {
            console.error("Error al actualizar el usuario:", id, doc, error);
            throw new Error(`Error al actualizar el usuario: ${error.message}`);
        }
    }

    /**
     * Elimina lógicamente un usuario (soft delete).
     * @param {string} id - ID del usuario a eliminar.
     * @returns {Promise<Object|null>} El usuario "eliminado" (actualizado a inactivo) o null.
     */
    async delete(id) {
        try {
            return await userModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
        } catch (error) {
            console.error("Error al eliminar (soft delete) el usuario:", id, error);
            throw new Error(`Error al eliminar el usuario: ${error.message}`);
        }
    }
}