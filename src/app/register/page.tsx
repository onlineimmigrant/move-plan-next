'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Privacy from '../../components/Privacy';
import Terms from '../../components/Terms';

// Define constants using Next.js environment variables
const DOMAIN_CUSTOM = process.env.NEXT_PUBLIC_DOMAIN_CUSTOM || 'http://localhost:3000';
const EMAIL_CONFIRM_REQUIRED = process.env.NEXT_PUBLIC_EMAIL_CONFIRM_REQUIRED === 'true';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Access setSession from AuthContext
  const { setSession } = useAuth();
  const router = useRouter();

  // State for Privacy/Terms modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const options = {
      data: { username },
      emailRedirectTo: `${DOMAIN_CUSTOM}/`, // Where to redirect after email confirmation
    };

    try {
      setError(null);

      // Attempt sign-up with Supabase
      const { data, error: supaError } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (supaError) {
        throw new Error(supaError.message);
      }

      // Insert a profile row if needed
      if (data?.user) {
        const userId = data.user.id;
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: userId, username, full_name: username });
        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('Failed to create user profile.');
        }
      }

      // If a session is returned immediately (no email confirm required), set it
      if (data.session) {
        setSession(data.session);
      }

      // If email confirmations are required, show a message
      if (EMAIL_CONFIRM_REQUIRED) {
        setError('Please check your email to confirm your account.');
      }

      // Navigate to login page
      router.push('/login');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleLogin = () => {
    router.push('/login');
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

      {/* Right side: Register form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
        <div className="w-full max-w-sm p-6 bg-transparent rounded-lg">
          <h1 className="my-8 text-center tracking-tight text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-green-700 via-green-500 to-green-700 bg-clip-text text-transparent">
            Let Spring
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleRegister}>
            <div className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="mt-16 space-y-4">
              <button
                type="submit"
                className="text-xl w-full px-4 py-4 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
              >
                Register
              </button>
              <button
                type="button"
                onClick={handleLogin}
                className="text-xl w-full px-4 py-4 bg-amber-300 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
              >
                Login
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