# AI Shared Components - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Import What You Need

```tsx
import {
  // Components
  AIIcons,
  AINotification,
  AIConfirmationDialog,
  
  // Hooks
  useAIModelValidation,
  
  // Utils
  validateField,
  POPULAR_MODELS
} from '@/components/ai/_shared';
```

### 2. Use Validation in Your Form

```tsx
'use client';

import { useState } from 'react';
import { useAIModelValidation, AIIcons } from '@/components/ai/_shared';
import type { AIModelFormData } from '@/components/ai/_shared';

export default function MyAIForm() {
  const [formData, setFormData] = useState<AIModelFormData>({
    name: '',
    api_key: '',
    endpoint: '',
    max_tokens: 200,
    // ... other fields
  });

  const {
    fieldErrors,
    validateSingleField,
    validateAllFields,
    markFieldTouched,
    markAllFieldsTouched,
    getFieldError
  } = useAIModelValidation({ formData });

  const handleChange = (field: keyof AIModelFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateSingleField(field, value);
  };

  const handleBlur = (field: keyof AIModelFormData) => {
    markFieldTouched(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markAllFieldsTouched();
    const errors = validateAllFields();
    
    if (Object.keys(errors).length === 0) {
      // Submit form
      console.log('Form is valid!', formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Model Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          className={`
            w-full px-3 py-2 border rounded-lg
            ${getFieldError('name') ? 'border-red-500' : 'border-gray-300'}
          `}
        />
        {getFieldError('name') && (
          <div className="flex items-center mt-1 text-red-600 text-sm">
            <AIIcons.AlertCircle className="w-4 h-4 mr-1" />
            {getFieldError('name')}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Save Model
      </button>
    </form>
  );
}
```

### 3. Show Success/Error Notifications

```tsx
'use client';

import { useState } from 'react';
import { AINotification } from '@/components/ai/_shared';

export default function MyPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      // Save logic
      setSuccessMessage('Model saved successfully!');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to save model. Please try again.');
      setSuccessMessage(null);
    }
  };

  return (
    <div>
      {/* Success Notification */}
      {successMessage && (
        <AINotification
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          autoDismissDelay={5000}
        />
      )}

      {/* Error Notification */}
      {errorMessage && (
        <AINotification
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### 4. Add Confirmation Dialog

```tsx
'use client';

import { useState } from 'react';
import { AIConfirmationDialog, AIIcons } from '@/components/ai/_shared';

export default function MyModelCard() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    // Delete logic
    await deleteModel();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className="p-2 text-red-600 hover:bg-red-50 rounded"
      >
        <AIIcons.Trash className="w-5 h-5" />
      </button>

      <AIConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Model"
        message="Are you sure you want to delete this AI model? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
```

### 5. Use Icons Throughout Your UI

```tsx
import { AIIcons } from '@/components/ai/_shared';

export default function MyButtons() {
  return (
    <div className="flex space-x-2">
      {/* Add Button */}
      <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
        <AIIcons.Plus className="w-5 h-5 mr-2" />
        Add Model
      </button>

      {/* Edit Button */}
      <button className="p-2 hover:bg-gray-100 rounded">
        <AIIcons.Pencil className="w-5 h-5" />
      </button>

      {/* Delete Button */}
      <button className="p-2 text-red-600 hover:bg-red-50 rounded">
        <AIIcons.Trash className="w-5 h-5" />
      </button>

      {/* Refresh Button */}
      <button className="p-2 hover:bg-gray-100 rounded">
        <AIIcons.Refresh className="w-5 h-5" />
      </button>
    </div>
  );
}
```

### 6. Show Loading States

```tsx
import { AILoadingSkeleton } from '@/components/ai/_shared';

export default function MyModels() {
  const { models, loading } = useModels();

  if (loading) {
    return <AILoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-4">
      {models.map(model => (
        <ModelCard key={model.id} model={model} />
      ))}
    </div>
  );
}
```

### 7. Use Popular Models/Endpoints

```tsx
import { POPULAR_MODELS, POPULAR_ENDPOINTS } from '@/components/ai/_shared';

