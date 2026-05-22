// Mock data for admin portal — used when backend is unavailable
// This file maps API endpoint patterns to mock response data

const today = new Date().toISOString().split('T')[0];
const days = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const uuid = (i) => `a1b2c3d4-e5f6-7890-abcd-${String(i).padStart(12, '0')}`;

// ─── Admin Stats (Overview) ─────────────────────────────────────────
const adminStats = {
  totalRevenue: 487520,
  todayRevenue: 12340,
  totalOrders: 1856,
  todayOrders: 42,
  totalUsers: 3240,
  avgOrderValue: 263,
  totalRestaurants: 48,
  pendingOrders: 7,
  cancelledToday: 2,
  activeDrivers: 12,
  totalDrivers: 28,
  revenueByDay: Array.from({ length: 7 }, (_, i) => ({
    date: days(6 - i),
    revenue: 8000 + Math.floor(Math.random() * 9000),
  })),
  ordersByStatus: [
    { status: 'delivered', count: 1420 },
    { status: 'pending', count: 86 },
    { status: 'preparing', count: 64 },
    { status: 'out_for_delivery', count: 38 },
    { status: 'confirmed', count: 112 },
    { status: 'cancelled', count: 136 },
  ],
  topRestaurants: [
    { name: 'Spice Garden', order_count: 342, total_revenue: 89400, rating: 4.6 },
    { name: 'Pizza Palace', order_count: 278, total_revenue: 72340, rating: 4.4 },
    { name: 'Biryani House', order_count: 256, total_revenue: 68200, rating: 4.7 },
    { name: 'Dragon Wok', order_count: 198, total_revenue: 52100, rating: 4.3 },
    { name: 'The Burger Joint', order_count: 174, total_revenue: 45800, rating: 4.5 },
  ],
  peakHours: Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: h >= 11 && h <= 14 ? 15 + Math.floor(Math.random() * 20) : h >= 19 && h <= 22 ? 20 + Math.floor(Math.random() * 25) : Math.floor(Math.random() * 8),
  })),
  recentOrders: Array.from({ length: 10 }, (_, i) => ({
    id: uuid(100 + i),
    customer_name: ['Aarohi D.', 'Rushikesh Z.', 'Priya M.', 'Rahul S.', 'Neha K.', 'Amit P.', 'Sneha R.', 'Vikram T.', 'Pooja L.', 'Karan G.'][i],
    restaurant_name: ['Spice Garden', 'Pizza Palace', 'Biryani House', 'Dragon Wok', 'The Burger Joint', 'Cafe Mocha', 'Tandoor Nights', 'Sushi Express', 'Dosa Corner', 'Ice Cream Hub'][i],
    total_amount: 180 + Math.floor(Math.random() * 400),
    status: ['delivered', 'preparing', 'pending', 'out_for_delivery', 'confirmed', 'delivered', 'delivered', 'cancelled', 'preparing', 'delivered'][i],
  })),
};

// ─── Orders ─────────────────────────────────────────────────────────
const orders = {
  total: 48,
  orders: Array.from({ length: 20 }, (_, i) => ({
    id: uuid(200 + i),
    customer_name: ['Aarohi Dongarwar', 'Rushikesh Zod', 'Priya Mehta', 'Rahul Sharma', 'Neha Kapoor', 'Amit Patel', 'Sneha Rao', 'Vikram Thakur', 'Pooja Lad', 'Karan Gupta', 'Mansi D.', 'Ravi K.', 'Deepa S.', 'Arjun N.', 'Simran B.', 'Rohit V.', 'Anjali T.', 'Suresh P.', 'Meera J.', 'Nikhil R.'][i],
    customer_phone: `+91 98${String(76543210 + i * 111).slice(0, 8)}`,
    customer_email: `user${i + 1}@quickbite.com`,
    restaurant_name: ['Spice Garden', 'Pizza Palace', 'Biryani House', 'Dragon Wok', 'The Burger Joint', 'Cafe Mocha', 'Tandoor Nights', 'Sushi Express', 'Dosa Corner', 'Ice Cream Hub'][i % 10],
    total_amount: 180 + Math.floor(Math.random() * 500),
    delivery_fee: 30 + Math.floor(Math.random() * 30),
    status: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'delivered', 'delivered', 'cancelled', 'preparing', 'confirmed', 'delivered', 'pending', 'out_for_delivery', 'delivered', 'delivered', 'preparing', 'confirmed', 'delivered', 'cancelled', 'delivered'][i],
    payment: { method: ['upi', 'card', 'cod', 'wallet'][i % 4], status: 'completed' },
    driver_name: i % 3 === 0 ? null : ['Sunil K.', 'Raju M.', 'Deepak S.', 'Manoj T.'][i % 4],
    driver_id: i % 3 === 0 ? null : uuid(400 + (i % 4)),
    delivery_address: `${100 + i}, Sample Street, Nagpur`,
    items: [
      { name: 'Butter Chicken', quantity: 1, price: 220 },
      { name: 'Garlic Naan', quantity: 2, price: 40 },
      { name: 'Mango Lassi', quantity: 1, price: 60 },
    ],
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
  })),
};

