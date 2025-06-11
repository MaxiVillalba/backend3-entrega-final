import Users from "../dao/Users.dao.js";
import orderModel from "../dao/Order.dao.js";
import Product from "../dao/Product.dao.js";
import cartModel from "../dao/Cart.dao.js";


import UserRepository from "../repository/UserRepository.js";
import CartRepository from "../repository/CartRepository.js";
import OrderRepository from "../repository/OrderRepository.js";
import ProductRepository from "../repository/ProductRepository.js";

export const usersService = new UserRepository(new Users());
export const cartService = new CartRepository(new Cart());
export const orderService = new OrderRepository(new Order());
export const productService = new ProductRepository(new Product());
