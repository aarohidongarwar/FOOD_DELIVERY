# QuickBite - Food Delivery Platform

QuickBite is a comprehensive food delivery platform featuring four distinct portals:
1. **Customer App:** Browse restaurants, place orders, real-time tracking, wallet payments.
2. **Restaurant Dashboard:** Accept/reject orders, manage menu items, view analytics.
3. **Driver App:** Receive delivery requests, navigate to pickup/drop-off, update status.
4. **Admin Portal:** Manage users, restaurants, promotions, and system-wide analytics.

## Tech Stack
- **Frontend:** React, Vite, Zustand (State Management), React Router
- **Backend:** Node.js, Express, Socket.IO (Real-time tracking)
- **Database:** MySQL

## Prerequisites
- Node.js (v18 or higher)
- MySQL Server (v8.0 or higher)

## Setup Instructions

### 1. Database Setup
1. Create a MySQL database named `quickbite_db`.
2. Run the SQL schema to create tables (can be imported from `server/schema.sql`).

### 2. Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your actual database credentials and a secure JWT secret:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=quickbite_db
   DB_PORT=3306

   JWT_SECRET=your_secure_random_string
   PORT=3001
   ```

### 3. Install Dependencies
Install packages for both frontend and backend (they share the root `package.json`):
```bash
npm install
```

### 4. Start the Application
Run the development server (starts both Vite frontend and Express backend concurrently):
```bash
npm run dev
```
- Frontend will run on: `http://localhost:5173`
- Backend API will run on: `http://localhost:3001`

## Default Seed Accounts
For testing, use the following roles if you have seeded your database:
- **Admin:** (Register manually via DB, or change user role to 'admin')
- **Customer:** (Register normally through the app)
- **Restaurant Owner:** (Register via `/register-restaurant`)
- **Driver:** (Register via `/rider/register`)

## Project Structure
- `src/` - React frontend code
  - `components/` - Reusable UI components
  - `pages/` - Page-level components
  - `stores/` - Zustand state stores
- `server/` - Node.js/Express backend
  - `routes/` - API endpoints
  - `middleware/` - Auth and role verification
  - `index.js` - Express & Socket.IO entry point
- `data/` - Static assets and legacy data

## Real-time Features
- Order status updates are pushed instantly via Socket.IO
- Drivers emit live location updates via `driver-location`
- Customers can see drivers approach on the map in real-time

## Security Highlights
- Password hashing with `bcryptjs`
- JWT authentication
- Route-level and database-level ownership checks (IDOR prevention)
- Secure handling of `.env` configurations