// ─── Drivers ────────────────────────────────────────────────────────
const drivers = Array.from({ length: 12 }, (_, i) => ({
  id: uuid(400 + i),
  name: ['Sunil Kumar', 'Raju Mane', 'Deepak Singh', 'Manoj Tiwari', 'Vishal Patil', 'Sanjay Yadav', 'Ramesh Gupta', 'Ajay Deshmukh', 'Kiran More', 'Anil Jadhav', 'Sachin Wagh', 'Prakash Raut'][i],
  email: `driver${i + 1}@quickbite.com`,
  phone: `+91 97${String(12345670 + i * 111).slice(0, 8)}`,
  status: ['available', 'busy', 'available', 'offline', 'available', 'busy', 'available', 'offline', 'busy', 'available', 'available', 'offline'][i],
  rating: (4.0 + Math.random() * 0.9).toFixed(1),
  total_deliveries: 50 + Math.floor(Math.random() * 300),
  today_orders: Math.floor(Math.random() * 8),
  total_earnings: 8000 + Math.floor(Math.random() * 40000),
  created_at: days(30 + i * 5),
  agent_status: ['available', 'busy', 'available', 'offline', 'available', 'busy', 'available', 'offline', 'busy', 'available', 'available', 'offline'][i],
  recentDeliveries: Array.from({ length: 4 }, (_, j) => ({
    id: uuid(800 + i * 10 + j),
    restaurant_name: ['Spice Garden', 'Pizza Palace', 'Biryani House', 'Dragon Wok'][j],
    delivery_fee: 30 + Math.floor(Math.random() * 30),
    status: j < 3 ? 'delivered' : 'cancelled',
    created_at: days(j),
  })),
}));

// ─── Restaurants ────────────────────────────────────────────────────
const restaurants = [
  { id: uuid(300), name: 'Spice Garden', cuisine_type: 'North Indian', address: 'Dharampeth, Nagpur', rating: 4.6, total_orders: 342, total_revenue: 89400, menu_count: 32, is_active: true, is_grocery: false, owner_name: 'Rajesh Gupta' },
  { id: uuid(301), name: 'Pizza Palace', cuisine_type: 'Italian', address: 'Sadar, Nagpur', rating: 4.4, total_orders: 278, total_revenue: 72340, menu_count: 24, is_active: true, is_grocery: false, owner_name: 'Marco D.' },
  { id: uuid(302), name: 'Biryani House', cuisine_type: 'Hyderabadi', address: 'Sitabuldi, Nagpur', rating: 4.7, total_orders: 256, total_revenue: 68200, menu_count: 18, is_active: true, is_grocery: false, owner_name: 'Irfan Khan' },
  { id: uuid(303), name: 'Dragon Wok', cuisine_type: 'Chinese', address: 'Ramdaspeth, Nagpur', rating: 4.3, total_orders: 198, total_revenue: 52100, menu_count: 28, is_active: true, is_grocery: false, owner_name: 'Chen Li' },
  { id: uuid(304), name: 'The Burger Joint', cuisine_type: 'American', address: 'Civil Lines, Nagpur', rating: 4.5, total_orders: 174, total_revenue: 45800, menu_count: 15, is_active: true, is_grocery: false, owner_name: 'Mike B.' },
  { id: uuid(305), name: 'Cafe Mocha', cuisine_type: 'Cafe', address: 'Ambazari, Nagpur', rating: 4.2, total_orders: 156, total_revenue: 38200, menu_count: 22, is_active: true, is_grocery: false, owner_name: 'Priya Nair' },
  { id: uuid(306), name: 'Tandoor Nights', cuisine_type: 'Mughlai', address: 'Wardha Road, Nagpur', rating: 4.1, total_orders: 132, total_revenue: 34500, menu_count: 20, is_active: false, is_grocery: false, owner_name: 'Syed Ali' },
  { id: uuid(307), name: 'FreshMart Grocery', cuisine_type: 'Grocery', address: 'Manewada, Nagpur', rating: 4.3, total_orders: 98, total_revenue: 28400, menu_count: 120, is_active: true, is_grocery: true, owner_name: 'Suresh P.' },
];

