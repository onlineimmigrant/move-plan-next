'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Settings, Zap, Users, Tag, AlertTriangle, Clock, ArrowRight, PlayCircle, PauseCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';

interface AssignmentRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'round_robin' | 'tag_based' | 'priority_based' | 'workload_balanced' | 'custom';
  conditions: {
    tags?: string[];
    priority?: string[];
    status?: string[];
    custom?: Record<string, any>;
  };
  actions: {
    assign_to_team?: string;
    assign_to_user?: string;
    add_tags?: string[];
    notify_customer?: boolean;
    send_auto_response?: boolean;
  };
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminTeam {
  id: string;
  name: string;
  description: string;
  tags: string[];
  is_active: boolean;
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
}

interface AssignmentRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RULE_TYPES = [
  { value: 'round_robin', label: 'Round Robin', icon: Users, description: 'Distribute tickets evenly across admins' },
  { value: 'tag_based', label: 'Tag-Based Routing', icon: Tag, description: 'Route to teams based on ticket tags' },
  { value: 'priority_based', label: 'Priority Escalation', icon: AlertTriangle, description: 'Auto-escalate based on priority and age' },
  { value: 'workload_balanced', label: 'Workload Balancing', icon: Zap, description: 'Assign to admin with fewest active tickets' },
  { value: 'custom', label: 'Custom Rule', icon: Settings, description: 'Create custom conditions and actions' }
];

const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'];
const TICKET_STATUSES = ['open', 'in progress', 'closed'];

