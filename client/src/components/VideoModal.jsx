export default function VideoModal({ src, title, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="video-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <span className="video-modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <video
          className="video-modal-player"
          src={src}
          controls
          autoPlay
          muted
          playsInline
        />
      </div>
    </div>
  );
}
