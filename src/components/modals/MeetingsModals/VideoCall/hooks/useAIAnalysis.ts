import { useState, useCallback, useRef } from 'react';

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

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

interface TaskResult {
  taskId: string;
  taskName: string;
  result: string;
  timestamp: Date;
  tokensUsed: number;
  error?: string;
}

interface AnalysisResult {
  tasks: TaskResult[];
  totalTokensUsed: number;
  analysisTime: number; // milliseconds
}

interface UseAIAnalysisReturn {
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  error: string | null;
  analyzeConversation: (transcript: TranscriptSegment[], model: AIModel) => Promise<void>;
  clearAnalysis: () => void;
}

/**
 * Hook for AI-powered conversation analysis
 * Executes multiple tasks in parallel based on the AI model's task configuration
 */
export function useAIAnalysis(): UseAIAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Execute a single analysis task
   */
  const executeTask = async (
    task: TaskItem,
    transcriptText: string,
    model: AIModel,
    signal: AbortSignal
  ): Promise<TaskResult> => {
    const startTime = Date.now();

    try {
      console.log(`🤖 Executing task: ${task.name}`);

      // Build the prompt based on task description and transcript
      const prompt = `${task.description}

Conversation Transcript:
${transcriptText}

Please provide your analysis based on the task above.`;

      // Make API call to AI provider
      const response = await fetch(model.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.api_key}`,
        },
        body: JSON.stringify({
          model: model.name,
          messages: [
            {
              role: 'system',
              content: model.system_message || 'You are an AI assistant analyzing meeting conversations. Provide clear, actionable insights.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: model.max_tokens || 1000,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API request failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extract result based on provider response format
      let resultText = '';
      let tokensUsed = 0;

      // OpenAI/GPT-4 format
      if (data.choices && data.choices[0]?.message?.content) {
        resultText = data.choices[0].message.content;
        tokensUsed = data.usage?.total_tokens || 0;
      }
      // Anthropic/Claude format
      else if (data.content && Array.isArray(data.content)) {
        resultText = data.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n');
        tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;
      }
      // Generic fallback
      else if (data.text) {
        resultText = data.text;
        tokensUsed = data.usage?.total_tokens || 0;
      } else {
        throw new Error('Unexpected API response format');
      }

      const endTime = Date.now();
      console.log(`✅ Task completed: ${task.name} (${endTime - startTime}ms, ${tokensUsed} tokens)`);

      return {
        taskId: task.id,
        taskName: task.name,
        result: resultText,
        timestamp: new Date(),
        tokensUsed,
      };

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`⏹️ Task aborted: ${task.name}`);
        throw err;
      }

      console.error(`❌ Task failed: ${task.name}`, err);
      return {
        taskId: task.id,
        taskName: task.name,
        result: '',
        timestamp: new Date(),
        tokensUsed: 0,
        error: err.message,
      };
    }
  };

  /**
   * Analyze conversation with multiple tasks in parallel
   */
  const analyzeConversation = useCallback(
    async (transcript: TranscriptSegment[], model: AIModel) => {
      if (!transcript || transcript.length === 0) {
        setError('No transcript available for analysis');
        return;
      }

      if (!model || !model.task || model.task.length === 0) {
        setError('No analysis tasks configured for selected model');
        return;
      }

      if (!model.api_key || !model.endpoint) {
        setError('AI model not properly configured (missing API key or endpoint)');
        return;
      }

      try {
        setIsAnalyzing(true);
        setError(null);
        const startTime = Date.now();

        console.log(`🚀 Starting analysis with ${model.name} (${model.task.length} tasks)`);

        // Convert transcript to text
        const transcriptText = transcript
          .map(
            (segment) =>
              `[${segment.timestamp.toLocaleTimeString()}] ${segment.speaker}: ${segment.text}`
          )
          .join('\n');

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Filter enabled tasks
        const enabledTasks = model.task.filter((task) => task.enabled !== false);

        if (enabledTasks.length === 0) {
          setError('No enabled tasks for analysis');
          setIsAnalyzing(false);
          return;
        }

        console.log(`📋 Executing ${enabledTasks.length} enabled tasks in parallel...`);

        // Execute all tasks in parallel
        const taskPromises = enabledTasks.map((task) =>
          executeTask(task, transcriptText, model, signal)
        );

        const taskResults = await Promise.all(taskPromises);

        // Calculate totals
        const totalTokensUsed = taskResults.reduce(
          (sum, result) => sum + result.tokensUsed,
          0
        );
        const analysisTime = Date.now() - startTime;

        const result: AnalysisResult = {
          tasks: taskResults,
          totalTokensUsed,
          analysisTime,
        };

        setAnalysisResult(result);
        console.log(
          `✅ Analysis complete: ${taskResults.length} tasks, ${totalTokensUsed} tokens, ${analysisTime}ms`
        );

        // Log any task errors
        const failedTasks = taskResults.filter((r) => r.error);
        if (failedTasks.length > 0) {
          console.warn(`⚠️ ${failedTasks.length} tasks failed:`, failedTasks);
        }

      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('❌ Analysis failed:', err);
          setError(`Analysis failed: ${err.message}`);
        }
      } finally {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  /**
   * Clear analysis results
   */
  const clearAnalysis = useCallback(() => {
    // Cancel any ongoing analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeConversation,
    clearAnalysis,
  };
}
