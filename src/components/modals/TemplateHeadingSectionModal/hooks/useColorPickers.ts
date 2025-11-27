/**
 * useColorPickers Hook
 * 
 * Manages all color picker dropdowns states for TemplateHeadingSection
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
    buttonTextColor: false,
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
      buttonTextColor: false,
    });
  };

  return {
    openColorPickers,
    toggleColorPicker,
    closeAllColorPickers,
  };
}
