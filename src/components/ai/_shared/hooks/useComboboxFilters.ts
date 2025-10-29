/**
 * Combobox Filtering Hook
 * Handles filtering logic for model, endpoint, and role comboboxes
 * Shared between admin and account contexts
 */

import { useState, useMemo } from 'react';
import { POPULAR_MODELS, POPULAR_ENDPOINTS, PREDEFINED_ROLES } from '../types/aiManagement';

export const useComboboxFilters = () => {
  const [modelQuery, setModelQuery] = useState('');
  const [endpointQuery, setEndpointQuery] = useState('');
  const [roleQuery, setRoleQuery] = useState('');

  const filteredModels = useMemo(() => {
    if (!modelQuery) return POPULAR_MODELS;
    return POPULAR_MODELS.filter((model) => 
      model.toLowerCase().includes(modelQuery.toLowerCase())
    );
  }, [modelQuery]);

  const filteredEndpoints = useMemo(() => {
    if (!endpointQuery) return POPULAR_ENDPOINTS;
    return POPULAR_ENDPOINTS.filter((endpoint) => 
      endpoint.toLowerCase().includes(endpointQuery.toLowerCase())
    );
  }, [endpointQuery]);

  const filteredRoles = useMemo(() => {
    if (!roleQuery) return PREDEFINED_ROLES;
    const query = roleQuery.toLowerCase();
    return PREDEFINED_ROLES.filter((role) => 
      role.value.toLowerCase().includes(query) ||
      role.label.toLowerCase().includes(query) ||
      role.description.toLowerCase().includes(query)
    );
  }, [roleQuery]);

  return {
    modelQuery,
    setModelQuery,
    endpointQuery,
    setEndpointQuery,
    roleQuery,
    setRoleQuery,
    filteredModels,
    filteredEndpoints,
    filteredRoles,
    predefinedRoles: PREDEFINED_ROLES, // Export for convenience
  };
};