// ─── Customers / Users ─────────────────────────────────────────────
const users = Array.from({ length: 15 }, (_, i) => ({
  id: uuid(500 + i),
  name: ['Aarohi Dongarwar', 'Rushikesh Zod', 'Priya Mehta', 'Rahul Sharma', 'Neha Kapoor', 'Amit Patel', 'Sneha Rao', 'Vikram Thakur', 'Pooja Lad', 'Karan Gupta', 'Mansi Desai', 'Ravi Kulkarni', 'Deepa Sharma', 'Arjun Nair', 'Simran Bhatia'][i],
  email: `${['aarohi', 'rushikesh', 'priya', 'rahul', 'neha', 'amit', 'sneha', 'vikram', 'pooja', 'karan', 'mansi', 'ravi', 'deepa', 'arjun', 'simran'][i]}@gmail.com`,
  phone: `+91 98${String(70000000 + i * 1111111).slice(0, 8)}`,
  role: i < 12 ? 'customer' : i === 12 ? 'driver' : i === 13 ? 'restaurant' : 'admin',
  order_count: 3 + Math.floor(Math.random() * 30),
  total_spent: 800 + Math.floor(Math.random() * 15000),
  address: `${10 + i} Main Road, Nagpur`,
  created_at: days(60 - i * 4),
  orders: Array.from({ length: 3 }, (_, j) => ({
    id: uuid(600 + i * 10 + j),
    restaurant_name: ['Spice Garden', 'Pizza Palace', 'Biryani House'][j],
    total_amount: 200 + Math.floor(Math.random() * 400),
    status: ['delivered', 'preparing', 'delivered'][j],
    created_at: days(j * 3),
  })),
}));

// ─── Finance ────────────────────────────────────────────────────────
const financeOverview = {
  totalRevenue: 487520,
  monthRevenue: 124800,
  todayRevenue: 12340,
  totalRefunds: 8400,
  totalDeliveryFees: 42600,
  revenueByDay: Array.from({ length: 30 }, (_, i) => ({
    date: days(29 - i),
    revenue: 3000 + Math.floor(Math.random() * 12000),
  })),
  paymentMethods: [
    { method: 'upi', total: 198400, count: 842 },
    { method: 'card', total: 156200, count: 534 },
    { method: 'cod', total: 88400, count: 312 },
    { method: 'wallet', total: 44520, count: 168 },
  ],
  restaurantPayouts: [
    { name: 'Spice Garden', orders: 342, payout: 71520 },
    { name: 'Pizza Palace', orders: 278, payout: 57870 },
    { name: 'Biryani House', orders: 256, payout: 54560 },
    { name: 'Dragon Wok', orders: 198, payout: 41680 },
    { name: 'The Burger Joint', orders: 174, payout: 36640 },
  ],
  driverPayouts: [
    { name: 'Sunil Kumar', deliveries: 186, earnings: 11160 },
    { name: 'Raju Mane', deliveries: 154, earnings: 9240 },
    { name: 'Deepak Singh', deliveries: 142, earnings: 8520 },
    { name: 'Vishal Patil', deliveries: 128, earnings: 7680 },
    { name: 'Sanjay Yadav', deliveries: 112, earnings: 6720 },
  ],
};

