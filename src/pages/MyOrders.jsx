import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, MessageSquare } from 'lucide-react';
import { OrderStatusBadge, LoadingSpinner } from '../components';
import useOrderStore from '../stores/orderStore';
import useToastStore from '../stores/toastStore';
import './MyOrders.css';

export default function MyOrders() {
  const { orders, fetchMyOrders, loading } = useOrderStore();
  const toast = useToastStore();
  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { submitReview } = useOrderStore();

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    try {
      await submitReview(reviewModal.id, rating, comment);
      setReviewModal(null);
      toast.success('Review submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit review');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="orders-page container">
      <div className="page-header">
        <h1>My Orders</h1>
        <p className="subtitle">View your past and current orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <Package size={64} className="text-muted" />
          <h3>No orders yet</h3>
          <p>You haven't placed any orders yet. Start exploring restaurants!</p>
          <Link to="/restaurants" className="btn btn-primary mt-4">Find Food</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="oc-header">
                <div className="oc-restaurant">
                  <div className="oc-restaurant-img">
                    <img src={order.restaurant_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'} alt={order.restaurant_name} />
                  </div>
                  <div>
                    <h3 className="oc-restaurant-name">{order.restaurant_name}</h3>
                    <p className="oc-date">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="oc-body">
                <div className="oc-items">
                  {order.items?.map((item, i) => (
                    <span key={item.id}>
                      {item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                <div className="oc-total">
                  Total: <strong>₹{order.total_amount}</strong>
                </div>
              </div>

              <div className="oc-footer">
                <div className="oc-actions">
                  {order.status === 'delivered' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setReviewModal(order)}>
                      <MessageSquare size={14} /> Review
                    </button>
                  )}
                  <Link to={`/tracking/${order.id}`} className="btn btn-primary btn-sm">
                    View Details <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Rate your order from {reviewModal.restaurant_name}</h2>
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="form-group">
                <label>Rating (1-5)</label>
                <div className="rating-select">
                  {[1,2,3,4,5].map(num => (
                    <button 
                      type="button" 
                      key={num} 
                      className={`star-btn ${rating >= num ? 'active' : ''}`}
                      onClick={() => setRating(num)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment (optional)</label>
                <textarea 
                  className="input-field" 
                  rows="3"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="How was the food?"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setReviewModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
