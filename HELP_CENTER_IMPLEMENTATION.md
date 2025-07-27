# Help Center Implementation

## Overview
A dedicated help center page that provides a full-page experience using all ChatHelpWidget components and logic. This maintains the widget's functionality while offering an expanded interface for better user experience.

## Features

### 🏠 **Help Center Landing**
- Welcome interface with search functionality
- Quick action buttons for common tasks
- Popular articles display
- Responsive grid layouts (1 column → 2 columns → 4 columns)

### 📚 **Knowledge Base**
- Full articles browser with categories
- Real-time search across content
- Article detail view with HTML content rendering
- DOMPurify sanitization for security

### ❓ **FAQ Section**
- Expandable frequently asked questions
- Search functionality across questions and answers
- Real database integration

### 💬 **Live Support**
- Chat interface for customer support
- Message history and real-time messaging
- User authentication integration

### 🤖 **AI Assistant**
- AI-powered help assistant
- Intelligent responses and guidance
- Seamless integration with user accounts

## Technical Implementation

### Page Structure
```
/app/[locale]/help-center/page.tsx
├── HelpCenterPage.tsx (Main component)
└── Uses existing ChatHelpWidget components:
    ├── WelcomeTab
    ├── ArticlesTab
    ├── FAQView
    ├── ConversationTab
    └── AIAgentTab
```

### Key Benefits
1. **Component Reuse**: All existing ChatHelpWidget logic preserved
2. **Responsive Design**: Adapts to fullscreen layout
3. **Navigation**: Header tabs and breadcrumb navigation
4. **Accessibility**: Proper ARIA labels and keyboard navigation
5. **Performance**: Static generation with locale support

### Database Integration
- Real FAQ data from `faq` table
- Real article data from `blog_post` table
- Organization-based filtering
- Site name from `settings` table

### Styling
- Consistent with ChatHelpWidget sky color scheme
- Responsive grid layouts based on screen size
- Tailwind CSS for consistent styling
- Loading states and error handling

## Usage

### Accessing the Help Center
Navigate to: `/[locale]/help-center`

Examples:
- `/en/help-center`
- `/es/help-center`
- `/fr/help-center`

### Navigation
- **Header Tabs**: Primary navigation between sections
- **Mobile**: Horizontal scrollable tabs
- **Breadcrumbs**: Context awareness
- **Back Buttons**: Contextual navigation (where applicable)

## Responsive Behavior

### Screen Sizes
- **Mobile**: Single column layout, horizontal tab scroll
- **Tablet**: 2-column grids for quick actions and articles
- **Desktop**: 4-column grids for maximum content density

### Widget Size Mapping
- Help Center uses `size="fullscreen"` for all components
- Components automatically adapt to expanded layout
- Maintains consistent height across all tabs (750px equivalent)

## Maintenance

### Adding New Features
1. Add new tab to `tabs` array in HelpCenterPage
2. Create new case in `renderActiveTab()` switch
3. Import the corresponding component
4. Update navigation logic if needed

### Customization
- Colors: Modify sky color scheme variables
- Layout: Adjust grid configurations in WelcomeTab
- Content: Update through existing ChatHelpWidget APIs

## SEO & Performance
- **Static Generation**: Pre-rendered for all supported locales
- **Metadata**: Proper title, description, and OpenGraph tags
- **Internationalization**: Full locale support
- **Lazy Loading**: Components render only when active

## Security
- **HTML Sanitization**: DOMPurify for article content
- **Authentication**: Integrated with existing auth system
- **Input Validation**: Search queries and user inputs sanitized
