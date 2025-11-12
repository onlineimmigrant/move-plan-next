/**
 * useColorPickers Hook
 * 
 * Manages all color picker dropdowns states
 */

import { useState } from 'react';

export function useColorPickers() {
  const [openColorPickers, setOpenColorPickers] = useState({
    titleColor: false,
    titleGradientFrom: false,
    titleGradientVia: false,
    titleGradientTo: false,
    descriptionColor: false,
    backgroundColor: false,
    backgroundGradientFrom: false,
    backgroundGradientVia: false,
    backgroundGradientTo: false,
    buttonColor: false,
    buttonGradientFrom: false,
    buttonGradientVia: false,
    buttonGradientTo: false,
  });

  const toggleColorPicker = (key: keyof typeof openColorPickers) => {
    setOpenColorPickers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const closeAllColorPickers = () => {
    setOpenColorPickers({
      titleColor: false,
      titleGradientFrom: false,
      titleGradientVia: false,
      titleGradientTo: false,
      descriptionColor: false,
      backgroundColor: false,
      backgroundGradientFrom: false,
      backgroundGradientVia: false,
      backgroundGradientTo: false,
      buttonColor: false,
      buttonGradientFrom: false,
      buttonGradientVia: false,
      buttonGradientTo: false,
    });
  };

  return {
    openColorPickers,
    toggleColorPicker,
    closeAllColorPickers,
  };
}
