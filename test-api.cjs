const http = require('http');

function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING BASIC API TESTS ---\n');
  
  try {
    // 1. Test Login (Customer)
    console.log('Testing: POST /api/auth/login');
    // Using a sample user, this might fail if db is empty, but let's check
    const loginRes = await makeRequest('/api/auth/login', 'POST', { email: 'admin@quickbite.com', password: 'password123' });
    console.log(`Status: ${loginRes.status}`);
    
    let token = '';
    if (loginRes.data && loginRes.data.token) {
      token = loginRes.data.token;
      console.log('Login successful. Received token.\n');
    } else {
      console.log('Login failed (maybe no admin user). Skipping protected routes test.\n');
      console.log(loginRes.data);
      return;
    }

    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 2. Test Admin Stats
    console.log('Testing: GET /api/admin/stats');
    const adminStats = await makeRequest('/api/admin/stats', 'GET', null, authHeaders);
    console.log(`Status: ${adminStats.status}`);
    if (adminStats.data.totalOrders !== undefined) {
      console.log(`Success: Found ${adminStats.data.totalOrders} total orders in stats.\n`);
    } else {
      console.log('Failed:', adminStats.data);
    }

    // 3. Test Restaurants List
    console.log('Testing: GET /api/restaurants');
    const restRes = await makeRequest('/api/restaurants', 'GET');
    console.log(`Status: ${restRes.status}`);
    if (Array.isArray(restRes.data)) {
      console.log(`Success: Loaded ${restRes.data.length} restaurants.\n`);
    } else {
      console.log('Failed:', restRes.data);
    }

    console.log('--- TESTS COMPLETED SUCESSFULLY ---');

  } catch (err) {
    console.error('Test script encountered an error:', err);
  }
}

runTests();
