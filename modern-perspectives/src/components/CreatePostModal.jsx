import CreatePost from './CreatePost';

export default function CreatePostModal({ open, onClose, onPostCreated }) {
  if (!open) return null;

  const handleCreated = (post) => {
    onPostCreated?.(post);
    onClose();
  };

  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <CreatePost onPostCreated={handleCreated} />
      </div>
    </div>
  );
}
