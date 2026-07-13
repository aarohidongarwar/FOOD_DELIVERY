import { useEffect, useState, Component, lazy, Suspense } from 'react'
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
import { Navbar, Footer, CartDrawer, ProtectedRoute, SplashScreen, ScrollToTop, LocationPopup, LoadingSpinner, GlobalSocket } from './components'
import ToastContainer from './components/Toast'
import ConfirmModal from './components/ConfirmModal'
import useLocationStore from './stores/locationStore'

// Pages
const Home = lazy(() => import('./pages/Home'));
const Restaurants = lazy(() => import('./pages/Restaurants'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPortal = lazy(() => import('./pages/admin/AdminPortal'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const PartnershipType = lazy(() => import('./pages/PartnershipType'));
const RestaurantRegistration = lazy(() => import('./pages/RestaurantRegistration'));
const GroceryRegistration = lazy(() => import('./pages/GroceryRegistration'));
const RiderLogin = lazy(() => import('./pages/RiderLogin'));
const RiderRegistration = lazy(() => import('./pages/RiderRegistration'));
const RestaurantDashboard = lazy(() => import('./pages/RestaurantDashboard'));
const GroceryDashboard = lazy(() => import('./pages/GroceryDashboard'));

// Routes where UI elements should be hidden
const HIDE_FOOTER_ROUTES = ['/login', '/onboarding', '/partnership-type', '/register-restaurant', '/register-grocery', '/rider/login', '/rider/register', '/driver', '/admin', '/restaurant-dashboard', '/grocery-dashboard'];
const MINIMAL_LAYOUT_ROUTES = ['/login', '/onboarding', '/partnership-type', '/rider/login', '/rider/register', '/register-restaurant', '/register-grocery', '/driver', '/admin', '/restaurant-dashboard', '/grocery-dashboard'];

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
        <Suspense fallback={<LoadingSpinner />}>
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

            {/* Grocery Vendor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['grocery']} />}> 
              <Route path="/grocery-dashboard" element={<GroceryDashboard />} />
            </Route>

          </Routes>
        </Suspense>
      </main>

      {!hideFooter && <Footer />}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ToastContainer />
      <ConfirmModal />
      <GlobalSocket />
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
