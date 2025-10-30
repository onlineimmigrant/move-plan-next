import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TaskItem {
  id: string;
  name: string;
  description: string;
  enabled?: boolean;
}

interface AIModel {
  id: number;
  name: string;
  role: string;
  description: string | null;
  task: TaskItem[] | null;
  system_message: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  icon: string | null;
  organization_types: string[];
  required_plan: string;
  token_limit_period: string | null;
  token_limit_amount: number | null;
  is_free: boolean;
  is_trial: boolean;
  trial_expires_days: number | null;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface UseMeetingAIModelsReturn {
  models: AIModel[];
  loading: boolean;
  error: string | null;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  refreshModels: () => Promise<void>;
}

/**
 * Hook to fetch AI models configured for meeting transcription/analysis
 * Filters by organization type, plan, and transcription task
 */
export function useMeetingAIModels(
  organizationId: string | null
): UseMeetingAIModelsReturn {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  /**
   * Fetch AI models available for this organization
   */
  const fetchModels = useCallback(async () => {
    if (!organizationId) {
      console.log('⏳ No organization ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching AI models for org:', organizationId);

      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('type')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        throw new Error(`Failed to fetch organization: ${orgError.message}`);
      }

      if (!org) {
        throw new Error('Organization not found');
      }

      console.log('🏢 Organization:', org);

      // Fetch AI models that:
      // 1. Have transcription-related tasks
      // 2. Match organization type (or allow 'general')
      // 3. Are active
      // Note: Plan filtering removed as organizations table doesn't have required_plan field
      const { data: aiModels, error: modelsError } = await supabase
        .from('ai_models_system')
        .select('*')
        .eq('is_active', true)
        .or(`organization_types.cs.{${org.type}},organization_types.cs.{general}`)
        .order('name', { ascending: true });

      if (modelsError) {
        throw new Error(`Failed to fetch AI models: ${modelsError.message}`);
      }

      if (!aiModels || aiModels.length === 0) {
        console.log('⚠️ No AI models found for this organization');
        setModels([]);
        setLoading(false);
        return;
      }

      // Filter models that have transcription/analysis tasks
      const transcriptionModels = aiModels.filter((model: any) => {
        // Check if model has tasks configured
        if (!model.task || !Array.isArray(model.task) || model.task.length === 0) {
          return false;
        }

        // Check if any task is related to meetings/transcription
        const hasTranscriptionTask = model.task.some((task: TaskItem) => {
          const taskName = task.name?.toLowerCase() || '';
          return (
            taskName.includes('transcription') ||
            taskName.includes('meeting') ||
            taskName.includes('conversation') ||
            taskName.includes('summary') ||
            taskName.includes('analysis')
          );
        });

        return hasTranscriptionTask;
      });

      console.log(`✅ Found ${transcriptionModels.length} AI models with transcription tasks`);
      setModels(transcriptionModels);

      // Auto-select first model if none selected
      if (!selectedModel && transcriptionModels.length > 0) {
        setSelectedModel(transcriptionModels[0]);
        console.log('🎯 Auto-selected model:', transcriptionModels[0].name);
      }

    } catch (err: any) {
      console.error('❌ Failed to fetch AI models:', err);
      setError(err.message);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, selectedModel]);

  /**
   * Refresh models list
   */
  const refreshModels = useCallback(async () => {
    await fetchModels();
  }, [fetchModels]);

  // Fetch models on mount and when organizationId changes
  useEffect(() => {
    fetchModels();
  }, [organizationId]);

  return {
    models,
    loading,
    error,
    selectedModel,
    setSelectedModel,
    refreshModels,
  };
}
