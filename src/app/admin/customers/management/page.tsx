'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Customer {
  user_id: string;
  stripe_customer_id: string;
}

export default function CustomerManagement() {
  const { session, supabase } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // Temporarily set to true
  const hasCheckedAdminStatus = useRef<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        console.error('Supabase client is undefined. Ensure AuthContext is properly configured.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role');

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('user_id, stripe_customer_id');

      if (profilesError || customersError) {
        console.error('Error fetching data:', profilesError || customersError);
      } else {
        setProfiles(profilesData || []);
        setCustomers(customersData || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const createCustomer = async (userId: string) => {
    if (!supabase) {
      console.error('Supabase client is undefined. Cannot create customer.');
      return;
    }
  
    setLoading(true);
    try {
      console.log('Calling /api/customers with userId:', userId);
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
  
      console.log('Response status from /api/customers:', response.status);
      if (response.status === 404) {
        console.error('Endpoint /api/customers not found.');
        alert('Error: Customer creation endpoint not found. Please check the API route setup.');
        setLoading(false);
        return;
      }
  
      const result = await response.json();
      if (response.ok) {
        setCustomers([...customers, { user_id: userId, stripe_customer_id: result.stripeCustomerId }]);
        alert('Customer created successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const syncExistingUsers = async () => {
    if (!supabase) {
      console.error('Supabase client is undefined. Cannot sync users.');
      return;
    }

    setSyncing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('/api/customers/sync-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        alert('Error: Sync existing users endpoint not found. Please check the API route setup.');
        setSyncing(false);
        return;
      }

      const result = await response.json();
      if (response.ok) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('user_id, stripe_customer_id');
        setCustomers(customersData || []);
        alert(result.message);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error syncing users:', error);
      alert('Failed to sync users. Please try again later.');
    } finally {
      setSyncing(false);
    }
  };

  if (!session) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Management</h1>

      {isAdmin && (
        <button
          onClick={syncExistingUsers}
          disabled={syncing}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {syncing ? 'Syncing...' : 'Sync All Existing Users'}
        </button>
      )}

      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Email</th>
            <th className="border p-2">Full Name</th>
            <th className="border p-2">Stripe Customer Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => {
            const customer = customers.find((c) => c.user_id === profile.id);
            return (
              <tr key={profile.id}>
                <td className="border p-2">{profile.email}</td>
                <td className="border p-2">{profile.full_name || '-'}</td>
                <td className="border p-2">
                  {customer ? `Created (${customer.stripe_customer_id})` : 'Not Created'}
                </td>
                <td className="border p-2">
                  {!customer && (
                    <button
                      onClick={() => createCustomer(profile.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
                    >
                      {loading ? 'Creating...' : 'Create Customer'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}