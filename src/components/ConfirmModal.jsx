import useConfirmStore from '../stores/confirmStore';
import './ConfirmModal.css';

export default function ConfirmModal() {
  const { isOpen, title, message, confirmText, cancelText, variant, onConfirm, onCancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`confirm-btn ${variant === 'danger' ? 'confirm-btn-danger' : 'confirm-btn-confirm'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
