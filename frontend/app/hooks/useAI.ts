import { useState, useCallback } from 'react';

interface UseAIOptions {
  aiServiceUrl?: string;
}

export function useAI(options: UseAIOptions = {}) {
  const {
    aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:7860',
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateText = useCallback(async (prompt: string, systemPrompt?: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`${aiServiceUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          system_prompt: systemPrompt,
          max_length: 300,
          temperature: 0.7
        }),
      });

      if (!response.ok) throw new Error('AI generation failed');
      const data = await response.json();
      return data.text;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setError('Failed to generate text');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [aiServiceUrl]);

  return {
    generateText,
    isGenerating,
    error
  };
}