const transactions = Array.from({ length: 30 }, (_, i) => ({
  id: uuid(700 + i),
  transaction_id: `TXN${Date.now() - i * 100000}${String(Math.random()).slice(2, 8)}`,
  customer_name: ['Aarohi D.', 'Rushikesh Z.', 'Priya M.', 'Rahul S.', 'Neha K.'][i % 5],
  restaurant_name: ['Spice Garden', 'Pizza Palace', 'Biryani House', 'Dragon Wok', 'The Burger Joint'][i % 5],
  method: ['upi', 'card', 'cod', 'wallet'][i % 4],
  amount: 150 + Math.floor(Math.random() * 500),
  status: i % 7 === 0 ? 'refunded' : i % 5 === 0 ? 'pending' : 'completed',
  created_at: new Date(Date.now() - i * 7200000).toISOString(),
}));

// ─── Analytics ──────────────────────────────────────────────────────
const revenueAnalytics = Array.from({ length: 30 }, (_, i) => ({
  period: days(29 - i),
  revenue: 4000 + Math.floor(Math.random() * 14000),
  orders: 8 + Math.floor(Math.random() * 35),
}));

const orderAnalytics = {
  avgOrdersPerDay: 28,
  peakHours: Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: h >= 11 && h <= 14 ? 12 + Math.floor(Math.random() * 18) : h >= 19 && h <= 22 ? 18 + Math.floor(Math.random() * 22) : Math.floor(Math.random() * 6),
  })),
  statusDist: [
    { status: 'delivered', count: 1420 },
    { status: 'pending', count: 86 },
    { status: 'preparing', count: 64 },
    { status: 'out_for_delivery', count: 38 },
    { status: 'confirmed', count: 112 },
    { status: 'cancelled', count: 136 },
  ],
  cancellationTrend: Array.from({ length: 14 }, (_, i) => ({
    date: days(13 - i),
    total: 20 + Math.floor(Math.random() * 30),
    cancelled: Math.floor(Math.random() * 5),
  })),
};

const topItems = [
  { name: 'Butter Chicken', restaurant_name: 'Spice Garden', total_qty: 486, total_revenue: 106920 },
  { name: 'Margherita Pizza', restaurant_name: 'Pizza Palace', total_qty: 378, total_revenue: 75600 },
  { name: 'Hyderabadi Biryani', restaurant_name: 'Biryani House', total_qty: 342, total_revenue: 85500 },
  { name: 'Schezwan Noodles', restaurant_name: 'Dragon Wok', total_qty: 264, total_revenue: 39600 },
  { name: 'Classic Burger', restaurant_name: 'The Burger Joint', total_qty: 228, total_revenue: 45600 },
  { name: 'Garlic Naan', restaurant_name: 'Spice Garden', total_qty: 412, total_revenue: 16480 },
  { name: 'Paneer Tikka', restaurant_name: 'Tandoor Nights', total_qty: 196, total_revenue: 39200 },
  { name: 'Cold Coffee', restaurant_name: 'Cafe Mocha', total_qty: 184, total_revenue: 27600 },
];

// ─── Promos ─────────────────────────────────────────────────────────
const promos = [
  { id: uuid(900), code: 'WELCOME50', description: 'Flat ₹50 off on first order', discount_type: 'flat', discount_value: 50, min_order: 200, max_discount: null, usage_limit: 500, used_count: 234, is_active: true, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: uuid(901), code: 'SAVE20', description: '20% off on orders above ₹300', discount_type: 'percent', discount_value: 20, min_order: 300, max_discount: 100, usage_limit: 1000, used_count: 456, is_active: true, valid_from: '2026-03-01', valid_until: '2026-06-30' },
  { id: uuid(902), code: 'FREEDELIVERY', description: 'Free delivery on all orders', discount_type: 'flat', discount_value: 40, min_order: 150, max_discount: null, usage_limit: null, used_count: 789, is_active: true, valid_from: null, valid_until: null },
  { id: uuid(903), code: 'WEEKEND30', description: '30% off on weekends', discount_type: 'percent', discount_value: 30, min_order: 400, max_discount: 150, usage_limit: 200, used_count: 178, is_active: false, valid_from: '2026-04-01', valid_until: '2026-05-31' },
  { id: uuid(904), code: 'FLAT100', description: 'Flat ₹100 off above ₹500', discount_type: 'flat', discount_value: 100, min_order: 500, max_discount: null, usage_limit: 300, used_count: 42, is_active: true, valid_from: '2026-05-01', valid_until: '2026-07-31' },
];

