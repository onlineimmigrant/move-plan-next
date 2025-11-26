/**
 * LogicEditor - Conditional logic rule builder for form questions
 */

'use client';

import React from 'react';
import { Cog6ToothIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Question, LogicGroup } from '../types';

interface LogicEditorProps {
  question: Question;
  questions: Question[];
  currentStep: number;
  onSetQuestionLogic: (
    questionId: string,
    updater: (lg: LogicGroup) => LogicGroup
  ) => void;
  onEnsureLogicGroup: (question: Question) => LogicGroup;
}

export function LogicEditor({
  question,
  questions,
  currentStep,
  onSetQuestionLogic,
  onEnsureLogicGroup,
}: LogicEditorProps) {
  const logicGroup = onEnsureLogicGroup(question);

  return (
    <div className="mt-4 p-4 border-2 border-blue-200 rounded-xl bg-blue-50/50 dark:bg-blue-900/10">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3">
        <Cog6ToothIcon className="h-4 w-4 text-blue-600" />
        <span className="font-medium">Show this question if</span>
        <select
          className="border border-gray-300 text-sm rounded px-2 py-1 bg-white"
          value={logicGroup.combinator}
          onChange={(e) =>
            onSetQuestionLogic(question.id, (lg) => ({
              ...lg,
              combinator: e.target.value as 'all' | 'any',
            }))
          }
        >
          <option value="all">all</option>
          <option value="any">any</option>
        </select>
        <span>of the following are true:</span>
      </div>

      <div className="space-y-2">
        {logicGroup.rules.map((rule, rIdx) => {
          const refQ = questions.find((q) => q.id === rule.leftQuestionId) || null;
          const hasOptions = !!refQ?.options?.length;
          const operator = rule.operator;
          return (
            <div
              key={rIdx}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg"
            >
              <select
                className="min-w-[10rem] border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                value={rule.leftQuestionId}
                onChange={(e) =>
                  onSetQuestionLogic(question.id, (lg) => {
                    const rules = [...lg.rules];
                    rules[rIdx] = { ...rules[rIdx], leftQuestionId: e.target.value };
                    return { ...lg, rules };
                  })
                }
              >
                <option value="" disabled>
                  Select question…
                </option>
                {questions.slice(0, currentStep).map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label || 'Untitled'}
                  </option>
                ))}
              </select>

              <select
                className="border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                value={operator}
                onChange={(e) =>
                  onSetQuestionLogic(question.id, (lg) => {
                    const rules = [...lg.rules];
                    rules[rIdx] = { ...rules[rIdx], operator: e.target.value as any };
                    return { ...lg, rules };
                  })
                }
              >
                <option value="is">is</option>
                <option value="is_not">is not</option>
                <option value="contains">contains</option>
                <option value="not_contains">does not contain</option>
                <option value="gt">&gt;</option>
                <option value="lt">&lt;</option>
                <option value="answered">is answered</option>
                <option value="not_answered">is not answered</option>
              </select>

              {!(operator === 'answered' || operator === 'not_answered') &&
                (hasOptions ? (
                  <select
                    className="border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                    value={rule.value || ''}
                    onChange={(e) =>
                      onSetQuestionLogic(question.id, (lg) => {
                        const rules = [...lg.rules];
                        rules[rIdx] = { ...rules[rIdx], value: e.target.value };
                        return { ...lg, rules };
                      })
                    }
                  >
                    <option value="" disabled>
                      Select value…
                    </option>
                    {(refQ?.options || []).map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt || `Option ${i + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                    placeholder="Value…"
                    value={rule.value || ''}
                    onChange={(e) =>
                      onSetQuestionLogic(question.id, (lg) => {
                        const rules = [...lg.rules];
                        rules[rIdx] = { ...rules[rIdx], value: e.target.value };
                        return { ...lg, rules };
                      })
                    }
                  />
                ))}

              <button
                className="p-1 text-gray-400 hover:text-red-600"
                title="Remove rule"
                onClick={() =>
                  onSetQuestionLogic(question.id, (lg) => ({
                    ...lg,
                    rules: lg.rules.filter((_: any, i: number) => i !== rIdx),
                  }))
                }
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          className="text-sm px-3 py-1.5 rounded-lg border border-blue-300 bg-white hover:bg-blue-50 text-blue-700 font-medium"
          onClick={() => {
            const firstPrevQuestion = questions.slice(0, currentStep)[0];
            onSetQuestionLogic(question.id, (lg) => ({
              ...lg,
              rules: [
                ...lg.rules,
                {
                  leftQuestionId: firstPrevQuestion?.id || '',
                  operator: 'is',
                  value: '',
                },
              ],
            }));
          }}
        >
          + Add condition
        </button>
        {logicGroup.rules.length > 0 && (
          <span className="text-xs text-gray-500">{logicGroup.rules.length} rule(s)</span>
        )}
      </div>
    </div>
  );
}
