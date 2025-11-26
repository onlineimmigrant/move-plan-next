/**
 * Utility functions for logic operations
 */

import type { Question, LogicGroup, LogicRule, LogicOperator } from './types';

/**
 * Ensure a question has a valid logic group structure
 */
export function ensureLogicGroup(question: Question): LogicGroup {
  const current = question.validation?.logic as LogicGroup | undefined;
  return current && Array.isArray(current.rules)
    ? current
    : { combinator: 'all', rules: [] };
}

/**
 * Update question logic with a new logic group
 */
export function updateQuestionLogic(
  question: Question,
  updater: (lg: LogicGroup) => LogicGroup
): Question {
  const currentLogic = ensureLogicGroup(question);
  const nextLogic = updater(currentLogic);
  
  return {
    ...question,
    validation: {
      ...(question.validation || {}),
      logic: nextLogic,
    },
  };
}

/**
 * Generate a human-readable summary of logic rules
 */
export function getLogicSummary(question: Question, allQuestions: Question[]): string {
  const lg = ensureLogicGroup(question);
  
  if (!lg.rules.length) return '';
  
  const joiner = lg.combinator === 'all' ? 'AND' : 'OR';
  
  const parts = lg.rules.map(rule => {
    const ref = allQuestions.find(x => x.id === rule.leftQuestionId);
    const refLabel = ref?.label || 'Untitled';
    
    const opMap: Record<LogicOperator, string> = {
      is: 'is',
      is_not: 'is not',
      contains: 'contains',
      not_contains: 'does not contain',
      gt: '>',
      lt: '<',
      answered: 'is answered',
      not_answered: 'is not answered',
    };
    
    const val =
      rule.operator === 'answered' || rule.operator === 'not_answered'
        ? ''
        : ` "${rule.value || ''}"`;
    
    return `${refLabel} ${opMap[rule.operator]}${val}`;
  });
  
  return parts.join(` ${joiner} `);
}

/**
 * Add a logic rule to a logic group
 */
export function addLogicRule(logicGroup: LogicGroup, rule: LogicRule): LogicGroup {
  return {
    ...logicGroup,
    rules: [...logicGroup.rules, rule],
  };
}

/**
 * Remove a logic rule from a logic group
 */
export function removeLogicRule(logicGroup: LogicGroup, ruleIndex: number): LogicGroup {
  return {
    ...logicGroup,
    rules: logicGroup.rules.filter((_, idx) => idx !== ruleIndex),
  };
}

/**
 * Update a specific logic rule
 */
export function updateLogicRule(
  logicGroup: LogicGroup,
  ruleIndex: number,
  updates: Partial<LogicRule>
): LogicGroup {
  return {
    ...logicGroup,
    rules: logicGroup.rules.map((rule, idx) =>
      idx === ruleIndex ? { ...rule, ...updates } : rule
    ),
  };
}

/**
 * Toggle the combinator between 'all' and 'any'
 */
export function toggleCombinator(logicGroup: LogicGroup): LogicGroup {
  return {
    ...logicGroup,
    combinator: logicGroup.combinator === 'all' ? 'any' : 'all',
  };
}
