import React from 'react';
import { navigate } from '../utils/router';

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  replace?: boolean;
  // Painting modal this link is opened on top of (see NavState.under).
  under?: string;
}

// A real <a href> so links can be middle-clicked, copied and crawled;
// plain left-clicks are handled in-app without a page reload.
export const Link: React.FC<LinkProps> = ({ to, replace, under, onClick, target, children, ...rest }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
      (target && target !== '_self')
    ) {
      return;
    }
    e.preventDefault();
    navigate(to, { replace, under });
  };

  return (
    <a href={to} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
