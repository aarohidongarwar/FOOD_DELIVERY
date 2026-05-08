import './LoadingSpinner.css';

export default function LoadingSpinner({ fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );
}
