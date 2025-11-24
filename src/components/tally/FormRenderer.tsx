// src/components/tally/FormRenderer.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/ui/Button";
import { cn } from "@/lib/utils";

type LogicOperator = 'is' | 'is_not' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'answered' | 'not_answered';
type LogicRule = { leftQuestionId: string; operator: LogicOperator; value?: string };
type LogicGroup = { combinator: 'all' | 'any'; rules: LogicRule[] };

type Question = {
  id: string;
  type: "text" | "email" | "textarea" | "tel" | "url" | "number" | "date" | "yesno" | "multiple" | "checkbox" | "dropdown" | "rating" | "file";
  label: string;
  description?: string | null;
  required?: boolean;
  options?: string[];
  logic_show_if?: string;
  logic_value?: string;
  validation?: { logic?: LogicGroup };
};

type FormData = {
  id: string;
  title: string;
  questions: Question[];
};

type Settings = {
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  designStyle?: 'large' | 'compact';
};

const colorMap: Record<string, string> = {
  purple: "from-purple-50 to-pink-50",
  blue: "from-blue-50 to-cyan-50",
  green: "from-emerald-50 to-teal-50",
  red: "from-red-50 to-rose-50",
  orange: "from-orange-50 to-amber-50",
};

export function FormRenderer({ form, settings }: { form: FormData; settings: Settings }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Design style classes
  const isCompact = settings.designStyle === 'compact';
  const progressClass = isCompact ? 'text-xs' : 'text-sm';
  const titleClass = isCompact ? 'text-2xl' : 'text-5xl';
  const descriptionClass = isCompact ? 'text-base' : 'text-xl';
  const inputTextClass = isCompact ? 'text-xl' : 'text-3xl';
  const inputHeightClass = isCompact ? 'h-12' : 'h-24';
  const inputPaddingClass = isCompact ? 'px-3' : 'px-6';
  const inputBorderClass = isCompact ? 'border rounded-lg' : 'border-2 rounded-2xl';
  const textareaRowsClass = isCompact ? 3 : 6;
  const textareaPaddingClass = isCompact ? 'px-3 py-2' : 'px-6 py-4';
  const checkboxPaddingClass = isCompact ? 'p-4 space-x-4' : 'p-8 space-x-6';
  const checkboxTextClass = isCompact ? 'text-xl' : 'text-3xl';
  const checkboxSizeClass = isCompact ? 'w-5 h-5' : 'w-8 h-8';
  const ratingButtonClass = isCompact ? 'w-12 h-12' : 'w-20 h-20';
  const ratingTextClass = isCompact ? 'text-xl' : 'text-3xl';
  const fileInputTextClass = isCompact ? 'text-base px-3 py-4' : 'text-xl px-6 py-8';
  const fileInputBorderClass = isCompact ? 'border border-dashed rounded-lg' : 'border-2 border-dashed rounded-2xl';
  const buttonTextClass = isCompact ? 'text-base px-4 h-10' : 'text-xl px-12 h-16';
  const buttonRoundedClass = isCompact ? 'rounded-lg' : 'rounded-xl';
  const kbdTextClass = isCompact ? 'text-xs px-1.5 py-0.5' : 'text-base px-3 py-1';
  const hintTextClass = isCompact ? 'text-sm' : 'text-lg';

  const evaluateRule = (rule: LogicRule): boolean => {
    const refAnswer = (answers[rule.leftQuestionId] ?? '').toString();
    const value = (rule.value ?? '').toString();
    switch (rule.operator) {
      case 'is':
        return refAnswer === value;
      case 'is_not':
        return refAnswer !== value;
      case 'contains':
        return refAnswer.toLowerCase().includes(value.toLowerCase());
      case 'not_contains':
        return !refAnswer.toLowerCase().includes(value.toLowerCase());
      case 'gt':
        return Number(refAnswer) > Number(value);
      case 'lt':
        return Number(refAnswer) < Number(value);
      case 'answered':
        return !!refAnswer && refAnswer.length > 0;
      case 'not_answered':
        return !(!!refAnswer && refAnswer.length > 0);
      default:
        return true;
    }
  };

  const passesLogic = (q: Question): boolean => {
    const lg = q.validation?.logic;
    if (lg && Array.isArray(lg.rules) && lg.rules.length > 0) {
      const results = lg.rules.map(evaluateRule);
      return lg.combinator === 'all' ? results.every(Boolean) : results.some(Boolean);
    }
    // Fallback to legacy single-condition fields
    if (q.logic_show_if && q.logic_value !== undefined) {
      return answers[q.logic_show_if] === q.logic_value;
    }
    return true;
  };

  const visibleQuestions = useMemo(() => {
    return form.questions.filter((q) => passesLogic(q));
  }, [form.questions, answers]);

  // Clamp step when visibility changes
  useEffect(() => {
    if (step >= visibleQuestions.length) {
      setStep(Math.max(0, visibleQuestions.length - 1));
    }
  }, [visibleQuestions.length]);
  
  const current = visibleQuestions[step];

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleNext = async () => {
    if (!current) return;

    if (step === visibleQuestions.length - 1) {
      setSubmitting(true);
      
      try {
        // Calculate completion time in seconds
        const completionTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        // Submit to API
        const response = await fetch(`/api/forms/${form.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers,
            completionTimeSeconds,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to submit form:', error);
          alert('Failed to submit form. Please try again.');
          setSubmitting(false);
          return;
        }

        const data = await response.json();
        console.log('Form submitted successfully:', data);
        setSubmitted(true);
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to submit form. Please try again.');
        setSubmitting(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className={`max-w-lg w-full ${isCompact ? 'p-8' : 'p-16'} text-center shadow-2xl bg-white ${isCompact ? 'rounded-xl' : 'rounded-3xl'}`}>
          <h1 className={`${isCompact ? 'text-3xl' : 'text-5xl'} font-bold mb-4`}>Thank you!</h1>
          <p className={`${isCompact ? 'text-lg' : 'text-2xl'} text-gray-600`}>Your response has been recorded</p>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ fontFamily: settings.font_family || "inherit" }}>
      <div className="w-full max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div key={current.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
            {/* Progress */}
            <div className={`${progressClass} font-medium text-gray-600 uppercase tracking-wider`}>
              Question {step + 1} of {visibleQuestions.length}
            </div>

            {/* Title & Description */}
            <h1 className={`${titleClass} font-bold text-gray-900 leading-tight`}>{current.label}</h1>
            {current.description && (
              <p className={`${descriptionClass} text-gray-600 max-w-3xl mt-4 leading-relaxed`}>{current.description}</p>
            )}

            {/* Field */}
            <div className="mt-8">
              {current.type === "text" && (
                <input
                  type="text"
                  autoFocus
                  className={`w-full ${inputTextClass} ${inputHeightClass} ${inputPaddingClass} ${inputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all`}
                  placeholder="Type your answer here..."
                  value={answers[current.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleNext()}
                />
              )}

              {current.type === "email" && (
                <input
                  type="email"
                  autoFocus
                  className={`w-full ${inputTextClass} ${inputHeightClass} ${inputPaddingClass} ${inputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all`}
                  placeholder="your@email.com"
                  value={answers[current.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              )}

              {current.type === "tel" && (
                <input
                  type="tel"
                  autoFocus
                  className={`w-full ${inputTextClass} ${inputHeightClass} ${inputPaddingClass} ${inputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all`}
                  placeholder="+1 (555) 000-0000"
                  value={answers[current.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              )}

              {current.type === "url" && (
                <input
                  type="url"
                  autoFocus
                  className={`w-full ${inputTextClass} ${inputHeightClass} ${inputPaddingClass} ${inputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all`}
                  placeholder="https://example.com"
                  value={answers[current.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              )}

              {current.type === "number" && (
                <input
                  type="number"
                  autoFocus
                  className={`w-full ${inputTextClass} ${inputHeightClass} ${inputPaddingClass} ${inputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all`}
                  placeholder="0"
                  value={answers[current.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              )}

              {current.type === "date" && (
                <input
                  type="date"
                  autoFocus
                  className={`w-full ${inputTextClass} ${inputHeightClass} ${inputPaddingClass} ${inputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all`}
                  value={answers[current.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
                />
              )}

              {current.type === "textarea" && (
                <textarea
                  autoFocus
                  rows={textareaRowsClass}
                  className={`w-full ${inputTextClass} ${textareaPaddingClass} ${inputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all resize-none`}
                  placeholder="Share your thoughts..."
                  value={answers[current.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
                />
              )}

              {current.type === "dropdown" && (
                <select
                  autoFocus
                  className={`w-full ${inputTextClass} ${inputHeightClass} ${inputPaddingClass} ${inputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all bg-white cursor-pointer`}
                  value={answers[current.id] || ""}
                  onChange={(e) => {
                    setAnswers({ ...answers, [current.id]: e.target.value });
                    setTimeout(handleNext, 300);
                  }}
                >
                  <option value="">Select an option...</option>
                  {(current.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {current.type === "checkbox" && (
                <div className="space-y-4">
                  {(current.options || []).map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center ${checkboxPaddingClass} ${inputBorderClass} border-gray-200 cursor-pointer ${checkboxTextClass} font-medium hover:border-black transition-all bg-white shadow-sm hover:shadow-md`}
                    >
                      <input
                        type="checkbox"
                        value={opt}
                        className={`${checkboxSizeClass} rounded`}
                        checked={(answers[current.id] || "").split(",").includes(opt)}
                        onChange={(e) => {
                          const current_answers = (answers[current.id] || "").split(",").filter(Boolean);
                          const new_answers = e.target.checked
                            ? [...current_answers, opt]
                            : current_answers.filter((a) => a !== opt);
                          setAnswers({ ...answers, [current.id]: new_answers.join(",") });
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {current.type === "rating" && (
                <div className="flex gap-4 justify-center">
                  {Array.from({ length: parseInt(current.options?.[0] || "5") }, (_, i) => i + 1).map((rating) => (
                    <button
                      key={rating}
                      onClick={() => {
                        setAnswers({ ...answers, [current.id]: rating.toString() });
                        setTimeout(handleNext, 300);
                      }}
                      className={cn(
                        `${ratingButtonClass} ${inputBorderClass} ${ratingTextClass} font-bold transition-all`,
                        answers[current.id] === rating.toString()
                          ? "bg-black text-white border-black"
                          : "bg-white border-gray-300 hover:border-black hover:shadow-md"
                      )}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {current.type === "file" && (
                <div className="space-y-4">
                  <input
                    type="file"
                    className={`w-full ${fileInputTextClass} ${fileInputBorderClass} border-gray-300 focus:border-black focus:outline-none transition-all bg-white cursor-pointer file:mr-4 file:px-6 file:py-3 file:rounded-lg file:border-0 file:bg-black file:text-white file:cursor-pointer hover:file:bg-gray-800`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAnswers({ ...answers, [current.id]: file.name });
                      }
                    }}
                  />
                  {answers[current.id] && (
                    <p className={`${descriptionClass} text-gray-600`}>Selected: {answers[current.id]}</p>
                  )}
                </div>
              )}

              {(current.type === "yesno" || current.type === "multiple") && (
                <div className="space-y-4">
                  {(current.type === "yesno" ? ["Yes", "No"] : current.options || []).map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center ${checkboxPaddingClass} ${inputBorderClass} border-gray-200 cursor-pointer ${checkboxTextClass} font-medium hover:border-black transition-all bg-white shadow-sm hover:shadow-md`}
                    >
                      <input
                        type="radio"
                        name={current.id}
                        value={opt}
                        className={checkboxSizeClass}
                        onChange={(e) => {
                          setAnswers({ ...answers, [current.id]: e.target.value });
                          if (current.type === "yesno") setTimeout(handleNext, 300);
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex flex-col gap-4 ${isCompact ? 'pt-6' : 'pt-12'}`}>
              <div className="flex justify-between items-center">
                {step > 0 && (
                  <Button 
                    variant="outline"
                    size={isCompact ? 'sm' : 'lg'} 
                    className={`${buttonTextClass} ${buttonRoundedClass}`} 
                    onClick={handleBack}
                  >
                    ← Back
                  </Button>
                )}
                <Button 
                  size={isCompact ? 'sm' : 'lg'} 
                  className={`${buttonTextClass} ${buttonRoundedClass} ml-auto`} 
                  onClick={handleNext}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : (step === visibleQuestions.length - 1 ? "Submit" : "Next")}
                </Button>
              </div>
              <p className={`${hintTextClass} text-gray-600 text-center`}>
                Press <kbd className={`${kbdTextClass} bg-gray-200 rounded`}>Enter</kbd> to continue
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}