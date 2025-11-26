/**
 * Utility functions for question operations
 */

import type { Question } from './types';

/**
 * Create a new question with default values
 */
export function createQuestion(type: Question['type'], orderIndex: number): Question {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    label: '',
    required: false,
    order_index: orderIndex,
    options: ['multiple', 'checkbox', 'dropdown', 'rating'].includes(type) ? ['Option 1'] : undefined,
  };
}

/**
 * Add a question to the list
 */
export function addQuestion(questions: Question[], type: Question['type']): Question[] {
  const newQuestion = createQuestion(type, questions.length);
  return [...questions, newQuestion];
}

/**
 * Add a question after a specific question
 */
export function addQuestionAfter(questions: Question[], afterId: string): Question[] {
  const index = questions.findIndex(q => q.id === afterId);
  if (index === -1) return questions;
  
  const newQuestion = createQuestion('text', index + 1);
  const newQuestions = [...questions];
  newQuestions.splice(index + 1, 0, newQuestion);
  
  // Reindex
  return newQuestions.map((q, idx) => ({ ...q, order_index: idx }));
}

/**
 * Update a question by ID
 */
export function updateQuestion(
  questions: Question[],
  id: string,
  updates: Partial<Question>
): Question[] {
  return questions.map(q => (q.id === id ? { ...q, ...updates } : q));
}

/**
 * Delete a question by ID
 */
export function deleteQuestion(questions: Question[], id: string): Question[] {
  return questions.filter(q => q.id !== id).map((q, idx) => ({ ...q, order_index: idx }));
}

/**
 * Duplicate a question
 */
export function duplicateQuestion(questions: Question[], id: string): Question[] {
  const question = questions.find(q => q.id === id);
  if (!question) return questions;
  
  const index = questions.findIndex(q => q.id === id);
  const newQuestion: Question = {
    ...question,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    label: question.label ? `${question.label} (copy)` : '',
  };
  
  const newQuestions = [...questions];
  newQuestions.splice(index + 1, 0, newQuestion);
  
  return newQuestions.map((q, idx) => ({ ...q, order_index: idx }));
}

/**
 * Move a question up or down
 */
export function moveQuestion(
  questions: Question[],
  id: string,
  direction: 'up' | 'down'
): Question[] {
  const index = questions.findIndex(q => q.id === id);
  if (index === -1) return questions;
  if (direction === 'up' && index === 0) return questions;
  if (direction === 'down' && index === questions.length - 1) return questions;
  
  const newQuestions = [...questions];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
  
  return newQuestions.map((q, idx) => ({ ...q, order_index: idx }));
}

/**
 * Remap ephemeral question IDs to permanent UUIDs
 */
export function remapEphemeralIds(questions: Question[]): {
  questions: Question[];
  idMap: Record<string, string>;
} {
  const ephemeralIds = questions.filter(q => q.id.startsWith('q_')).map(q => q.id);
  
  const idMap: Record<string, string> = {};
  ephemeralIds.forEach(oldId => {
    const newId =
      typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : `uuid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    idMap[oldId] = newId;
  });
  
  const remappedQuestions = questions.map(q => {
    const newId = idMap[q.id] || q.id;
    const logic = q.validation?.logic;
    
    if (logic && Array.isArray(logic.rules)) {
      const remapped = logic.rules.map((r: any) => ({
        ...r,
        leftQuestionId: idMap[r.leftQuestionId] || r.leftQuestionId,
      }));
      return { ...q, id: newId, validation: { ...q.validation, logic: { ...logic, rules: remapped } } };
    }
    
    return { ...q, id: newId };
  });
  
  return { questions: remappedQuestions, idMap };
}
