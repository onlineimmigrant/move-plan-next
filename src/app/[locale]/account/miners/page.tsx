'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { supabase } from '@/lib/supabase';

interface MinerData {
  id: string;
  serial_number: string;
  ip_address: string;
  hashrate?: number;
  temperature?: number;
  profit?: number;
  power?: number;
  efficiency?: number;
  uptime?: number;
  status?: string;
  last_updated?: string;
  user_id: string;
  organization_id: string;
  created_at: string;
}

async function fetchMiners(): Promise<MinerData[]> {
  // Get the session token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No valid session found');
  }

  const response = await fetch('/api/miners', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch miners');
  }
  return response.json();
}

export default function MinersPage({ params }: { params: { locale: string } }) {
  const { data: miners, refetch, error, isLoading } = useQuery({
    queryKey: ['miners'],
    queryFn: fetchMiners,
    refetchInterval: 30000,
  });
  const [realTimeData, setRealTimeData] = useState<MinerData[]>([]);

  useEffect(() => {
    if (miners) {
      setRealTimeData(miners);
    }
  }, [miners]);

  useEffect(() => {
    const channel = supabase
      .channel('miners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'miners' }, (payload) => {
        refetch();
        if (payload.eventType === 'INSERT' && payload.new) {
          setRealTimeData((prev) => [payload.new as MinerData, ...prev]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setRealTimeData((prev) =>
            prev.map((miner) => (miner.id === payload.new?.id ? (payload.new as MinerData) : miner))
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setRealTimeData((prev) => prev.filter((miner) => miner.id !== payload.old?.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl mb-4">My Miners Dashboard</h2>
        <p>Loading miners data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl mb-4">My Miners Dashboard</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading miners: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">My Miners Dashboard</h2>
      {realTimeData.length === 0 ? (
        <p className="text-gray-500">No miners assigned to you.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {realTimeData.map((miner) => (
            <div key={miner.id} className="p-4 bg-white rounded shadow border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Serial: {miner.serial_number}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    miner.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {miner.status || 'unknown'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>IP: {miner.ip_address}</p>
                <p>Hashrate: {miner.hashrate ? `${miner.hashrate} TH/s` : 'N/A'}</p>
                <p>Temperature: {miner.temperature ? `${miner.temperature} °C` : 'N/A'}</p>
                <p>Profit: {miner.profit ? `$${miner.profit.toFixed(2)}/day` : 'N/A'}</p>
                <p>Power: {miner.power ? `${miner.power} W` : 'N/A'}</p>
                <p>Efficiency: {miner.efficiency ? `${miner.efficiency} J/TH` : 'N/A'}</p>
                {miner.last_updated && (
                  <p className="text-gray-500">
                    Last updated: {new Date(miner.last_updated).toLocaleTimeString()}
                  </p>
                )}
              </div>
              {miner.hashrate && (
                <div className="mt-4">
                  <LineChart width={280} height={150} data={[{ time: 'now', hashrate: miner.hashrate }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="hashrate" stroke="#8884d8" />
                  </LineChart>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}