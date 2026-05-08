import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const seedDatabase = () => {
  console.log('🌱 Seeding database...');

  // 1. Clear existing data
  db.exec(`
    DELETE FROM cart_items;
    DELETE FROM reviews;
    DELETE FROM payments;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM delivery_agents;
    DELETE FROM menu_items;
    DELETE FROM restaurants;
    DELETE FROM users;
  `);

  // 2. Insert Users (Admin, Driver, Customers)
  const passwordHash = bcrypt.hashSync('password123', 10);
  
  const adminId = uuidv4();
  const driver1Id = uuidv4();
  const driver2Id = uuidv4();
  const customer1Id = uuidv4();
  const customer2Id = uuidv4();
  const restOwner1Id = uuidv4();
  const restOwner2Id = uuidv4();

  const insertUser = db.prepare('INSERT INTO users (id, name, email, password_hash, phone, role, address) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  insertUser.run(adminId, 'Admin User', 'admin@quickbite.com', passwordHash, '9999999999', 'admin', 'HQ');
  insertUser.run(driver1Id, 'Ravi Driver', 'driver1@quickbite.com', passwordHash, '8888888888', 'driver', 'Andheri East');
  insertUser.run(driver2Id, 'Amit Delivery', 'driver2@quickbite.com', passwordHash, '7777777777', 'driver', 'Bandra West');
  insertUser.run(customer1Id, 'Rahul Customer', 'rahul@example.com', passwordHash, '9876543210', 'customer', '101, Sunshine Apts, Powai');
  insertUser.run(customer2Id, 'Priya Singh', 'priya@example.com', passwordHash, '9876543211', 'customer', '404, Sea View, Juhu');
  insertUser.run(restOwner1Id, 'Manoj Owner', 'owner1@quickbite.com', passwordHash, '1111111111', 'restaurant', 'Colaba');
  insertUser.run(restOwner2Id, 'Suresh Owner', 'owner2@quickbite.com', passwordHash, '2222222222', 'restaurant', 'Malad');

  // 3. Insert Delivery Agents
  const insertAgent = db.prepare('INSERT INTO delivery_agents (id, user_id, status, current_lat, current_lon, rating, total_deliveries) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertAgent.run(uuidv4(), driver1Id, 'available', 19.1136, 72.8697, 4.8, 124);
  insertAgent.run(uuidv4(), driver2Id, 'available', 19.0596, 72.8295, 4.5, 89);

  // 4. Insert Restaurants
  const rest1Id = uuidv4();
  const rest2Id = uuidv4();
  const rest3Id = uuidv4();
  const rest4Id = uuidv4();

  const insertRest = db.prepare('INSERT INTO restaurants (id, owner_id, name, description, address, rating, total_ratings, lat, lon, cuisine_type, image_url, delivery_time, delivery_fee, min_order, is_grocery) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  insertRest.run(rest1Id, restOwner1Id, 'Bombay Biryani House', 'Authentic dum biryani and Mughlai dishes', 'Andheri East, Mumbai', 4.5, 1250, 19.1136, 72.8697, 'North Indian', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', '35-45 min', 45, 200, 0);
  insertRest.run(rest2Id, restOwner2Id, 'Pizza Paradise', 'Wood-fired pizzas and authentic Italian pasta', 'Bandra West, Mumbai', 4.2, 850, 19.0596, 72.8295, 'Italian', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', '25-35 min', 35, 150, 0);
  insertRest.run(rest3Id, restOwner1Id, 'South Spice', 'Crispy dosas and filter coffee', 'Matunga, Mumbai', 4.8, 2100, 19.0269, 72.8553, 'South Indian', 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&q=80', '20-30 min', 25, 100, 0);
  insertRest.run(rest4Id, restOwner2Id, 'QuickMart Groceries', 'Fresh fruits, vegetables and daily essentials', 'Powai, Mumbai', 4.6, 540, 19.1176, 72.9060, 'Grocery', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80', '10-15 min', 15, 99, 1);

  // 5. Insert Menu Items
  const insertMenu = db.prepare('INSERT INTO menu_items (id, restaurant_id, name, description, price, image_url, category, is_veg, is_bestseller) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  // Biryani House
  insertMenu.run(uuidv4(), rest1Id, 'Chicken Dum Biryani', 'Fragrant basmati rice layered with spiced chicken, slow-cooked in dum style.', 350, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400', 'Main Course', 0, 1);
  insertMenu.run(uuidv4(), rest1Id, 'Mutton Rogan Josh', 'Tender mutton pieces in a rich Kashmiri spice gravy.', 450, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', 'Main Course', 0, 0);
  insertMenu.run(uuidv4(), rest1Id, 'Paneer Tikka Masala', 'Charcoal grilled cottage cheese in rich tomato gravy.', 280, 'https://images.unsplash.com/photo-1565557613262-c8f8a1262d47?w=400', 'Main Course', 1, 1);
  insertMenu.run(uuidv4(), rest1Id, 'Garlic Naan', 'Soft Indian bread topped with minced garlic and butter.', 60, null, 'Breads', 1, 1);
  
  // Pizza Paradise
  insertMenu.run(uuidv4(), rest2Id, 'Margherita Pizza', 'Classic tomato sauce, fresh mozzarella, and basil.', 399, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 'Pizzas', 1, 1);
  insertMenu.run(uuidv4(), rest2Id, 'Pepperoni Pizza', 'Double pepperoni with extra cheese.', 499, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', 'Pizzas', 0, 1);
  insertMenu.run(uuidv4(), rest2Id, 'Garlic Breadsticks', 'With cheesy dip.', 149, null, 'Sides', 1, 0);

  // South Spice
  insertMenu.run(uuidv4(), rest3Id, 'Masala Dosa', 'Crispy crepe filled with spiced potato mash. Served with chutneys and sambar.', 120, 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400', 'Main Course', 1, 1);
  insertMenu.run(uuidv4(), rest3Id, 'Idli Vada Combo', '2 steamed rice cakes and 1 fried lentil donut.', 90, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=400', 'Breakfast', 1, 1);
  insertMenu.run(uuidv4(), rest3Id, 'Filter Coffee', 'Authentic South Indian strong coffee.', 40, null, 'Beverages', 1, 1);

  // QuickMart
  insertMenu.run(uuidv4(), rest4Id, 'Farm Fresh Milk (1L)', 'Full cream pasteurized milk.', 65, null, 'Dairy', 1, 1);
  insertMenu.run(uuidv4(), rest4Id, 'Brown Bread', '100% Whole wheat bread.', 45, null, 'Bakery', 1, 0);
  insertMenu.run(uuidv4(), rest4Id, 'Apples (1kg)', 'Fresh Washington apples.', 220, null, 'Fruits', 1, 1);

  console.log('✅ Database seeded successfully!');
  console.log('---');
  console.log('Test Accounts (password: password123)');
  console.log('Admin: admin@quickbite.com');
  console.log('Customer: rahul@example.com');
  console.log('Driver: driver1@quickbite.com');
  console.log('Restaurant: owner1@quickbite.com');
  console.log('---');
};

seedDatabase();
