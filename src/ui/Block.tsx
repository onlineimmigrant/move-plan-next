'use client';

import React from 'react';

interface BlockProps {
  variant?: 'default' | 'primary' | 'secondary';
  background?: string;
  children?: React.ReactNode;
}

const Block: React.FC<BlockProps> = ({ variant = 'default', background, children }) => {
  const baseStyles = 'w-full min-h-[50vh]';
  const variantStyles: { [key: string]: string } = {
    default: 'py-12 bg-white',
    primary: 'py-16 bg-gray-700',
    secondary: 'py-12 bg-gray-100',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]}`}
      style={background ? { backgroundImage: background } : {}}
    >
      <div className="max-w-7xl mx-auto">
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement, {
                className: `${
                  child.props.className || ''
                } ${getTextStyles(child.type, variant)}`,
              })
            : child
        )}
      </div>
    </div>
  );
};

// Define text sizes for nested elements based on variant
const getTextStyles = (type: any, variant: string): string => {
  const textStyles: { [key: string]: { [key: string]: string } } = {
    h1: {
      default: 'text-3xl font-bold',
      primary: 'text-4xl md:text-5xl font-bold text-white',
      secondary: 'text-3xl font-semibold',
    },
    h2: {
      default: 'text-center my-8 sm:text-3xl text-2xl font-bold',
      primary: 'text-3xl font-semibold text-white',
      secondary: 'text-2xl font-semibold',
    },
    h3: { default: 'text-xl font-medium', primary: 'text-2xl font-medium text-white', secondary: 'text-xl font-medium' },
    h4: { default: 'text-lg font-medium', primary: 'text-xl font-medium text-white', secondary: 'text-lg font-medium' },
    div: { default: '', primary: 'text-white', secondary: '' },
    p: { default: 'text-base text-gray-600', primary: 'text-lg text-white', secondary: 'text-base text-gray-600' },
    span: { default: 'text-base', primary: 'text-base text-white', secondary: 'text-base' },
  };
  return textStyles[type]?.[variant] || '';
};

export default Block;