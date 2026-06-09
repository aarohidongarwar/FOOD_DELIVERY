import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '../stores/toastStore';
import './Toast.css';

const icons = {
  success: <CheckCircle size={22} />,
  error: <XCircle size={22} />,
  warning: <AlertTriangle size={22} />,
  info: <Info size={22} />,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon">{icons[toast.type] || icons.info}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
