require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

const upsertUser = async ({ name, email, password, role }) => {
  let user = await User.findOne({ email });
  if (!user) return User.create({ name, email, password, role });
  user.name = name; user.role = role; user.isActive = true;
  await user.save(); return user;
};
const upsertCategory = async (name, parent = null, description = '') => Category.findOneAndUpdate(
  { name, parent: parent ? parent._id : null }, { name, parent: parent ? parent._id : null, description, isActive: true }, { new: true, upsert: true, setDefaultsOnInsert: true }
);
const upsertProduct = async (data) => Product.findOneAndUpdate({ sku: data.sku }, data, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });

async function seed() {
  await connectDatabase();
  const admin = await upsertUser({ name: 'Demo Admin', email: 'admin@ecommerce.test', password: 'Admin@123', role: 'admin' });
  const customer = await upsertUser({ name: 'Demo Customer', email: 'customer@ecommerce.test', password: 'Customer@123', role: 'customer' });
  const electronics = await upsertCategory('Electronics', null, 'Electronic devices and accessories');
  const mobiles = await upsertCategory('Mobiles', electronics); const android = await upsertCategory('Android Phones', mobiles);
  const samsung = await upsertCategory('Samsung', android); const oneplus = await upsertCategory('OnePlus', android);
  const iphones = await upsertCategory('iPhones', mobiles); const computers = await upsertCategory('Computers', electronics);
  const laptops = await upsertCategory('Laptops', computers); const desktops = await upsertCategory('Desktops', computers);
  const products = await Promise.all([
    upsertProduct({ name: 'Samsung Galaxy S24', sku: 'SAM-S24-256', description: '256GB flagship Android phone', price: 74999, salePrice: 69999, stock: 15, category: samsung._id, status: 'active' }),
    upsertProduct({ name: 'OnePlus 12R', sku: 'ONE-12R-256', description: '256GB performance Android phone', price: 42999, salePrice: 39999, stock: 20, category: oneplus._id, status: 'active' }),
    upsertProduct({ name: 'iPhone 15', sku: 'APL-IP15-128', description: '128GB iPhone', price: 79900, salePrice: null, stock: 12, category: iphones._id, status: 'active' }),
    upsertProduct({ name: 'Dell Inspiron 14', sku: 'DEL-INS-14', description: '14 inch productivity laptop', price: 64999, salePrice: 59999, stock: 8, category: laptops._id, status: 'active' }),
    upsertProduct({ name: 'Creator Desktop', sku: 'DES-CRT-001', description: 'Desktop for creative workloads', price: 89999, salePrice: null, stock: 5, category: desktops._id, status: 'active' })
  ]);
  const sampleExists = await Order.exists({ customer: customer._id, 'items.sku': 'ONE-12R-256' });
  if (!sampleExists) {
    const product = products[1]; const unitPrice = product.salePrice || product.price;
    await Order.create({ customer: customer._id, status: 'delivered', items: [{ product: product._id, name: product.name, sku: product.sku, unitPrice, quantity: 1, lineTotal: unitPrice }], totalAmount: unitPrice });
  }
  console.log(`Seeded ${products.length} products. Demo admin: ${admin.email}; demo customer: ${customer.email}`);
  await mongoose.disconnect();
}
seed().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exit(1); });
