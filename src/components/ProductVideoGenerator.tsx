// src/components/ProductVideoGenerator.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ProductVideoGeneratorProps {
  productId: string;
  imageUrl: string;
  productName?: string;
  productDescription?: string;
}

export default function ProductVideoGenerator({ 
  productId, 
  imageUrl, 
  productName = 'this amazing product',
  productDescription 
}: ProductVideoGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [customScript, setCustomScript] = useState('');
  const [useCustomScript, setUseCustomScript] = useState(false);

  // Generate default script from product info
  const generateDefaultScript = () => {
    if (productDescription) {
      // Use first 150 characters of description
      return productDescription.slice(0, 150) + (productDescription.length > 150 ? '...' : '');
    }
    return `Check out ${productName}! Limited time offer. Contact us today to learn more!`;
  };

  async function generate() {
    setLoading(true);
    setError(null);
    setProgress('Preparing...');

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate videos');
      }

      setProgress('Downloading image...');
      
      // Fetch image and convert to blob
      const imageBlob = await fetch(imageUrl).then(r => {
        if (!r.ok) throw new Error('Failed to load image');
        return r.blob();
      });

      setProgress('Generating speech audio...');

      // Prepare form data
      const form = new FormData();
      form.append('image', imageBlob, 'product.jpg');
      form.append('productId', productId);
      
      const script = useCustomScript && customScript 
        ? customScript 
        : generateDefaultScript();
      form.append('script', script);

      setProgress('Creating AI talking video (this may take 30-60 seconds)...');

      // Call API with auth
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: form,
      });

      const data = await res.json();

      console.log('[ProductVideoGenerator] API Response:', { 
        status: res.status, 
        ok: res.ok, 
        data 
      });

      if (!res.ok) {
        const errorMessage = data.error || data.details || 'Failed to generate video';
        console.error('[ProductVideoGenerator] Error details:', {
          status: res.status,
          error: data.error,
          details: data.details,
          fullResponse: data
        });
        throw new Error(errorMessage);
      }

      setVideoUrl(data.videoUrl);
      setProgress('Video generated successfully!');
      
      // Clear progress message after 3 seconds
      setTimeout(() => setProgress(''), 3000);

    } catch (err) {
      console.error('Video generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate video');
      setProgress('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        AI Talking Video Generator
      </h3>
      
      {!videoUrl ? (
        <div className="space-y-4">
          {/* Script customization */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="customScript"
              checked={useCustomScript}
              onChange={(e) => setUseCustomScript(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="customScript" className="text-sm text-gray-700 dark:text-gray-300">
              Use custom script
            </label>
          </div>

          {useCustomScript && (
            <div>
              <textarea
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                placeholder="Enter your video script (max 500 characters)..."
                maxLength={500}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {customScript.length}/500 characters
              </p>
            </div>
          )}

          {/* Preview of script to be used */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Script Preview:
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              "{useCustomScript && customScript ? customScript : generateDefaultScript()}"
            </p>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !imageUrl}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              '🎬 Generate AI Talking Video'
            )}
          </button>

          {/* Progress indicator */}
          {progress && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {progress}
              </p>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                ❌ {error}
              </p>
            </div>
          )}

          {/* Info message */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Generation takes 30-60 seconds using AI on remote GPU</p>
            <p>• The video will feature a talking avatar based on the product image</p>
            <p>• Video is automatically saved to your organization's R2 storage</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Generated video player */}
          <video 
            src={videoUrl} 
            controls 
            className="w-full rounded-lg shadow-lg"
            poster={imageUrl}
          />
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setVideoUrl(null);
                setError(null);
                setProgress('');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Generate Another
            </button>
            <a
              href={videoUrl}
              download
              className="flex-1 px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
            >
              Download Video
            </a>
          </div>

          {/* Success message */}
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✅ Video generated and saved successfully!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}