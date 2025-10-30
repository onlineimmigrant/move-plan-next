/**
 * Example Usage: LoginModal and RegisterModal Integration
 * 
 * This file demonstrates how to use LoginModal and RegisterModal together
 * with seamless switching between them.
 * 
 * Copy this code into your component where you need modal authentication.
 */

'use client';

import { useState } from 'react';
import { LoginModal, RegisterModal } from '@/components/LoginRegistration';

export default function AuthModalsExample() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSwitchToRegister = () => {
    console.log('Switching to register modal');
    setIsLoginOpen(false);
    // Small delay to allow login modal close animation
    setTimeout(() => setIsRegisterOpen(true), 300);
  };

  const handleSwitchToLogin = () => {
    console.log('Switching to login modal');
    setIsRegisterOpen(false);
    // Small delay to allow register modal close animation
    setTimeout(() => setIsLoginOpen(true), 300);
  };

  return (
    <div>
      {/* Your trigger buttons */}
      <button 
        onClick={() => setIsLoginOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Open Login Modal
      </button>
      
      <button 
        onClick={() => setIsRegisterOpen(true)}
        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Open Register Modal
      </button>

      {/* Modals with switching capability */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
}
