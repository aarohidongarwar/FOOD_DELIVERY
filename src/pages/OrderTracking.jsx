import { useEffect, useState, Component } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { Clock, MapPin, Phone, ChefHat, CheckCircle, Bike, Check } from 'lucide-react';
import { OrderStatusBadge, LoadingSpinner } from '../components';
import useOrderStore from '../stores/orderStore';
import { fetchOSRMRoute } from '../utils/osrm';
import 'leaflet/dist/leaflet.css';
import './OrderTracking.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Driver icon
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830312.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

function MapUpdater({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 14);
    }
  }, [lat, lon, map]);
  return null;
}

function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20}}><h1>Something went wrong.</h1><pre>{this.state.error.toString()}</pre></div>;
    }
    return this.props.children;
  }
}


export default function OrderTracking() {
  const { id } = useParams();
  const { currentOrder, fetchOrder, loading, error } = useOrderStore();
  const [driverLocation, setDriverLocation] = useState(null);
  const [approachAlert, setApproachAlert] = useState(false);
  const [osrmRoute, setOsrmRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    fetchOrder(id);
  }, [id, fetchOrder]);

  useEffect(() => {
    if (!currentOrder) return;

    const socket = io('/', { path: '/socket.io' });
    
    socket.emit('join-order', id);

    socket.on('order-status-update', (data) => {
      if (data.orderId === id) {
        fetchOrder(id);
      }
    });

    socket.on('driver-location-update', (data) => {
      if (data.orderId === id) {
        setDriverLocation({ lat: data.lat, lon: data.lon });
      }
    });

    socket.on('driver-approaching-customer', (data) => {
      if (data.orderId === id) {
        setApproachAlert(true);
      }
    });

    return () => socket.disconnect();
  }, [id, currentOrder, fetchOrder]);

  useEffect(() => {
    if (!currentOrder || !driverLocation) return;
    
    // Determine destination based on status
    const isDelivery = currentOrder.status === 'out_for_delivery';
    const destLat = parseFloat(isDelivery ? (currentOrder.delivery_lat || currentOrder.customer_lat) : currentOrder.restaurant_lat) || (isDelivery ? 21.14 : 21.1458);
    const destLon = parseFloat(isDelivery ? (currentOrder.delivery_lon || currentOrder.customer_lon) : currentOrder.restaurant_lon) || (isDelivery ? 79.08 : 79.0882);

    // Fetch route only if we don't have one, or if destination changed
    fetchOSRMRoute([driverLocation.lat, driverLocation.lon], [destLat, destLon])
      .then(routeData => {
        if (routeData) {
          setOsrmRoute(routeData.coordinates);
          setRouteInfo({ distance: routeData.distance, duration: routeData.duration });
        }
      });
  }, [driverLocation?.lat, driverLocation?.lon, currentOrder?.status]); // Re-fetch only when necessary

  if (!currentOrder && loading) return (
    <div className="tracking-page container" style={{paddingTop: 80, textAlign: 'center'}}>
      <LoadingSpinner />
      <p style={{marginTop: 16, color: 'var(--text-secondary)'}}>Loading order details...</p>
    </div>
  );

  if (!currentOrder && error) return (
    <div className="tracking-page container" style={{paddingTop: 80, textAlign: 'center'}}>
      <h2>Failed to load order</h2>
      <p style={{color: 'var(--text-secondary)', margin: '12px 0'}}>{error}</p>
      <button className="btn btn-primary" onClick={() => fetchOrder(id)}>Try Again</button>
      <br/><br/>
      <Link to="/orders" className="btn btn-secondary">View My Orders</Link>
    </div>
  );

  if (!currentOrder) return (
    <div className="tracking-page container" style={{paddingTop: 80, textAlign: 'center'}}>
      <h2>Order not found</h2>
      <p style={{color: 'var(--text-secondary)', margin: '12px 0'}}>This order could not be loaded.</p>
      <Link to="/orders" className="btn btn-primary">View My Orders</Link>
    </div>
  );

  const { status, restaurant_name, restaurant_lat, restaurant_lon, delivery_address, total_amount, items, driver, delivery_otp } = currentOrder;

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: <CheckCircle size={20} /> },
    { key: 'accepted', label: 'Restaurant Accepted', icon: <CheckCircle size={20} /> },
    { key: 'preparing', label: 'Preparing Food', icon: <ChefHat size={20} /> },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: <Bike size={20} /> },
    { key: 'delivered', label: 'Delivered', icon: <Check size={20} /> },
  ];

  let effectiveStatus = status;
  if (status === 'ready_for_pickup' || status === 'driver_assigned') effectiveStatus = 'preparing';
  
  const currentStepIndex = steps.findIndex(s => s.key === effectiveStatus);
  
  const destLat = status === 'out_for_delivery' ? (currentOrder.delivery_lat || currentOrder.customer_lat) : restaurant_lat;
  const destLon = status === 'out_for_delivery' ? (currentOrder.delivery_lon || currentOrder.customer_lon) : restaurant_lon;

  const bounds = [];
  if (driverLocation && driverLocation.lat && driverLocation.lon) {
    bounds.push([Number(driverLocation.lat), Number(driverLocation.lon)]);
  }
  if (destLat && destLon) {
    bounds.push([Number(destLat), Number(destLon)]);
  }

  const mapCenter = (driverLocation && driverLocation.lat && driverLocation.lon)
    ? [Number(driverLocation.lat), Number(driverLocation.lon)] 
    : (restaurant_lat && restaurant_lon ? [Number(restaurant_lat), Number(restaurant_lon)] : [19.0760, 72.8777]);

  return (
    <ErrorBoundary>
    <div className="tracking-page container">
      <div className="tp-header">
        <h1>Track Order</h1>
        <p>Order #{id.slice(0,8).toUpperCase()}</p>
      </div>

      {approachAlert && (
        <div style={{
          backgroundColor: '#4caf50', color: 'white', padding: '15px', 
          borderRadius: '8px', marginBottom: '20px', display: 'flex', 
          alignItems: 'center', gap: '10px', fontWeight: 'bold'
        }}>
          <Bike size={24} />
          Your driver is less than 50 meters away! Please be ready to collect your order.
        </div>
      )}

      <div className="tp-layout">
        <div className="tp-main">
          {status === 'cancelled' ? (
            <div className="tp-cancelled">
              <div className="tp-cancelled-icon">❌</div>
              <h2>Order Cancelled</h2>
              <p>This order has been cancelled. If you have been charged, refund will be initiated.</p>
              <Link to="/" className="btn btn-primary mt-4">Back to Home</Link>
            </div>
          ) : (
            <>
              {/* Stepper */}
              <div className="tp-stepper-card">
                <div className="tp-eta">
                  <Clock size={24} className="text-primary" />
                  <div>
                    <span className="tp-eta-label">Estimated Delivery</span>
                    <span className="tp-eta-time">{status === 'delivered' ? 'Arrived' : '30-45 mins'}</span>
                  </div>
                </div>

                <div className="tp-steps">
                  {steps.map((step, index) => {
                    const isCompleted = currentStepIndex >= index;
                    const isCurrent = currentStepIndex === index;
                    
                    return (
                      <div key={step.key} className={`tp-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="tp-step-icon">{step.icon}</div>
                        <div className="tp-step-content">
                          <p className="tp-step-label">{step.label}</p>
                          {isCurrent && <p className="tp-step-desc">Your order is currently at this stage</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery OTP Display */}
              {status === 'out_for_delivery' && delivery_otp && (
                <div style={{ background: 'var(--ph-orange-bg)', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px dashed var(--ph-orange)' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--ph-orange)' }}>Delivery PIN</p>
                  <h2 style={{ letterSpacing: '8px', margin: 0, color: 'var(--ph-orange)', fontSize: '2rem' }}>{delivery_otp}</h2>
                  <p style={{ fontSize: '0.9rem', margin: '8px 0 0 0', color: 'var(--ph-text-muted)' }}>Share this 6-digit PIN with the delivery partner.</p>
                </div>
              )}

              {/* Driver Info */}
              {driver && status !== 'delivered' && (
                <div className="tp-driver-card">
                  <div className="tp-driver-info">
                    <div className="tp-driver-avatar">{driver.name?.charAt(0) || 'D'}</div>
                    <div>
                      <p className="tp-driver-name">{driver.name}</p>
                      <p className="tp-driver-rating">★ {driver.rating ? Number(driver.rating).toFixed(1) : '5.0'} (Delivery Partner)</p>
                      {(status === 'driver_assigned' || status === 'ready_for_pickup') && (
                        <p style={{fontSize: '0.8rem', color: 'var(--ph-orange)', margin: '4px 0 0 0'}}>Driver is heading to the restaurant</p>
                      )}
                    </div>
                  </div>
                  <a href={`tel:${driver.phone}`} className="btn btn-secondary btn-icon">
                    <Phone size={20} />
                  </a>
                </div>
              )}

              {/* Map */}
              {(restaurant_lat || driverLocation) && (
                <div className="tp-map-card" style={{position: 'relative'}}>
                  {/* Swiggy Style Info Panel */}
                  {routeInfo && status !== 'delivered' && (
                    <div className="osrm-info-panel scale-in">
                      <div className="osrm-info-item">
                        <span className="osrm-info-label">ETA</span>
                        <span className="osrm-info-value">{Math.round(routeInfo.duration / 60)} min</span>
                      </div>
                      <div className="osrm-info-divider"></div>
                      <div className="osrm-info-item">
                        <span className="osrm-info-label">Distance</span>
                        <span className="osrm-info-value">{(routeInfo.distance / 1000).toFixed(1)} km</span>
                      </div>
                    </div>
                  )}

                  <MapContainer center={mapCenter} zoom={14} className="tp-map" zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    {driverLocation && driverLocation.lat && driverLocation.lon && (
                      <Marker position={[Number(driverLocation.lat), Number(driverLocation.lon)]} icon={driverIcon}>
                        <Popup>Driver is here</Popup>
                      </Marker>
                    )}
                    {restaurant_lat && restaurant_lon && status !== 'out_for_delivery' && (
                      <Marker position={[Number(restaurant_lat), Number(restaurant_lon)]} icon={restaurantIcon}>
                        <Popup>{restaurant_name}</Popup>
                      </Marker>
                    )}
                    {destLat && destLon && status === 'out_for_delivery' && (
                      <Marker position={[Number(destLat), Number(destLon)]} icon={restaurantIcon}>
                        <Popup>Delivery Address</Popup>
                      </Marker>
                    )}
                    
                    {/* Modern OSRM Polyline or Fallback */}
                    {osrmRoute && osrmRoute.length > 1 ? (
                      <>
                        <Polyline positions={osrmRoute} color="#1E293B" weight={6} opacity={0.3} lineJoin="round" lineCap="round" />
                        <Polyline positions={osrmRoute} color={status === 'out_for_delivery' ? "#10B981" : "#F59E0B"} weight={4} opacity={1} lineJoin="round" lineCap="round" />
                        <MapBoundsUpdater bounds={osrmRoute} />
                      </>
                    ) : bounds.length > 1 ? (
                      <>
                        <Polyline positions={bounds} color={status === 'out_for_delivery' ? "#10B981" : "#F59E0B"} weight={5} opacity={0.7} dashArray="10, 10" />
                        <MapBoundsUpdater bounds={bounds} />
                      </>
                    ) : (
                      <MapUpdater lat={mapCenter[0]} lon={mapCenter[1]} />
                    )}
                  </MapContainer>
                </div>
              )}
            </>
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="tp-sidebar">
          <div className="tp-details-card">
            <h3>Order Details</h3>
            <div className="tp-restaurant-name">
              <MapPin size={16} />
              <span>{restaurant_name}</span>
            </div>
            
            <div className="tp-items">
              {items?.map(item => (
                <div key={item.id} className="tp-item">
                  <span className="tp-item-qty">{item.quantity}x</span>
                  <span className="tp-item-name">{item.name}</span>
                  <span className="tp-item-price">₹{item.total_price || (item.base_price * item.quantity) || (item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="tp-bill">
              <div className="tp-bill-row total">
                <span>Total Amount</span>
                <span>₹{total_amount}</span>
              </div>
            </div>

            {/* Phase 3: Payment Info Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600',
                backgroundColor: currentOrder.payment_method === 'COD' ? '#FFF7ED' : '#F0FDF4',
                color: currentOrder.payment_method === 'COD' ? '#C2410C' : '#15803D',
                border: `1px solid ${currentOrder.payment_method === 'COD' ? '#FDBA74' : '#86EFAC'}`
              }}>
                {currentOrder.payment_method === 'COD' ? '💵 Cash on Delivery' : '💳 Online Payment'}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600',
                backgroundColor: currentOrder.payment_status === 'paid' ? '#F0FDF4' : '#FFFBEB',
                color: currentOrder.payment_status === 'paid' ? '#15803D' : '#B45309',
                border: `1px solid ${currentOrder.payment_status === 'paid' ? '#86EFAC' : '#FCD34D'}`
              }}>
                {currentOrder.payment_status === 'paid' ? '✅ Paid' : '⏳ Payment Pending'}
              </span>
            </div>

            <div className="tp-address">
              <h4>Delivery Address</h4>
              <p>{delivery_address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
