import './OrderStatusBadge.css';

export default function OrderStatusBadge({ status }) {
  const getStatusConfig = (s) => {
    switch (s) {
      case 'pending': return { label: 'Pending', className: 'badge-pending' };
      case 'confirmed': return { label: 'Confirmed', className: 'badge-confirmed' };
      case 'preparing': return { label: 'Preparing', className: 'badge-preparing' };
      case 'out_for_delivery': return { label: 'Out for Delivery', className: 'badge-delivering' };
      case 'delivered': return { label: 'Delivered', className: 'badge-delivered' };
      case 'cancelled': return { label: 'Cancelled', className: 'badge-cancelled' };
      default: return { label: s, className: '' };
    }
  };

  const { label, className } = getStatusConfig(status);

  return (
    <span className={`order-status-badge ${className}`}>
      {label}
    </span>
  );
}
