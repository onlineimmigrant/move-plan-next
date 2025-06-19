'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';

interface Avatar {
  id: string;
  title: string;
  full_name: string;
  image: string;
}

export default function AvatarPanelChoice({ onAvatarSelect }: { onAvatarSelect: (avatar: Avatar) => void }) {
  const { settings } = useSettings();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    const { data, error } = await supabase
      .from('ticket_avatars')
      .select('id, title, full_name, image')
      .eq('organization_id', settings.organization_id)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching avatars:', error);
    } else {
      setAvatars(data || []);
    }
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatar(avatar);
    onAvatarSelect(avatar);
  };

  return (
    <aside className="w-64 p-4 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Avatars</h2>
      <ul className="space-y-2">
        {avatars.map((avatar) => (
          <li
            key={avatar.id}
            className={`p-2 rounded cursor-pointer hover:bg-blue-100 ${
              selectedAvatar?.id === avatar.id ? 'bg-blue-200' : 'bg-white'
            }`}
            onClick={() => handleAvatarSelect(avatar)}
          >
            <div className="flex items-center space-x-2">
              <img src={avatar.image} alt={avatar.title} className="w-10 h-10 rounded-full" />
              <div>
                <div className="text-sm font-medium">{avatar.title}</div>
                <div className="text-xs text-gray-500">{avatar.full_name}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}