'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EquipmentPage({ params }: { params: { locale: string } }) {
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [maxHashrate, setMaxHashrate] = useState('');
  const [maxPower, setMaxPower] = useState('');
  const [efficiency, setEfficiency] = useState('');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setAuthError('You must be logged in to access this page');
        setIsAuthorized(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile) {
        setAuthError('Profile not found');
        setIsAuthorized(false);
        return;
      }

      // Allow both admin and superadmin roles
      if (profile.role !== 'admin' && profile.role !== 'superadmin') {
        setAuthError('Admin access required');
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      setAuthError('Authorization check failed');
      setIsAuthorized(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthorized) {
      alert('You are not authorized to perform this action');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();
        
      if (!profile || profile.role !== 'admin') {
        alert('Admin access required');
        return;
      }

      const { error } = await supabase.from('equipment_types').insert({
        name,
        manufacturer,
        max_hashrate: parseFloat(maxHashrate),
        max_power: parseFloat(maxPower),
        efficiency: parseFloat(efficiency),
        organization_id: profile.organization_id,
      });
      
      if (error) {
        console.error(error);
        alert('Failed to add equipment: ' + error.message);
      } else {
        alert('Equipment added successfully!');
        setName('');
        setManufacturer('');
        setMaxHashrate('');
        setMaxPower('');
        setEfficiency('');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('An error occurred while adding equipment');
    }
  };

  // Show loading state
  if (isAuthorized === null) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthorized) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L3.216 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500 mb-4">{authError}</p>
          <a 
            href="/login" 
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Add Equipment Type</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Equipment Name (e.g., Antminer S21 Pro)"
          className="border p-2 w-full"
        />
        <input
          type="text"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="Manufacturer (e.g., Bitmain)"
          className="border p-2 w-full"
        />
        <input
          type="number"
          value={maxHashrate}
          onChange={(e) => setMaxHashrate(e.target.value)}
          placeholder="Max Hashrate (TH/s)"
          className="border p-2 w-full"
        />
        <input
          type="number"
          value={maxPower}
          onChange={(e) => setMaxPower(e.target.value)}
          placeholder="Max Power (W)"
          className="border p-2 w-full"
        />
        <input
          type="number"
          value={efficiency}
          onChange={(e) => setEfficiency(e.target.value)}
          placeholder="Efficiency (J/TH)"
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Add Equipment
        </button>
      </form>
    </div>
  );
}