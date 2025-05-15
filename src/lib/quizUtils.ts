import { supabase } from './supabaseClient';

export const courseIdFromSlug = async (slug: string): Promise<number> => {
  const { data, error } = await supabase
    .from('edu_pro_course')
    .select('id')
    .eq('slug', slug)
    .single();

  if (error || !data) throw new Error('Course not found');
  return data.id;
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};