import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

export const generateMockUser = async () => {
    const hashedPassword = await bcrypt.hash('pass123', 10);
    return {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: faker.helpers.arrayElement(['user', 'admin']),
    };
};

export const generateMockProduct = () => {
    return {
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        stock: faker.number.int({ min: 1, max: 100}),
    };
};