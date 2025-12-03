
export function initializeAccessibility() {
  // Load high contrast mode
  const savedHighContrast = sessionStorage.getItem('highContrastMode');
  if (savedHighContrast === 'true') {
    document.body.classList.add('high-contrast');
  }

  // Load font size 
  const fontSizeMap = {
    small: 12,
    normal: 16,
    large: 20,
  };
  
  // Update CSS variables based on selected text size
  const updateCSSVariables = (baseSize) => {
    const root = document.documentElement;
    const multiplier = baseSize / 16; // 16px is the default base size
    
    // Update all CSS custom properties for text sizes
    root.style.setProperty('--text-xl', `${36 * multiplier}px`);
    root.style.setProperty('--text-xl-med', `${32 * multiplier}px`);
    root.style.setProperty('--text-lg', `${28 * multiplier}px`);
    root.style.setProperty('--text-lg-med', `${24 * multiplier}px`);
    root.style.setProperty('--text-med', `${20 * multiplier}px`);
    root.style.setProperty('--text-base-med', `${18 * multiplier}px`);
    root.style.setProperty('--text-base', `${16 * multiplier}px`);
    root.style.setProperty('--text-sm', `${14 * multiplier}px`);
    root.style.setProperty('--text-xs', `${12 * multiplier}px`);
  };
  
  const savedTextSize = sessionStorage.getItem('accessibilityTextSize');
  if (savedTextSize && ['small', 'normal', 'large'].includes(savedTextSize)) {
    // Use new text size preference
    const size = fontSizeMap[savedTextSize];
    document.documentElement.style.fontSize = `${size}px`;
    updateCSSVariables(size);
  } else {
    const savedFontSize = sessionStorage.getItem('accessibilityFontSize');
    if (savedFontSize) {
      const size = parseInt(savedFontSize, 10);
      if (size >= 12 && size <= 24) {
        document.documentElement.style.fontSize = `${size}px`;
        updateCSSVariables(size);
        if (size <= 13) {
          sessionStorage.setItem('accessibilityTextSize', 'small');
          const newSize = fontSizeMap.small;
          document.documentElement.style.fontSize = `${newSize}px`;
          updateCSSVariables(newSize);
        } else if (size <= 19) {
          sessionStorage.setItem('accessibilityTextSize', 'normal');
          const newSize = fontSizeMap.normal;
          document.documentElement.style.fontSize = `${newSize}px`;
          updateCSSVariables(newSize);
        } else {
          sessionStorage.setItem('accessibilityTextSize', 'large');
          const newSize = fontSizeMap.large;
          document.documentElement.style.fontSize = `${newSize}px`;
          updateCSSVariables(newSize);
        }
      }
    } else {
      const defaultSize = fontSizeMap.normal;
      document.documentElement.style.fontSize = `${defaultSize}px`;
      updateCSSVariables(defaultSize);
    }
  }
}

