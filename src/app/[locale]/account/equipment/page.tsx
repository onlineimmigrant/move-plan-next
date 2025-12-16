'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface EquipmentType {
  id: string;
  name: string;
  manufacturer: string;
  max_hashrate: number;
  max_power: number;
  efficiency: number;
}

async function fetchEquipment(): Promise<EquipmentType[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user?.id)
    .single();
  const { data, error } = await supabase
    .from('equipment_types')
    .select('id, name, manufacturer, max_hashrate, max_power, efficiency')
    .eq('organization_id', profile?.organization_id);
  if (error) throw error;
  return data;
}

export default function EquipmentPage({ params }: { params: { locale: string } }) {
  const { data: equipment, error, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: fetchEquipment,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl mb-4">Available Equipment</h2>
        <p>Loading equipment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl mb-4">Available Equipment</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading equipment: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Available Equipment</h2>
      {equipment?.length === 0 ? (
        <p className="text-gray-500">No equipment types available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipment?.map((eq) => (
            <div key={eq.id} className="p-4 bg-white rounded shadow border">
              <h3 className="font-semibold">{eq.name}</h3>
              <div className="space-y-1 text-sm">
                <p>Manufacturer: {eq.manufacturer}</p>
                <p>Max Hashrate: {eq.max_hashrate} TH/s</p>
                <p>Max Power: {eq.max_power} W</p>
                <p>Efficiency: {eq.efficiency} J/TH</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}