export default function ModelSelector() {
  return (
    <div className="space-y-4">
      {/* Model Dropdown */}
      <select>
        <option value="">Select a popular model...</option>
        {POPULAR_MODELS.map(model => (
          <option key={model.name} value={model.name}>
            {model.name}
          </option>
        ))}
      </select>

      {/* Endpoint Dropdown */}
      <select>
        <option value="">Select an endpoint...</option>
        {POPULAR_ENDPOINTS.map(endpoint => (
          <option key={endpoint.url} value={endpoint.url}>
            {endpoint.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 8. Add Unsaved Changes Warning

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useUnsavedChanges } from '@/components/ai/_shared';

export default function MyEditForm() {
  const [formData, setFormData] = useState(initialData);
  const [originalData, setOriginalData] = useState(initialData);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const { confirmAction } = useUnsavedChanges({
    hasUnsavedChanges: hasChanges,
    message: 'You have unsaved changes. Are you sure you want to leave?'
  });

  const handleCancel = () => {
    if (confirmAction()) {
      // Reset form or navigate away
      setFormData(originalData);
    }
  };

  return (
    <form>
      {/* Your form fields */}
      
      <div className="flex space-x-2">
        <button type="submit">Save</button>
        <button type="button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
```

## 📚 Common Patterns

### Pattern 1: Full CRUD Form with Validation

```tsx
'use client';

import { useState } from 'react';
import {
  useAIModelValidation,
  AINotification,
  AIConfirmationDialog,
  AIIcons,
  POPULAR_MODELS,
  DEFAULT_VALUES
} from '@/components/ai/_shared';
import type { AIModelFormData } from '@/components/ai/_shared';

export default function AIModelManager() {
  const [formData, setFormData] = useState<AIModelFormData>(DEFAULT_VALUES);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    fieldErrors,
    validateSingleField,
    validateAllFields,
    markFieldTouched,
    markAllFieldsTouched,
    getFieldError,
    resetValidation
  } = useAIModelValidation({ formData });

  const handleChange = (field: keyof AIModelFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateSingleField(field, value);
  };

  const handleBlur = (field: keyof AIModelFormData) => {
    markFieldTouched(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markAllFieldsTouched();
    const errors = validateAllFields();

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      // Save to database
      await saveModel(formData);
      setSuccessMessage('Model saved successfully!');
      resetValidation();
      setFormData(DEFAULT_VALUES);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    // Delete logic
    setShowConfirm(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Success Message */}
      {successMessage && (
        <AINotification
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold">AI Model Configuration</h2>

        {/* Form fields with validation */}
        {/* ... */}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <AIIcons.Check className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Model'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <AIIcons.Trash className="w-5 h-5 mr-2" />
            Delete
          </button>
        </div>
      </form>

      {/* Delete Confirmation */}
      <AIConfirmationDialog
        isOpen={showConfirm}
        title="Delete Model"
        message="This cannot be undone."
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
```

### Pattern 2: Model Card with Actions

```tsx
import { AIIcons } from '@/components/ai/_shared';
import type { AIModel } from '@/components/ai/_shared';

interface ModelCardProps {
  model: AIModel;
  onEdit: (model: AIModel) => void;
  onDelete: (id: number) => void;
}

export default function ModelCard({ model, onEdit, onDelete }: ModelCardProps) {
  return (
    <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {model.icon && (
            <img src={model.icon} alt="" className="w-10 h-10 rounded-lg" />
          )}
          <div>
            <h3 className="font-semibold text-lg">{model.name}</h3>
            <p className="text-sm text-gray-600">{model.endpoint}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          model.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {model.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Content */}
      <div className="mb-4">
        {model.role && (
          <div className="text-sm">
            <span className="font-medium">Role:</span> {model.role}
          </div>
        )}
        {model.system_message && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {model.system_message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <button
          onClick={() => onEdit(model)}
          className="p-2 hover:bg-blue-50 text-blue-600 rounded"
          aria-label="Edit model"
        >
          <AIIcons.Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(model.id)}
          className="p-2 hover:bg-red-50 text-red-600 rounded"
          aria-label="Delete model"
        >
          <AIIcons.Trash className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

## 🎯 Tips & Best Practices

### ✅ Do's

1. **Import from shared library**
   ```tsx
   // ✅ Good
   import { AIIcons } from '@/components/ai/_shared';
   
   // ❌ Bad - importing from specific file
   import { AIIcons } from '@/components/ai/_shared/components/AIIcons';
   ```

2. **Use TypeScript types**
   ```tsx
   // ✅ Good
   import type { AIModel, AIFieldErrors } from '@/components/ai/_shared';
   const [errors, setErrors] = useState<AIFieldErrors>({});
   ```

3. **Validate on change and blur**
   ```tsx
   // ✅ Good
   onChange={(e) => {
     handleChange('name', e.target.value);
     validateSingleField('name', e.target.value);
   }}
   onBlur={() => markFieldTouched('name')}
   ```

4. **Show errors only when touched**
   ```tsx
   // ✅ Good
   {getFieldError('name') && (
     <div className="text-red-600">{getFieldError('name')}</div>
   )}
   ```

### ❌ Don'ts

1. **Don't duplicate validation logic**
   ```tsx
   // ❌ Bad
   if (name.length < 2) {
     setError('Too short');
   }
   
   // ✅ Good
   const error = validateField('name', name);
   ```

2. **Don't create custom icons**
   ```tsx
   // ❌ Bad - creating own SVG
   <svg>...</svg>
   
   // ✅ Good - use shared icons
   <AIIcons.Plus />
   ```

3. **Don't hardcode popular models**
   ```tsx
   // ❌ Bad
   const models = ['GPT-4', 'Claude', ...];
   
   // ✅ Good
   import { POPULAR_MODELS } from '@/components/ai/_shared';
   ```

## 🔍 Troubleshooting

### Issue: TypeScript Import Errors

**Problem:**
```
Cannot find module '@/components/ai/_shared'
```

**Solution:**
Ensure your `tsconfig.json` has path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Validation Not Working

**Problem:**
Errors not showing after validation

**Solution:**
1. Ensure you're marking fields as touched:
   ```tsx
   onBlur={() => markFieldTouched('fieldName')}
   ```

2. Use `getFieldError()` instead of accessing `fieldErrors` directly:
   ```tsx
   {getFieldError('name')} // ✅ Only shows if touched
   {fieldErrors.name}      // ❌ Shows even if not touched
   ```

### Issue: Notification Not Dismissing

**Problem:**
Notification stays visible

**Solution:**
Provide `onClose` handler:
```tsx
<AINotification
  message="Success!"
  onClose={() => setMessage(null)} // ← Add this
  autoDismissDelay={5000}
/>
```

## 📖 More Resources

- **Full Documentation**: See `README.md` in `/components/ai/_shared/`
- **Architecture Diagram**: See `AI_SHARED_ARCHITECTURE_DIAGRAM.md`
- **Implementation Summary**: See `AI_SHARED_COMPONENTS_SUMMARY.md`
- **Type Definitions**: Browse `/components/ai/_shared/types/`

## 🆘 Need Help?

1. Check the full README in `/components/ai/_shared/README.md`
2. Look at type definitions for IntelliSense hints
3. See existing usage in `/admin/ai/management` or `/account/ai`
4. Contact the development team

---

**Happy coding! 🚀**
