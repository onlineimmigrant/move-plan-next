'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface SpamScoreCheckerProps {
  subject: string;
  htmlContent: string;
  fromEmail: string;
}

interface SpamCheckResult {
  score: number;
  rating: 'excellent' | 'good' | 'warning' | 'danger';
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
  }>;
}

export default function SpamScoreChecker({ subject, htmlContent, fromEmail }: SpamScoreCheckerProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<SpamCheckResult | null>(null);

  const analyzeContent = () => {
    setChecking(true);
    
    // Simulate spam score analysis
    setTimeout(() => {
      const issues: SpamCheckResult['issues'] = [];
      let score = 10;

      // Subject line checks
      if (!subject) {
        issues.push({ type: 'error', message: 'No subject line provided' });
        score -= 2;
      } else {
        if (subject.length > 60) {
          issues.push({ type: 'warning', message: 'Subject line is too long (> 60 chars)' });
          score -= 0.5;
        }
        if (/[A-Z]{3,}/.test(subject)) {
          issues.push({ type: 'warning', message: 'Subject contains too many capital letters' });
          score -= 1;
        }
        if (/(!{2,}|\${2,})/.test(subject)) {
          issues.push({ type: 'warning', message: 'Subject contains excessive punctuation' });
          score -= 1;
        }
        const spamWords = ['free', 'buy now', 'click here', 'limited time', 'act now', 'urgent'];
        const foundSpamWords = spamWords.filter((word) => subject.toLowerCase().includes(word));
        if (foundSpamWords.length > 0) {
          issues.push({
            type: 'warning',
            message: `Subject contains spam trigger words: ${foundSpamWords.join(', ')}`,
          });
          score -= foundSpamWords.length * 0.5;
        }
      }

      // Content checks
      if (!htmlContent || htmlContent.length < 100) {
        issues.push({ type: 'warning', message: 'Email content is too short' });
        score -= 1;
      }
      
      const imageCount = (htmlContent.match(/<img/gi) || []).length;
      const textLength = htmlContent.replace(/<[^>]*>/g, '').length;
      
      if (imageCount > 5 && textLength < 500) {
        issues.push({ type: 'warning', message: 'Too many images compared to text (image-heavy)' });
        score -= 1.5;
      }

      if (!htmlContent.includes('unsubscribe') && !htmlContent.includes('opt-out')) {
        issues.push({ type: 'error', message: 'No unsubscribe link detected' });
        score -= 2;
      }

      if (!fromEmail || !fromEmail.includes('@')) {
        issues.push({ type: 'error', message: 'Invalid from email address' });
        score -= 2;
      } else if (fromEmail.includes('noreply')) {
        issues.push({ type: 'info', message: 'Using "noreply" email may reduce engagement' });
        score -= 0.5;
      }

      const linkCount = (htmlContent.match(/<a/gi) || []).length;
      if (linkCount > 20) {
        issues.push({ type: 'warning', message: 'Too many links in email (> 20)' });
        score -= 1;
      }

      if (htmlContent.includes('http://') && !htmlContent.includes('https://')) {
        issues.push({ type: 'warning', message: 'Using non-secure HTTP links' });
        score -= 0.5;
      }

      // Determine rating
      let rating: SpamCheckResult['rating'] = 'excellent';
      if (score < 5) rating = 'danger';
      else if (score < 7) rating = 'warning';
      else if (score < 9) rating = 'good';

      // Add positive feedback if score is high
      if (score >= 9) {
        issues.push({ type: 'info', message: 'Excellent! Your email has a low spam risk' });
      }

      setResult({
        score: Math.max(0, Math.min(10, score)),
        rating,
        issues,
      });
      setChecking(false);
    }, 1500);
  };

  useEffect(() => {
    if (subject || htmlContent || fromEmail) {
      analyzeContent();
    }
  }, [subject, htmlContent, fromEmail]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'good':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20';
      case 'danger':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Spam Score Analysis</h4>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Check your email against common spam filters
        </p>
      </div>

      {checking && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing email...</span>
        </div>
      )}

      {!checking && result && (
        <div className="space-y-4">
          {/* Score Display */}
          <div className={`rounded-xl p-6 ${getRatingColor(result.rating)}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Spam Score</span>
              <span className="text-3xl font-bold">{result.score.toFixed(1)}/10</span>
            </div>
            <div className="w-full bg-white/30 dark:bg-gray-900/30 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-current transition-all"
                style={{ width: `${(result.score / 10) * 100}%` }}
              />
            </div>
            <p className="text-sm mt-2 capitalize font-medium">{result.rating} Rating</p>
          </div>

          {/* Issues List */}
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
              Findings ({result.issues.length})
            </h5>
            <div className="space-y-2">
              {result.issues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg"
                >
                  {getIssueIcon(issue.type)}
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{issue.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {result.rating !== 'excellent' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h5 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Recommendations</h5>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Add an unsubscribe link to comply with regulations</li>
                <li>Balance images with sufficient text content</li>
                <li>Avoid spam trigger words in subject and body</li>
                <li>Use a recognizable from email address</li>
                <li>Keep subject lines concise (under 50 characters)</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
