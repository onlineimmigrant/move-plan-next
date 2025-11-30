# Question Library Autocomplete Feature

## Overview
When editing form questions, users can now see intelligent suggestions from the Question Library as they type. This makes it easy to reuse existing, well-crafted questions across multiple forms.

## How It Works

### 1. **Start Typing**
When you begin typing in the "Type your question here..." field, the system automatically searches the Question Library for matching questions.

### 2. **View Suggestions**
A dropdown menu appears showing up to 5 matching questions from your library, displaying:
- Question label and description
- Question type (email, text, multiple choice, etc.)
- Category and tags
- Usage count (how many forms use this question)

### 3. **Navigate & Select**
- Use **↑↓** arrow keys to navigate through suggestions
- Press **Enter** to select a suggestion
- Press **Esc** to close the suggestions menu
- Click on any suggestion to select it

### 4. **Auto-Fill**
When you select a library question, it automatically fills in:
- Question type
- Label text
- Description
- Placeholder
- Options (for multiple choice, dropdown, etc.)
- Validation rules
- Links the question to the library template

## Features

### Smart Search
- Searches both question labels and descriptions
- Minimum 2 characters required to trigger suggestions
- 300ms debounce to avoid excessive API calls
- Results ranked by usage count (most popular first)

### Visual Indicators
- Each suggestion shows an emoji icon for the question type
- Category badges for easy identification
- Usage statistics to see which questions are most popular
- Type badge showing the field type

### Keyboard Shortcuts
- **↑↓**: Navigate suggestions
- **Enter**: Select current suggestion
- **Esc**: Close suggestions menu
- **/** (slash): Open field type menu (existing feature)

## Integration with Question Library

### Linked Questions
When you select a library question:
- It creates a link to the library template via `question_library_id`
- The question inherits all properties from the library
- You can still customize individual instances with overrides

### Custom Questions
If you type your own question instead of selecting from the library:
- The question is created as a custom, one-off question
- `question_library_id` remains `null`
- All data is stored locally in the form

## Benefits

1. **Consistency**: Reuse well-tested questions across forms
2. **Efficiency**: No need to retype common questions
3. **Discovery**: Find existing questions you might have forgotten about
4. **Standards**: Encourage use of standardized questions in your organization
5. **Analytics**: See which questions are most popular via usage counts

## Technical Implementation

### Components
- `QuestionLibrarySuggestions.tsx` - Autocomplete dropdown UI
- `useQuestionLibrarySuggestions.ts` - Hook managing suggestions state
- `QuestionEditor.tsx` - Updated to show suggestions
- `FormsTab.tsx` - Integration point

### API Endpoint
```
GET /api/question-library?search={query}
```
Returns matching questions from the library, limited to 5 results.

### State Management
- Tracks active question being edited
- Manages search query and selected index
- Handles keyboard navigation
- Auto-closes on outside click or Esc key

## Future Enhancements

- [ ] Filter by category while typing (e.g., "category:contact")
- [ ] Show recently used questions first
- [ ] Inline question preview
- [ ] Bulk import questions from library
- [ ] AI-powered question suggestions based on form context
