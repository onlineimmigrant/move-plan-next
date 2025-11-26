/**
 * NavigationButtons - Back/Next buttons for stepped forms
 */

'use client';

import React from 'react';
import Button from '@/ui/Button';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  designStyle: 'large' | 'compact';
  onPrevious: () => void;
  onNext: () => void;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  designStyle,
  onPrevious,
  onNext,
}: NavigationButtonsProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex justify-between items-center mt-12">
      <Button
        variant="outline"
        size={designStyle === 'compact' ? 'sm' : 'lg'}
        onClick={onPrevious}
        disabled={isFirstStep}
        className={
          designStyle === 'compact' ? 'text-base px-4 h-10 rounded-lg' : 'text-xl px-12 h-16 rounded-xl'
        }
      >
        ← Back
      </Button>
      <Button
        size={designStyle === 'compact' ? 'sm' : 'lg'}
        onClick={onNext}
        disabled={isLastStep}
        className={
          designStyle === 'compact' ? 'text-base px-4 h-10 rounded-lg' : 'text-xl px-12 h-16 rounded-xl'
        }
      >
        {isLastStep ? 'Submit' : 'Next'} →
      </Button>
    </div>
  );
}
