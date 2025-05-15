import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="py-4 text-center">
    <p className="text-red-600 font-medium">{message}</p>
  </div>
);

export default ErrorMessage;