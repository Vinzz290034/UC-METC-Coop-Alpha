import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Find the main scrollable element and scroll to top
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo(0, 0);
    }
    // Also scroll window just in case
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
