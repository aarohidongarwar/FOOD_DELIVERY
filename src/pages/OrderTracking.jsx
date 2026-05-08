import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { Clock, MapPin, Phone, ChefHat, CheckCircle, Bike, Check } from 'lucide-react';
import { OrderStatusBadge, LoadingSpinner } from '../components';
import useOrderStore from '../stores/orderStore';
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
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png',
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

export default function OrderTracking() {
  const { id } = useParams();
  const { currentOrder, fetchOrder } = useOrderStore();
  const [driverLocation, setDriverLocation] = useState(null);

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

    return () => socket.disconnect();
  }, [id, currentOrder, fetchOrder]);

  if (!currentOrder) return <LoadingSpinner fullScreen />;

  const { status, restaurant_name, restaurant_lat, restaurant_lon, delivery_address, total_amount, items, driver } = currentOrder;

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: <CheckCircle size={20} /> },
    { key: 'confirmed', label: 'Order Confirmed', icon: <CheckCircle size={20} /> },
    { key: 'preparing', label: 'Food is being prepared', icon: <ChefHat size={20} /> },
    { key: 'out_for_delivery', label: 'Out for delivery', icon: <Bike size={20} /> },
    { key: 'delivered', label: 'Delivered', icon: <Check size={20} /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === status);
  
  const mapCenter = driverLocation 
    ? [driverLocation.lat, driverLocation.lon] 
    : (restaurant_lat ? [restaurant_lat, restaurant_lon] : [19.0760, 72.8777]);

  return (
    <div className="tracking-page container">
      <div className="tp-header">
        <h1>Track Order</h1>
        <p>Order #{id.slice(0,8).toUpperCase()}</p>
      </div>

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

              {/* Driver Info */}
              {driver && status !== 'delivered' && (
                <div className="tp-driver-card">
                  <div className="tp-driver-info">
                    <div className="tp-driver-avatar">{driver.name.charAt(0)}</div>
                    <div>
                      <p className="tp-driver-name">{driver.name}</p>
                      <p className="tp-driver-rating">★ {driver.rating?.toFixed(1) || '5.0'} (Delivery Partner)</p>
                    </div>
                  </div>
                  <a href={`tel:${driver.phone}`} className="btn btn-secondary btn-icon">
                    <Phone size={20} />
                  </a>
                </div>
              )}

              {/* Map */}
              {(restaurant_lat || driverLocation) && (
                <div className="tp-map-card">
                  <MapContainer center={mapCenter} zoom={14} className="tp-map" zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    {driverLocation && (
                      <Marker position={[driverLocation.lat, driverLocation.lon]} icon={driverIcon}>
                        <Popup>Driver is here</Popup>
                      </Marker>
                    )}
                    {restaurant_lat && (
                      <Marker position={[restaurant_lat, restaurant_lon]} icon={restaurantIcon}>
                        <Popup>{restaurant_name}</Popup>
                      </Marker>
                    )}
                    <MapUpdater lat={mapCenter[0]} lon={mapCenter[1]} />
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
                  <span className="tp-item-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="tp-bill">
              <div className="tp-bill-row total">
                <span>Total Amount</span>
                <span>₹{total_amount}</span>
              </div>
            </div>

            <div className="tp-address">
              <h4>Delivery Address</h4>
              <p>{delivery_address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
