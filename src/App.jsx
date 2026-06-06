import { useEffect, useState, Component } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 20, background: '#fff', color: '#000', minHeight: '100vh'}}>
          <h1>Global App Crash</h1>
          <pre style={{color: 'red'}}>{this.state.error?.toString()}</pre>
          <pre>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import useAuthStore from './stores/authStore'

// Components
import { Navbar, Footer, CartDrawer, ProtectedRoute, SplashScreen, ScrollToTop, LocationPopup } from './components'
import useLocationStore from './stores/locationStore'

// Pages
import {
  Home,
  Restaurants,
  RestaurantDetail,
  Cart,
  OrderTracking,
  MyOrders,
  Login,
  Profile,
  AdminPortal,
  DriverDashboard,
  LandingPage,
  Onboarding,
  PartnershipType,
  RestaurantRegistration,
  GroceryRegistration,
  RiderLogin,
  RiderRegistration,
  RestaurantDashboard,
} from './pages';

// Routes where UI elements should be hidden
const HIDE_FOOTER_ROUTES = ['/login', '/onboarding', '/partnership-type', '/register-restaurant', '/register-grocery', '/rider/login', '/rider/register', '/driver', '/admin'];
const MINIMAL_LAYOUT_ROUTES = ['/login', '/rider/login', '/rider/register', '/register-restaurant', '/register-grocery', '/driver', '/admin'];

function AppLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const hideFooter = HIDE_FOOTER_ROUTES.includes(location.pathname);
  const isMinimal = MINIMAL_LAYOUT_ROUTES.includes(location.pathname);
  const { userLocation, setShowLocationPopup } = useLocationStore();

  useEffect(() => {
    // Show location popup automatically if not set, and we're not on a minimal/auth page
    if (!userLocation && !isMinimal && location.pathname !== '/') {
      const timer = setTimeout(() => setShowLocationPopup(true), 800);
      return () => clearTimeout(timer);
    }
  }, [userLocation, isMinimal, location.pathname, setShowLocationPopup]);

  return (
    <GlobalErrorBoundary>
      <ScrollToTop />
      <LocationPopup />
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/partnership-type" element={<PartnershipType />} />
          <Route path="/register-restaurant" element={<RestaurantRegistration />} />
          <Route path="/register-grocery" element={<GroceryRegistration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/rider/login" element={<RiderLogin />} />
          <Route path="/rider/register" element={<RiderRegistration />} />

          {/* Protected Routes (Any user) */}
          <Route element={<ProtectedRoute />}> 
            <Route path="/home" element={<Home />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail onCartClick={() => setIsCartOpen(true)} />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/tracking/:id" element={<OrderTracking />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}> 
            <Route path="/admin" element={<AdminPortal />} />
          </Route>

          {/* Driver Routes */}
          <Route element={<ProtectedRoute allowedRoles={['driver']} />}> 
            <Route path="/driver" element={<DriverDashboard />} />
          </Route>

          {/* Restaurant Partner Routes */}
          <Route element={<ProtectedRoute allowedRoles={['restaurant']} />}> 
            <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />

          </Route>
        </Routes>
      </main>

      {!hideFooter && <Footer />}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </GlobalErrorBoundary>
  );
}

function App() {
  const { fetchMe } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    fetchMe(); // Restore session on load

    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [fetchMe]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
