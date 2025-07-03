import { useReducer, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Flashcard {
  id: number;
  name: string;
  messages: { role: string; content: string }[];
  created_at: string;
  updated_at: string;
  topic: string | null; // Updated to allow null
  section: string | null; // Updated to allow null
  user_id?: string;
  organization_id?: string;
  status?: string;
}

interface State {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  totalFlashcards: number;
  topics: string[];
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { flashcards: Flashcard[]; topics: string[] } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'DELETE_SUCCESS'; payload: number }
  | { type: 'UPDATE_STATUS_SUCCESS'; payload: { flashcardId: number; newStatus: string } }
  | { type: 'UPDATE_FLASHCARD_SUCCESS'; payload: Flashcard };

const initialState: State = {
  flashcards: [],
  loading: true,
  error: null,
  totalFlashcards: 0,
  topics: [],
};

const flashcardReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        flashcards: action.payload.flashcards,
        totalFlashcards: action.payload.flashcards.length,
        topics: action.payload.topics,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'DELETE_SUCCESS':
      const updatedFlashcards = state.flashcards.filter((fc) => fc.id !== action.payload);
      return {
        ...state,
        flashcards: updatedFlashcards,
        totalFlashcards: updatedFlashcards.length,
      };
    case 'UPDATE_STATUS_SUCCESS':
      return {
        ...state,
        flashcards: state.flashcards.map((fc) =>
          fc.id === action.payload.flashcardId ? { ...fc, status: action.payload.newStatus } : fc
        ),
      };
    case 'UPDATE_FLASHCARD_SUCCESS':
      return {
        ...state,
        flashcards: state.flashcards.map((fc) =>
          fc.id === action.payload.id ? action.payload : fc
        ),
      };
    default:
      return state;
  }
};

export const useFlashcards = (userId: string | null) => {
  const [state, dispatch] = useReducer(flashcardReducer, initialState);

  const fetchData = useCallback(async () => {
    if (!userId) {
      dispatch({ type: 'FETCH_ERROR', payload: 'User not authenticated' });
      return;
    }

    dispatch({ type: 'FETCH_START' });
    try {
      const { data: userFlashcards, error: userError } = await supabase
        .from('ai_user_flashcards')
        .select('id, name, messages, created_at, updated_at, topic, section, user_id')
        .eq('user_id', userId);

      if (userError) throw new Error(`Failed to load user flashcards: ${userError.message}`);

      const { data: defaultFlashcards, error: defaultError } = await supabase
        .from('ai_default_flashcards')
        .select('id, name, messages, created_at, updated_at, topic, section, organization_id');

      if (defaultError) throw new Error(`Failed to load default flashcards: ${defaultError.message}`);

      const { data: statuses, error: statusError } = await supabase
        .from('ai_flashcard_status')
        .select('ai_user_flashcards_id, ai_default_flashcards_id, status')
        .eq('user_id', userId);

      if (statusError) throw new Error(`Failed to load flashcard statuses: ${statusError.message}`);

      const userFlashcardsWithStatus = (userFlashcards || []).map((fc) => ({
        ...fc,
        topic: fc.topic || null,
        section: fc.section || null,
        status: statuses?.find((s) => s.ai_user_flashcards_id === fc.id)?.status || 'learning',
        messages: fc.messages || [],
      }));

      const defaultFlashcardsWithStatus = (defaultFlashcards || []).map((fc) => ({
        ...fc,
        topic: fc.topic || null,
        section: fc.section || null,
        status: statuses?.find((s) => s.ai_default_flashcards_id === fc.id)?.status || 'learning',
        messages: fc.messages || [],
      }));

      const allFlashcards = [...userFlashcardsWithStatus, ...defaultFlashcardsWithStatus];
      const uniqueTopics = Array.from(
        new Set(allFlashcards.map((fc) => fc.topic).filter((t): t is string => !!t))
      );

      dispatch({ type: 'FETCH_SUCCESS', payload: { flashcards: allFlashcards, topics: uniqueTopics } });
    } catch (error: any) {
      dispatch({ type: 'FETCH_ERROR', payload: error.message || 'Failed to load flashcards.' });
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteFlashcard = async (flashcardId: number) => {
    try {
      const { error } = await supabase.from('ai_user_flashcards').delete().eq('id', flashcardId).eq('user_id', userId);
      if (error) throw new Error(`Failed to delete flashcard: ${error.message}`);
      dispatch({ type: 'DELETE_SUCCESS', payload: flashcardId });
    } catch (error: any) {
      dispatch({ type: 'FETCH_ERROR', payload: error.message || 'Failed to delete flashcard.' });
    }
  };

  const updateFlashcardStatus = async (flashcardId: number, isUserFlashcard: boolean, newStatus: string) => {
    try {
      const table = isUserFlashcard ? 'ai_user_flashcards_id' : 'ai_default_flashcards_id';
      const { data: existingStatus, error: selectError } = await supabase
        .from('ai_flashcard_status')
        .select('id, status')
        .eq(table, flashcardId)
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw new Error(`Failed to check existing status: ${selectError.message}`);
      }

      if (existingStatus) {
        const { error: updateError } = await supabase
          .from('ai_flashcard_status')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', existingStatus.id);
        if (updateError) throw new Error(`Failed to update flashcard status: ${updateError.message}`);
      } else {
        const { error: insertError } = await supabase
          .from('ai_flashcard_status')
          .insert({ [table]: flashcardId, user_id: userId, status: newStatus, updated_at: new Date().toISOString() });
        if (insertError) throw new Error(`Failed to insert flashcard status: ${insertError.message}`);
      }
      dispatch({ type: 'UPDATE_STATUS_SUCCESS', payload: { flashcardId, newStatus } });
    } catch (error: any) {
      dispatch({ type: 'FETCH_ERROR', payload: error.message || 'Failed to update flashcard status.' });
    }
  };

  const updateFlashcard = async (flashcardId: number, updatedData: { name: string; topic: string | null; section: string | null }) => {
    try {
      const { data, error } = await supabase
        .from('ai_user_flashcards')
        .update({
          name: updatedData.name.trim(),
          topic: updatedData.topic?.trim() || null,
          section: updatedData.section?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', flashcardId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update flashcard: ${error.message}`);
      if (data) {
        dispatch({ type: 'UPDATE_FLASHCARD_SUCCESS', payload: { ...data, topic: data.topic || null, section: data.section || null } });
      }
    } catch (error: any) {
      dispatch({ type: 'FETCH_ERROR', payload: error.message || 'Failed to update flashcard.' });
    }
  };

  return { ...state, deleteFlashcard, updateFlashcardStatus, updateFlashcard };
};