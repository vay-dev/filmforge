import './styles/LikeButton.scss';

interface Props {
  liked: boolean;
  onClick: () => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export default function LikeButton({ liked, onClick, disabled = false, showLabel = true }: Props) {
  return (
    <button
      className={`like-btn${liked ? ' like-btn--liked' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
    >
      <div className="like-btn__particles" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>
      <svg className="like-btn__heart" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showLabel && <span>{liked ? 'Liked' : 'Like'}</span>}
    </button>
  );
}
