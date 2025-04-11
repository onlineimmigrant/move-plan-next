// src/components/PostPage/CtaCard.tsx
'use client';

import React from 'react';
//import { getColorClass } from '@/components/TemplateSection'; // Reuse from TemplateSection

interface CtaCardProps {
  card: {
    has_shadow: boolean;
    is_gradient_background: boolean;
    background_color: string;
    button_background: string;
    text_color: string;
    title: string;
    description: string;
    url: string;
    button_text: string;
  };
}

const CtaCard: React.FC<CtaCardProps> = ({ card }) => (
  <div
    className={`p-6 rounded-lg ${card.has_shadow ? 'shadow' : ''} mb-4 ${
      card.is_gradient_background
        ? `bg-gradient-to-r from-${card.background_color} to-${card.button_background}`
        : `bg-${card.background_color}`
    } text-${card.text_color}`}
  >
    <h2 className="text-2xl font-semibold mb-4">{card.title}</h2>
    <p className="mb-6">{card.description}</p>
    <a
      href={card.url}
      className={`inline-block bg-${card.button_background} 
                  text-${card.background_color} font-semibold py-2 px-4 
                  rounded-full hover:bg-gray-100 transition-colors`}
    >
      {card.button_text}
    </a>
  </div>
);

export default CtaCard;