export default function AssignmentRulesModal({ isOpen, onClose }: AssignmentRulesModalProps) {
  const { settings } = useSettings();
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [schemaError, setSchemaError] = useState(false);
  
  // Rule editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AssignmentRule> | null>(null);
  
  // Form state
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleType, setRuleType] = useState<AssignmentRule['rule_type']>('round_robin');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [assignToTeam, setAssignToTeam] = useState('');
  const [assignToUser, setAssignToUser] = useState('');
  const [addTags, setAddTags] = useState<string[]>([]);
  const [rulePriority, setRulePriority] = useState(100);
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [sendAutoResponse, setSendAutoResponse] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRules(),
        fetchTeams(),
        fetchAdmins(),
        fetchTags()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'Error loading data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from('ticket_assignment_rules')
      .select('*')
      .eq('organization_id', settings?.organization_id)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching rules:', error);
      // Check if it's a table doesn't exist error
      if (error.message?.includes('relation') || error.code === '42P01') {
        setSchemaError(true);
      }
      return;
    }

    setRules(data || []);
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('admin_teams')
      .select('*')
      .eq('organization_id', settings?.organization_id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching teams:', error);
      // Check if it's a table doesn't exist error
      if (error.message?.includes('relation') || error.code === '42P01') {
        setSchemaError(true);
      }
      return;
    }

    setTeams(data || []);
  };

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('organization_id', settings?.organization_id)
      .eq('role', 'admin')
      .order('full_name');

    if (error) {
      console.error('Error fetching admins:', error);
      return;
    }

    setAdmins(data || []);
  };

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('ticket_tags')
      .select('name')
      .eq('organization_id', settings?.organization_id)
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }

    setTags((data || []).map(t => t.name));
  };

  const startNewRule = () => {
    resetForm();
    setIsEditing(true);
    setEditingRule(null);
  };

  const editRule = (rule: AssignmentRule) => {
    setRuleName(rule.name);
    setRuleDescription(rule.description || '');
    setRuleType(rule.rule_type);
    setSelectedTags(rule.conditions.tags || []);
    setSelectedPriorities(rule.conditions.priority || []);
    setSelectedStatuses(rule.conditions.status || []);
    setAssignToTeam(rule.actions.assign_to_team || '');
    setAssignToUser(rule.actions.assign_to_user || '');
    setAddTags(rule.actions.add_tags || []);
    setRulePriority(rule.priority);
    setNotifyCustomer(rule.actions.notify_customer || false);
    setSendAutoResponse(rule.actions.send_auto_response || false);
    setEditingRule(rule);
    setIsEditing(true);
  };

  const resetForm = () => {
    setRuleName('');
    setRuleDescription('');
    setRuleType('round_robin');
    setSelectedTags([]);
    setSelectedPriorities([]);
    setSelectedStatuses([]);
    setAssignToTeam('');
    setAssignToUser('');
    setAddTags([]);
    setRulePriority(100);
    setNotifyCustomer(false);
    setSendAutoResponse(false);
  };

  const saveRule = async () => {
    if (!ruleName.trim()) {
      setToast({ message: 'Rule name is required', type: 'error' });
      return;
    }

    const ruleData = {
      organization_id: settings?.organization_id,
      name: ruleName,
      description: ruleDescription,
      rule_type: ruleType,
      conditions: {
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined
      },
      actions: {
        assign_to_team: assignToTeam || undefined,
        assign_to_user: assignToUser || undefined,
        add_tags: addTags.length > 0 ? addTags : undefined,
        notify_customer: notifyCustomer,
        send_auto_response: sendAutoResponse
      },
      priority: rulePriority,
      is_active: true
    };

    try {
      if (editingRule) {
        // Update existing rule
        const { error } = await supabase
          .from('ticket_assignment_rules')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (error) throw error;
        setToast({ message: 'Rule updated successfully', type: 'success' });
      } else {
        // Create new rule
        const { error } = await supabase
          .from('ticket_assignment_rules')
          .insert([ruleData]);

        if (error) throw error;
        setToast({ message: 'Rule created successfully', type: 'success' });
      }

      setIsEditing(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      setToast({ message: 'Error saving rule', type: 'error' });
    }
  };

  const toggleRuleActive = async (rule: AssignmentRule) => {
    try {
      const { error } = await supabase
        .from('ticket_assignment_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;

      setToast({ 
        message: `Rule ${!rule.is_active ? 'activated' : 'deactivated'} successfully`, 
        type: 'success' 
      });
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      setToast({ message: 'Error updating rule', type: 'error' });
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await supabase
        .from('ticket_assignment_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setToast({ message: 'Rule deleted successfully', type: 'success' });
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      setToast({ message: 'Error deleting rule', type: 'error' });
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10000]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Assignment Rules</h2>
                <p className="text-sm text-slate-500">Automate ticket assignment with intelligent routing</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : schemaError ? (
              /* Schema Not Applied Warning */
              <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-amber-900 mb-2">
                        Database Schema Required
                      </h3>
                      <p className="text-amber-800 mb-4">
                        The automation tables haven't been created yet. To use assignment rules, you need to apply the Phase 6 database schema.
                      </p>
                      <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
                        <p className="text-sm font-medium text-slate-700 mb-2">Required file:</p>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-purple-600">
                          PHASE_6_AUTOMATION_SCHEMA.sql
                        </code>
                      </div>
                      <p className="text-sm text-amber-700 mb-4">
                        This file contains the schema for:
                      </p>
                      <ul className="text-sm text-amber-700 space-y-1 mb-4 list-disc list-inside">
                        <li>Assignment rules and conditions</li>
                        <li>Admin teams and members</li>
                        <li>SLA policies and tracking</li>
                        <li>Workflow triggers and actions</li>
                        <li>Auto-responses and escalation rules</li>
                      </ul>
                      <p className="text-sm text-amber-700">
                        Apply the schema to your Supabase database through the SQL Editor, then refresh this page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : isEditing ? (
              /* Rule Editor */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {editingRule ? 'Edit Rule' : 'Create New Rule'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      resetForm();
                    }}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rule Name *
                    </label>
                    <input
                      type="text"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Billing Team Auto-Assignment"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={ruleDescription}
                      onChange={(e) => setRuleDescription(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe when this rule should apply..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rule Type *
                    </label>
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value as AssignmentRule['rule_type'])}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {RULE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      {RULE_TYPES.find(t => t.value === ruleType)?.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority (lower = higher priority)
                    </label>
                    <input
                      type="number"
                      value={rulePriority}
                      onChange={(e) => setRulePriority(parseInt(e.target.value) || 100)}
                      min="1"
                      max="1000"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Conditions */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Conditions (When to apply this rule)
                  </h4>

                  <div className="space-y-4">
                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ticket Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedTags(prev =>
                                prev.includes(tag)
                                  ? prev.filter(t => t !== tag)
                                  : [...prev, tag]
                              );
                            }}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              selectedTags.includes(tag)
                                ? 'bg-purple-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Priority Levels
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PRIORITY_LEVELS.map(priority => (
                          <button
                            key={priority}
                            onClick={() => {
                              setSelectedPriorities(prev =>
                                prev.includes(priority)
                                  ? prev.filter(p => p !== priority)
                                  : [...prev, priority]
                              );
                            }}
                            className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                              selectedPriorities.includes(priority)
                                ? 'bg-purple-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            {priority}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ticket Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TICKET_STATUSES.map(status => (
                          <button
                            key={status}
                            onClick={() => {
                              setSelectedStatuses(prev =>
                                prev.includes(status)
                                  ? prev.filter(s => s !== status)
                                  : [...prev, status]
                              );
                            }}
                            className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                              selectedStatuses.includes(status)
                                ? 'bg-purple-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border border-slate-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Actions (What to do when conditions match)
                  </h4>

                  <div className="space-y-4">
                    {/* Assign to Team */}
                    {teams.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Assign to Team
                        </label>
                        <select
                          value={assignToTeam}
                          onChange={(e) => {
                            setAssignToTeam(e.target.value);
                            if (e.target.value) setAssignToUser(''); // Clear user if team selected
                          }}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          <option value="">No team assignment</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Assign to User */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Assign to Specific Admin
                      </label>
                      <select
                        value={assignToUser}
                        onChange={(e) => {
                          setAssignToUser(e.target.value);
                          if (e.target.value) setAssignToTeam(''); // Clear team if user selected
                        }}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">No specific admin</option>
                        {admins.map(admin => (
                          <option key={admin.id} value={admin.id}>
                            {admin.full_name || admin.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notifyCustomer}
                          onChange={(e) => setNotifyCustomer(e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-700">Notify customer of assignment</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sendAutoResponse}
                          onChange={(e) => setSendAutoResponse(e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-700">Send automatic response</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveRule}
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Rules List */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-slate-600">
                      {rules.length} {rules.length === 1 ? 'rule' : 'rules'} configured
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={startNewRule}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    New Rule
                  </Button>
                </div>

                {rules.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No assignment rules configured</p>
                    <Button variant="primary" onClick={startNewRule}>
                      Create Your First Rule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map(rule => {
                      const ruleTypeInfo = RULE_TYPES.find(t => t.value === rule.rule_type);
                      const Icon = ruleTypeInfo?.icon || Settings;

                      return (
                        <div
                          key={rule.id}
                          className={`border rounded-lg p-4 transition-all ${
                            rule.is_active
                              ? 'border-slate-200 bg-white'
                              : 'border-slate-100 bg-slate-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`p-2 rounded-lg ${
                                rule.is_active ? 'bg-purple-100' : 'bg-slate-200'
                              }`}>
                                <Icon className={`h-5 w-5 ${
                                  rule.is_active ? 'text-purple-600' : 'text-slate-500'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                                    Priority: {rule.priority}
                                  </span>
                                  {rule.is_active ? (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                      <PlayCircle className="h-3 w-3" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-600 flex items-center gap-1">
                                      <PauseCircle className="h-3 w-3" />
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                {rule.description && (
                                  <p className="text-sm text-slate-600 mb-2">{rule.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                    {ruleTypeInfo?.label}
                                  </span>
                                  {rule.conditions.tags && rule.conditions.tags.length > 0 && (
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                                      Tags: {rule.conditions.tags.join(', ')}
                                    </span>
                                  )}
                                  {rule.conditions.priority && rule.conditions.priority.length > 0 && (
                                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded capitalize">
                                      Priority: {rule.conditions.priority.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRuleActive(rule)}
                                className={`p-2 rounded-lg transition-colors ${
                                  rule.is_active
                                    ? 'hover:bg-orange-50 text-orange-600'
                                    : 'hover:bg-green-50 text-green-600'
                                }`}
                                title={rule.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {rule.is_active ? (
                                  <PauseCircle className="h-5 w-5" />
                                ) : (
                                  <PlayCircle className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => editRule(rule)}
                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Settings className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteRule(rule.id)}
                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