// ─── Route Matcher ──────────────────────────────────────────────────
// Maps request URL patterns to mock data responses
const MOCK_ROUTES = [
  { pattern: /\/admin\/stats$/, data: adminStats },
  { pattern: /\/admin\/orders$/, data: orders },
  { pattern: /\/admin\/orders\/[^/]+\/status$/, data: { success: true } },
  { pattern: /\/admin\/orders\/[^/]+\/cancel$/, data: { success: true } },
  { pattern: /\/admin\/orders\/[^/]+\/reassign$/, data: { success: true } },
  { pattern: /\/admin\/drivers\/[^/]+$/, data: () => drivers[0] }, // driver detail
  { pattern: /\/admin\/drivers$/, data: drivers },
  { pattern: /\/admin\/restaurants\/[^/]+\/toggle$/, data: { success: true } },
  {
    pattern: /\/admin\/restaurants\/[^/]+\/analytics$/,
    data: () => ({
      name: 'Spice Garden',
      ordersByDay: Array.from({ length: 30 }, (_, i) => ({ date: days(29 - i), count: 3 + Math.floor(Math.random() * 12) })),
      topItems: topItems.slice(0, 5),
      reviews: [
        { user_name: 'Aarohi D.', rating: 5, comment: 'Amazing food and fast delivery!' },
        { user_name: 'Rushikesh Z.', rating: 4, comment: 'Good taste but packaging could be better.' },
        { user_name: 'Priya M.', rating: 5, comment: 'Best biryani in town!' },
      ],
    }),
  },
  { pattern: /\/admin\/restaurants$/, data: restaurants },
  { pattern: /\/admin\/users\/[^/]+$/, data: () => users[0] }, // user detail
  { pattern: /\/admin\/users$/, data: users },
  { pattern: /\/admin\/finance\/overview$/, data: financeOverview },
  { pattern: /\/admin\/finance\/transactions$/, data: transactions },
  { pattern: /\/admin\/analytics\/revenue$/, data: revenueAnalytics },
  { pattern: /\/admin\/analytics\/orders$/, data: orderAnalytics },
  { pattern: /\/admin\/analytics\/top-items$/, data: topItems },
  { pattern: /\/admin\/promos\/[^/]+\/toggle$/, data: { success: true } },
  { pattern: /\/admin\/promos\/[^/]+$/, data: { success: true } },
  { pattern: /\/admin\/promos$/, data: promos },
  {
    pattern: /\/auth\/login$/,
    data: (config) => {
      let email = 'admin@quickbite.com';
      try {
        if (config && config.data) {
          const body = JSON.parse(config.data);
          if (body.email) email = body.email;
        }
      } catch (e) {}

      let role = 'admin';
      let name = 'Admin User';
      
      if (email.includes('driver')) {
        role = 'driver';
        name = 'Sunil Kumar';
      } else if (email.includes('owner') || email.includes('restaurant')) {
        role = 'restaurant';
        name = 'Spice Garden Owner';
      } else if (email.includes('rahul') || email.includes('customer') || !email.includes('admin')) {
        role = 'customer';
        name = 'Rahul Sharma';
      }

      return {
        token: `mock-token-${role}-${Date.now()}`,
        user: {
          id: uuid(999),
          name,
          email,
          role,
        }
      };
    }
  },
  {
    pattern: /\/auth\/register$/,
    data: (config) => {
      let name = 'New User';
      let email = 'user@quickbite.com';
      let role = 'customer';
      try {
        if (config && config.data) {
          const body = JSON.parse(config.data);
          if (body.name) name = body.name;
          if (body.email) email = body.email;
          if (body.role) role = body.role;
        }
      } catch (e) {}

      return {
        token: `mock-token-${role}-${Date.now()}`,
        user: {
          id: uuid(888),
          name,
          email,
          role,
        }
      };
    }
  },
  { pattern: /\/auth\/me$/, data: { id: uuid(999), name: 'Admin User', email: 'admin@quickbite.com', role: 'admin' } },
];

/**
 * Find mock data for a given API request URL
 * @param {string} url - The request URL path
 * @param {object} config - The request config containing parameters/data
 * @returns {{ data: any } | null} - Mock response or null if no match
 */
export function getMockResponse(url, config) {
  for (const route of MOCK_ROUTES) {
    if (route.pattern.test(url)) {
      const data = typeof route.data === 'function' ? route.data(config) : route.data;
      return { data };
    }
  }
  return null;
}

export default MOCK_ROUTES;
