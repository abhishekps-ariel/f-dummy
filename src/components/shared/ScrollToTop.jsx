import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Function to scroll all possible containers to top
    const scrollToTop = () => {
      // Try multiple approaches to ensure scroll works
      if (window) {
        window.scrollTo(0, 0);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      // Try scrolling the main content container if it exists
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
        mainContent.scrollLeft = 0;
      }
    };

    // Scroll immediately
    scrollToTop();
    
    // Use multiple requestAnimationFrame calls
    requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(() => {
        scrollToTop();
      });
    });
    
    // Multiple delays to catch async content loading
    const timer1 = setTimeout(scrollToTop, 0);
    const timer2 = setTimeout(scrollToTop, 50);
    const timer3 = setTimeout(scrollToTop, 100);
    const timer4 = setTimeout(scrollToTop, 200);
    const timer5 = setTimeout(scrollToTop, 300);
    const timer6 = setTimeout(scrollToTop, 500);
    const timer7 = setTimeout(scrollToTop, 750);
    const timer8 = setTimeout(scrollToTop, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      clearTimeout(timer7);
      clearTimeout(timer8);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
