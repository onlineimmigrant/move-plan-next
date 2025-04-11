'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Privacy from '../../components/Privacy';
import Terms from '../../components/Terms';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Access setSession from AuthContext
  const { setSession } = useAuth();
  const router = useRouter();

  // State for Privacy/Terms modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // Attempt sign in with Supabase
      const { data, error: supaError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supaError) {
        throw new Error(supaError.message);
      }

      // If we get a valid session, store it in AuthContext
      if (data.session) {
        setSession(data.session);
        router.push('/'); // Navigate to the homepage
      } else {
        setError('No session data returned. Login failed.');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError('Login failed. Please check your email and password.');
    }
  };

  const handleRegister = () => {
    router.push('/register'); // Navigate to the register page
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side: Gradient background (hidden on mobile) */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-green-400 to-green-700 items-center justify-center">
        <div className="text-white text-center">
          <h1 className="tracking-widest text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-green-200 via-green-300 to-white bg-clip-text text-transparent">
            Welcome <br />to Let Spring
          </h1>
          <p className="mt-4 text-2xl font-semibold tracking-wide text-amber-300">
            Start your relocation journey with ease.
          </p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
        <div className="w-full max-w-sm p-6 bg-transparent rounded-lg">
          <h1 className="my-8 text-center tracking-tight text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-green-700 via-green-500 to-green-700 bg-clip-text text-transparent">
            Let Spring
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mt-16 space-y-4">
              <button
                type="submit"
                className="text-xl w-full px-4 py-4 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
              >
                Login
              </button>
              <button
                type="button"
                onClick={handleRegister}
                className="text-xl w-full px-4 py-4 bg-amber-300 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold mt-2"
              >
                Register
              </button>
            </div>

            {/* Privacy and Terms Links */}
            <div className="mt-4 flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-sm text-gray-600 hover:text-green-600 focus:outline-none"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="text-sm text-gray-600 hover:text-green-600 focus:outline-none"
              >
                Terms
              </button>
            </div>
          </form>

          {/* Privacy / Terms modals */}
          <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </div>
      </div>
    </div>
  );
}