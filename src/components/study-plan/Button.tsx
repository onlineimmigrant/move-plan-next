// src/components/study-plan/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

const Button = ({ children, className = '', onClick, type = 'button', title, ...props }: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;