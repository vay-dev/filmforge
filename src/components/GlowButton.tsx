import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './styles/GlowButton.scss';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'gold' | 'blue' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

const HUE: Record<string, string> = {
  gold:   '45deg',
  blue:   '210deg',
  purple: '270deg',
};

export default function GlowButton({
  children,
  variant = 'gold',
  size = 'md',
  className = '',
  style,
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={`glow-btn glow-btn--${variant} glow-btn--${size} ${className}`}
      style={{ '--highlight-color-hue': HUE[variant], ...style } as React.CSSProperties}
      {...props}
    >
      <span className="glow-btn__icon" aria-hidden="true">✦</span>
      <span className="glow-btn__content">{children}</span>
    </button>
  );
}
