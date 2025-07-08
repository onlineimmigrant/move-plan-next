'use client';

import React from 'react';
import Image from 'next/image';

interface CardProps {
  variant?: 'default' | 'shadow' | 'outline';
  title?: string;
  imageSrc?: string;
  imageAlt?: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ variant = 'default', title, imageSrc, imageAlt, children }) => {
  const baseStyles = 'rounded-lg';
  const variantStyles: { [key: string]: string } = {
    default: 'p-4 bg-white',
    shadow: 'p-6 bg-white shadow-lg border border-gray-200',
    outline: 'p-4 bg-transparent border border-gray-500',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]}`}>
      {imageSrc && (
        <Image src={imageSrc} alt={imageAlt || ''} width={600} height={400} className="mb-4 rounded" />
      )}
      {title && <h3 className={getTextStyles('h3', variant)}>{title}</h3>}
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
  );
};

// Define text sizes for nested elements based on variant
const getTextStyles = (type: any, variant: string): string => {
  const textStyles: { [key: string]: { [key: string]: string } } = {
    h1: {
      default: 'text-3xl font-bold',
      shadow: 'text-3xl font-bold',
      outline: 'text-3xl font-bold text-gray-700',
    },
    h2: {
      default: 'text-2xl font-semibold',
      shadow: 'text-2xl font-semibold',
      outline: 'text-2xl font-semibold text-gray-700',
    },
    h3: {
      default: 'text-xl font-medium',
      shadow: 'text-xl font-medium',
      outline: 'text-xl font-medium text-gray-700',
    },
    h4: {
      default: 'text-lg font-medium',
      shadow: 'text-lg font-medium',
      outline: 'text-lg font-medium text-gray-700',
    },
    div: { default: 'my-8', shadow: 'my-8', outline: 'my-8 text-gray-700' },
    p: { default: 'my-2 text-base text-gray-600', shadow: 'my-2 text-base text-gray-600', outline: 'text-base text-gray-600' },
    span: { default: 'text-base', shadow: 'text-base', outline: 'text-base text-gray-700' },
  };
  return textStyles[type]?.[variant] || '';
};

export default Card;