'use client';

import React from 'react';
import Image from 'next/image';

interface ImageProps {
  variant?: 'default' | 'thumbnail' | 'full';
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

const ImageComponent: React.FC<ImageProps> = ({ variant = 'default', src, alt, width = 600, height = 400 }) => {
  const variantStyles: { [key: string]: string } = {
    default: 'rounded',
    thumbnail: 'rounded-full w-24 h-24',
    full: 'w-full h-auto',
  };

  return (
    <Image
      src={src}
      alt={alt}
      width={variant === 'thumbnail' ? 96 : width}
      height={variant === 'thumbnail' ? 96 : height}
      className={variantStyles[variant]}
      loading="lazy"
    />
  );
};

export default ImageComponent;