import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const seedDatabase = async () => {
  console.log('🌱 Seeding database...');

  try {
    // 1. Clear existing data in reverse dependency order
    console.log('Clearing old data...');
    const tablesToClear = [
      'cart_items',
      'reviews',
      'payments',
      'order_item_addons',
      'order_items',
      'orders',
      'delivery_tracking',
      'delivery_agents',
      'menu_item_addons',
      'menu_items',
      'restaurant_timings',
      'restaurants',
      'promo_codes',
      'users'
    ];

    for (const table of tablesToClear) {
      await db.execute(`DELETE FROM ${table}`);
    }

    // 2. Insert Users (Admin, Drivers, Customers, Owners)
    console.log('Inserting users...');
    const passwordHash = bcrypt.hashSync('password123', 10);
    
    const adminId = uuidv4();
    const driver1Id = uuidv4();
    const driver2Id = uuidv4();
    const driver3Id = uuidv4();
    const customer1Id = uuidv4();
    const customer2Id = uuidv4();
    const customer3Id = uuidv4();
    const customer4Id = uuidv4();
    const customer5Id = uuidv4();
    const customer6Id = uuidv4();
    const customer7Id = uuidv4();
    const restOwner1Id = uuidv4();
    const restOwner2Id = uuidv4();

    const insertUserSql = 'INSERT INTO users (id, name, email, password_hash, phone, role, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    await db.execute(insertUserSql, [adminId, 'Admin User', 'admin@quickbite.com', passwordHash, '9999999999', 'admin', 'QuickBite HQ, Mumbai', "2025-01-01 10:00:00"]);
    await db.execute(insertUserSql, [driver1Id, 'Ravi Kumar', 'driver1@quickbite.com', passwordHash, '8888888888', 'driver', 'Andheri East, Mumbai', "2025-01-15 09:00:00"]);
    await db.execute(insertUserSql, [driver2Id, 'Amit Sharma', 'driver2@quickbite.com', passwordHash, '7777777777', 'driver', 'Bandra West, Mumbai', "2025-02-01 11:00:00"]);
    await db.execute(insertUserSql, [driver3Id, 'Vikram Singh', 'driver3@quickbite.com', passwordHash, '6666666666', 'driver', 'Powai, Mumbai', "2025-03-10 14:00:00"]);
    await db.execute(insertUserSql, [customer1Id, 'Rahul Mehta', 'rahul@example.com', passwordHash, '9876543210', 'customer', '101, Sunshine Apts, Powai', "2025-01-20 08:00:00"]);
    await db.execute(insertUserSql, [customer2Id, 'Priya Singh', 'priya@example.com', passwordHash, '9876543211', 'customer', '404, Sea View, Juhu', "2025-02-05 12:00:00"]);
    await db.execute(insertUserSql, [customer3Id, 'Ananya Iyer', 'ananya@example.com', passwordHash, '9876543212', 'customer', '205, Rose Garden, Malad', "2025-03-01 10:00:00"]);
    await db.execute(insertUserSql, [customer4Id, 'Karan Kapoor', 'karan@example.com', passwordHash, '9876543213', 'customer', '302, Blue Heights, Goregaon', "2025-03-15 16:00:00"]);
    await db.execute(insertUserSql, [customer5Id, 'Sneha Patel', 'sneha@example.com', passwordHash, '9876543214', 'customer', '107, Green Valley, Thane', "2025-04-01 09:00:00"]);
    await db.execute(insertUserSql, [customer6Id, 'Rohan Desai', 'rohan@example.com', passwordHash, '9876543215', 'customer', '501, Skyline Tower, Worli', "2025-04-10 11:00:00"]);
    await db.execute(insertUserSql, [customer7Id, 'Megha Joshi', 'megha@example.com', passwordHash, '9876543216', 'customer', '803, Palm Beach, Navi Mumbai', "2025-05-01 08:00:00"]);
    await db.execute(insertUserSql, [restOwner1Id, 'Manoj Owner', 'owner1@quickbite.com', passwordHash, '1111111111', 'restaurant', 'Colaba, Mumbai', "2025-01-05 10:00:00"]);
    await db.execute(insertUserSql, [restOwner2Id, 'Suresh Owner', 'owner2@quickbite.com', passwordHash, '2222222222', 'restaurant', 'Malad, Mumbai', "2025-01-10 10:00:00"]);

    const allCustomers = [customer1Id, customer2Id, customer3Id, customer4Id, customer5Id, customer6Id, customer7Id];
    const allDrivers = [driver1Id, driver2Id, driver3Id];

    // 2.5 Insert Wallets for Users
    console.log('Inserting wallets...');
    const insertWalletSql = 'INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, ?)';
    const insertWalletTxnSql = 'INSERT INTO wallet_transactions (id, wallet_id, type, amount, description) VALUES (?, ?, ?, ?, ?)';
    
    const userWallets = [
      { userId: customer1Id, balance: 1000.00 },
      { userId: customer2Id, balance: 1000.00 },
      { userId: customer3Id, balance: 1000.00 },
      { userId: customer4Id, balance: 1000.00 },
      { userId: customer5Id, balance: 1000.00 },
      { userId: customer6Id, balance: 1000.00 },
      { userId: customer7Id, balance: 1000.00 },
      { userId: driver1Id, balance: 500.00 },
      { userId: driver2Id, balance: 500.00 },
      { userId: driver3Id, balance: 500.00 },
      { userId: restOwner1Id, balance: 2500.00 },
      { userId: restOwner2Id, balance: 2500.00 },
      { userId: adminId, balance: 10000.00 }
    ];

    for (const w of userWallets) {
      const walletId = uuidv4();
      await db.execute(insertWalletSql, [walletId, w.userId, w.balance]);
      await db.execute(insertWalletTxnSql, [uuidv4(), walletId, 'credit', w.balance, 'Initial Signup Balance']);
    }

    // 3. Insert Delivery Agents
    console.log('Inserting delivery agents...');
    const insertAgentSql = 'INSERT INTO delivery_agents (id, user_id, status, current_lat, current_lon, rating, total_deliveries) VALUES (?, ?, ?, ?, ?, ?, ?)';
    await db.execute(insertAgentSql, [uuidv4(), driver1Id, 'available', 19.1136, 72.8697, 4.8, 124]);
    await db.execute(insertAgentSql, [uuidv4(), driver2Id, 'available', 19.0596, 72.8295, 4.5, 89]);
    await db.execute(insertAgentSql, [uuidv4(), driver3Id, 'offline', 19.1176, 72.9060, 4.2, 45]);

    // 4. Insert Restaurants
    console.log('Inserting restaurants...');
    const rest1Id = uuidv4();
    const rest2Id = uuidv4();
    const rest3Id = uuidv4();
    const rest4Id = uuidv4();

    const insertRestSql = 'INSERT INTO restaurants (id, owner_id, name, description, address, rating, total_ratings, lat, lon, cuisine_type, image_url, delivery_time, delivery_fee, min_order, is_grocery) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    await db.execute(insertRestSql, [rest1Id, restOwner1Id, 'Bombay Biryani House', 'Authentic dum biryani and Mughlai dishes', 'Andheri East, Mumbai', 4.5, 1250, 19.1136, 72.8697, 'North Indian', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', '35-45 min', 45.00, 200.00, 0]);
    await db.execute(insertRestSql, [rest2Id, restOwner2Id, 'Pizza Paradise', 'Wood-fired pizzas and authentic Italian pasta', 'Bandra West, Mumbai', 4.2, 850, 19.0596, 72.8295, 'Italian', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', '25-35 min', 35.00, 150.00, 0]);
    await db.execute(insertRestSql, [rest3Id, restOwner1Id, 'South Spice', 'Crispy dosas and filter coffee', 'Matunga, Mumbai', 4.8, 2100, 19.0269, 72.8553, 'South Indian', 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&q=80', '20-30 min', 25.00, 100.00, 0]);
    await db.execute(insertRestSql, [rest4Id, restOwner2Id, 'QuickMart Groceries', 'Fresh fruits, vegetables and daily essentials', 'Powai, Mumbai', 4.6, 540, 19.1176, 72.9060, 'Grocery', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80', '10-15 min', 15.00, 99.00, 1]);

    const allRestaurants = [rest1Id, rest2Id, rest3Id, rest4Id];

    // 5. Insert Menu Items
    console.log('Inserting menu items...');
    const insertMenuSql = 'INSERT INTO menu_items (id, restaurant_id, name, description, price, image_url, category, is_veg, is_bestseller) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    // Biryani House
    const m1 = uuidv4(); await db.execute(insertMenuSql, [m1, rest1Id, 'Chicken Dum Biryani', 'Fragrant basmati rice layered with spiced chicken, slow-cooked in dum style.', 350.00, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400', 'Main Course', 0, 1]);
    const m2 = uuidv4(); await db.execute(insertMenuSql, [m2, rest1Id, 'Mutton Rogan Josh', 'Tender mutton pieces in a rich Kashmiri spice gravy.', 450.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', 'Main Course', 0, 0]);
    const m3 = uuidv4(); await db.execute(insertMenuSql, [m3, rest1Id, 'Paneer Tikka Masala', 'Charcoal grilled cottage cheese in rich tomato gravy.', 280.00, 'https://images.unsplash.com/photo-1565557613262-c8f8a1262d47?w=400', 'Main Course', 1, 1]);
    const m4 = uuidv4(); await db.execute(insertMenuSql, [m4, rest1Id, 'Garlic Naan', 'Soft Indian bread topped with minced garlic and butter.', 60.00, null, 'Breads', 1, 1]);
    const m5 = uuidv4(); await db.execute(insertMenuSql, [m5, rest1Id, 'Dal Makhani', 'Creamy black lentils slow-cooked overnight.', 220.00, null, 'Main Course', 1, 0]);
    
    // Pizza Paradise
    const m6 = uuidv4(); await db.execute(insertMenuSql, [m6, rest2Id, 'Margherita Pizza', 'Classic tomato sauce, fresh mozzarella, and basil.', 399.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 'Pizzas', 1, 1]);
    const m7 = uuidv4(); await db.execute(insertMenuSql, [m7, rest2Id, 'Pepperoni Pizza', 'Double pepperoni with extra cheese.', 499.00, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', 'Pizzas', 0, 1]);
    const m8 = uuidv4(); await db.execute(insertMenuSql, [m8, rest2Id, 'Garlic Breadsticks', 'With cheesy dip.', 149.00, null, 'Sides', 1, 0]);
    const m9 = uuidv4(); await db.execute(insertMenuSql, [m9, rest2Id, 'Pasta Alfredo', 'Creamy white sauce pasta with mushrooms.', 349.00, null, 'Pasta', 1, 0]);

    // South Spice
    const m10 = uuidv4(); await db.execute(insertMenuSql, [m10, rest3Id, 'Masala Dosa', 'Crispy crepe filled with spiced potato mash.', 120.00, 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400', 'Main Course', 1, 1]);
    const m11 = uuidv4(); await db.execute(insertMenuSql, [m11, rest3Id, 'Idli Vada Combo', '2 steamed rice cakes and 1 fried lentil donut.', 90.00, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=400', 'Breakfast', 1, 1]);
    const m12 = uuidv4(); await db.execute(insertMenuSql, [m12, rest3Id, 'Filter Coffee', 'Authentic South Indian strong coffee.', 40.00, null, 'Beverages', 1, 1]);
    const m13 = uuidv4(); await db.execute(insertMenuSql, [m13, rest3Id, 'Uttapam', 'Thick pancake with onions, tomatoes and chillies.', 110.00, null, 'Main Course', 1, 0]);

    // QuickMart
    const m14 = uuidv4(); await db.execute(insertMenuSql, [m14, rest4Id, 'Farm Fresh Milk (1L)', 'Full cream pasteurized milk.', 65.00, null, 'Dairy', 1, 1]);
    const m15 = uuidv4(); await db.execute(insertMenuSql, [m15, rest4Id, 'Brown Bread', '100% Whole wheat bread.', 45.00, null, 'Bakery', 1, 0]);
    const m16 = uuidv4(); await db.execute(insertMenuSql, [m16, rest4Id, 'Apples (1kg)', 'Fresh Washington apples.', 220.00, null, 'Fruits', 1, 1]);
    const m17 = uuidv4(); await db.execute(insertMenuSql, [m17, rest4Id, 'Eggs (12 pack)', 'Farm fresh eggs.', 85.00, null, 'Dairy', 0, 0]);

    // Menu items grouped by restaurant for order generation
    const menuByRest = {
      [rest1Id]: [{ id: m1, price: 350 }, { id: m2, price: 450 }, { id: m3, price: 280 }, { id: m4, price: 60 }, { id: m5, price: 220 }],
      [rest2Id]: [{ id: m6, price: 399 }, { id: m7, price: 499 }, { id: m8, price: 149 }, { id: m9, price: 349 }],
      [rest3Id]: [{ id: m10, price: 120 }, { id: m11, price: 90 }, { id: m12, price: 40 }, { id: m13, price: 110 }],
      [rest4Id]: [{ id: m14, price: 65 }, { id: m15, price: 45 }, { id: m16, price: 220 }, { id: m17, price: 85 }],
    };

    const menuNames = {
      [m1]: 'Chicken Dum Biryani', [m2]: 'Mutton Rogan Josh', [m3]: 'Paneer Tikka Masala',
      [m4]: 'Garlic Naan', [m5]: 'Dal Makhani', [m6]: 'Margherita Pizza',
      [m7]: 'Pepperoni Pizza', [m8]: 'Garlic Breadsticks', [m9]: 'Pasta Alfredo',
      [m10]: 'Masala Dosa', [m11]: 'Idli Vada Combo', [m12]: 'Filter Coffee',
      [m13]: 'Uttapam', [m14]: 'Farm Fresh Milk', [m15]: 'Brown Bread',
      [m16]: 'Apples (1kg)', [m17]: 'Eggs (12 pack)',
    };

    const deliveryFees = { [rest1Id]: 45, [rest2Id]: 35, [rest3Id]: 25, [rest4Id]: 15 };

    // 6. Generate 60 Orders across the last 30 days
    console.log('Generating 60 orders across last 30 days...');
    const paymentMethods = ['card', 'upi', 'cod', 'wallet'];
    const addresses = [
      '101, Sunshine Apts, Powai', '404, Sea View, Juhu', '205, Rose Garden, Malad',
      '302, Blue Heights, Goregaon', '107, Green Valley, Thane', '501, Skyline Tower, Worli',
      '803, Palm Beach, Navi Mumbai'
    ];

    const insertOrderSql = `
      INSERT INTO orders (
        id, user_id, restaurant_id, driver_id, status, 
        item_total, delivery_fee, tax_amount, discount_amount, grand_total, 
        delivery_address, special_instructions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`;
      
    const insertOrderItemSql = 'INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, base_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const insertPaymentSql = 'INSERT INTO payments (id, order_id, method, amount, status, transaction_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';

    const orderIds = [];

    for (let i = 0; i < 60; i++) {
      const orderId = uuidv4();
      orderIds.push(orderId);
      const custId = allCustomers[i % allCustomers.length];
      const restId = allRestaurants[i % allRestaurants.length];
      const driverId = allDrivers[i % allDrivers.length];

      // Distribute statuses: mostly delivered, some active, some cancelled
      let status;
      if (i < 35) status = 'delivered';
      else if (i < 40) status = 'cancelled';
      else if (i < 45) status = 'pending';
      else if (i < 50) status = 'confirmed';
      else if (i < 55) status = 'preparing';
      else status = 'out_for_delivery';

      // Generate date spread: last 30 days
      const daysAgo = Math.floor(i * 30 / 60);
      const hour = 8 + (i % 14); // 8am to 10pm
      const dateStr = new Date(Date.now() - daysAgo * 86400000);
      dateStr.setHours(hour, Math.floor(Math.random() * 60), 0);
      const createdAt = dateStr.toISOString().replace('T', ' ').substring(0, 19);

      // Pick 1-3 random items from the restaurant
      const restMenu = menuByRest[restId];
      const numItems = 1 + (i % 3);
      let subtotal = 0;
      const items = [];
      for (let j = 0; j < numItems && j < restMenu.length; j++) {
        const item = restMenu[(i + j) % restMenu.length];
        const qty = 1 + (j % 2);
        subtotal += item.price * qty;
        items.push({ menuId: item.id, name: menuNames[item.id], qty, price: item.price });
      }

      const delFee = deliveryFees[restId];
      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const total = subtotal + delFee + tax;
      const addr = addresses[i % addresses.length];
      const assignedDriver = (status !== 'pending' && status !== 'cancelled') ? driverId : null;
      const instructions = i % 5 === 0 ? 'Extra spicy please' : (i % 7 === 0 ? 'No onion no garlic' : null);

      await db.execute(insertOrderSql, [
        orderId, custId, restId, assignedDriver, status, 
        subtotal, delFee, tax, total, 
        addr, instructions, createdAt, createdAt
      ]);

      for (const item of items) {
        await db.execute(insertOrderItemSql, [uuidv4(), orderId, item.menuId, item.name, item.qty, item.price, item.price * item.qty]);
      }

      // Payment
      const payMethod = paymentMethods[i % paymentMethods.length];
      const payStatus = status === 'cancelled' ? 'refunded' : (status === 'delivered' ? 'completed' : 'pending');
      await db.execute(insertPaymentSql, [uuidv4(), orderId, payMethod, total, payStatus, `TXN_${Date.now()}_${i}`, createdAt]);
    }

    // 7. Insert Reviews for delivered orders
    console.log('Inserting reviews...');
    const insertReviewSql = 'INSERT INTO reviews (id, order_id, restaurant_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const reviewComments = [
      'Amazing food! Will order again.', 'Delivery was on time, great taste.',
      'Good food but slightly delayed.', 'Excellent biryani, loved it!',
      'Pizza was a bit cold on arrival.', 'Best dosa in town!',
      'Quality could be better.', 'Perfect meal, highly recommend.',
      'Fresh groceries, very happy!', 'Decent food, nothing special.',
      'Loved the paneer tikka!', 'Coffee was outstanding.',
      'Great value for money.', 'Packaging was excellent.',
      'Would love more spice options.'
    ];

    const [deliveredOrders] = await db.execute("SELECT o.*, r.id as rest_id FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE o.status='delivered'");
    
    for (let idx = 0; idx < deliveredOrders.length; idx++) {
      if (idx % 2 === 0) { // Review for every other delivered order
        const order = deliveredOrders[idx];
        const rating = 3 + (idx % 3); // 3, 4, or 5 stars
        await db.execute(insertReviewSql, [uuidv4(), order.id, order.rest_id, order.user_id, rating, reviewComments[idx % reviewComments.length], order.created_at]);
      }
    }

    // 8. Insert Promo Codes
    console.log('Inserting promo codes...');
    const insertPromoSql = 'INSERT INTO promo_codes (id, code, description, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, valid_from, valid_until, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    await db.execute(insertPromoSql, [uuidv4(), 'FLAT50', 'Flat ₹50 off on orders above ₹200', 'flat', 50.00, 200.00, null, 1000, 156, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1]);
    await db.execute(insertPromoSql, [uuidv4(), 'FREEDEL', 'Free delivery on all orders', 'flat', 45.00, 100.00, 45.00, 500, 89, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1]);
    await db.execute(insertPromoSql, [uuidv4(), 'FIRSTORDER', '20% off on your first order', 'percent', 20.00, 150.00, 100.00, null, 234, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1]);
    await db.execute(insertPromoSql, [uuidv4(), 'WEEKEND30', '30% off on weekends', 'percent', 30.00, 300.00, 150.00, 200, 45, '2025-06-01 00:00:00', '2026-06-30 23:59:59', 1]);
    await db.execute(insertPromoSql, [uuidv4(), 'BIRYANI100', '₹100 off on Biryani orders', 'flat', 100.00, 400.00, null, 100, 67, '2025-03-01 00:00:00', '2025-09-30 23:59:59', 0]);
    await db.execute(insertPromoSql, [uuidv4(), 'PIZZA25', '25% off on Pizza Paradise', 'percent', 25.00, 250.00, 120.00, 300, 112, '2025-04-01 00:00:00', '2026-12-31 23:59:59', 1]);
    await db.execute(insertPromoSql, [uuidv4(), 'NEWUSER', 'Flat ₹75 off for new users', 'flat', 75.00, 199.00, null, null, 502, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1]);
    await db.execute(insertPromoSql, [uuidv4(), 'DIWALI50', 'Diwali Special - 50% off', 'percent', 50.00, 200.00, 200.00, 5000, 3200, '2025-10-15 00:00:00', '2025-11-15 23:59:59', 0]);

    // Update restaurant ratings based on reviews
    console.log('Calculating restaurant ratings...');
    for (const restId of allRestaurants) {
      const [avgRows] = await db.execute('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE restaurant_id=?', [restId]);
      const avg = avgRows[0];
      if (avg.avg) {
        await db.execute('UPDATE restaurants SET rating=?, total_ratings=? WHERE id=?', [Math.round(avg.avg * 10) / 10, avg.count, restId]);
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('---');
    console.log('📊 Seed Summary:');
    console.log(`   Users: 13 (1 admin, 3 drivers, 7 customers, 2 owners)`);
    console.log(`   Restaurants: 4`);
    console.log(`   Menu Items: 17`);
    console.log(`   Orders: 60`);
    console.log(`   Reviews: ${Math.ceil(deliveredOrders.length / 2)}`);
    console.log(`   Promo Codes: 8`);
    console.log('---');
    console.log('Test Accounts (password: password123)');
    console.log('  Admin:      admin@quickbite.com');
    console.log('  Customer:   rahul@example.com');
    console.log('  Driver:     driver1@quickbite.com');
    console.log('  Restaurant: owner1@quickbite.com');
    console.log('---');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  } finally {
    process.exit(0);
  }
};

seedDatabase();
