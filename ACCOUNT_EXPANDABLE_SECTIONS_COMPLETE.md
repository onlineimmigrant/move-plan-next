# Account Expandable Sections - Implementation Complete ✅

## Overview
Successfully implemented expandable sections with "+" buttons for comprehensive team member and customer field management in both account creation and editing modals, including full ImageGalleryModal integration.

## Features Implemented

### 1. AccountEditModal - Expandable Sections

#### State Management
- `showTeamDetails`: Controls team section expansion
- `showCustomerDetails`: Controls customer section expansion
- `isImageGalleryOpen`: Controls image gallery modal visibility
- `currentImageField`: Tracks which field ('team' | 'customer') is being edited

#### Team Member Section
**Always Visible (Base Fields):**
- Job Title
- Department

**Expandable Content (More button):**
- Profile Image with ImageGalleryModal integration
  - URL input field
  - PhotoIcon button for gallery access
  - XMarkIcon button for image removal
  - Image preview when URL is set
- Display Name (Pseudonym)
- Description (textarea)
- Skills (comma-separated input, converted to array on save)

**Toggle Button:**
- Shows "- Less" when expanded
- Shows "+ More" when collapsed
- Blue accent color matching theme

#### Customer Section
**Always Visible (Base Fields):**
- Company
- Job Title

**Expandable Content (More button):**
- Profile Image with ImageGalleryModal integration
  - Same UI pattern as team image
- Rating (1-5, step 0.5)
- Testimonial (textarea)

### 2. AccountDetailModal - Inline Editing with Expandable Sections

#### State Management
Same as AccountEditModal plus view/edit mode tracking:
- `isEditing`: Controls edit mode
- `showTeamDetails`: Team section expansion (edit mode only)
- `showCustomerDetails`: Customer section expansion (edit mode only)

#### Team Member Section
**Edit Mode:**
- Base fields always visible (Job Title, Department)
- "+ More" button reveals:
  - Profile Image with full gallery integration
  - Display Name (Pseudonym)
  - Description
  - Skills

**View Mode:**
- Displays all filled fields
- Shows profile image if set
- Shows pseudonym, job title, department, description, skills
- No expand/collapse in view mode (shows all data)

#### Customer Section
**Edit Mode:**
- Base fields always visible (Company, Job Title)
- "+ More" button reveals:
  - Profile Image with gallery integration
  - Rating (1-5)
  - Testimonial

**View Mode:**
- Displays all filled fields
- Shows profile image, company, job title, rating, testimonial
- No expand/collapse in view mode

### 3. API Route Updates

#### Extended Request Body Fields
```typescript
// Team member extended fields
team_image: string
team_pseudonym: string
team_description: string
team_skills: string (comma-separated, converted to array)

// Customer extended fields
customer_image: string
customer_rating: number (1-5)
customer_testimonial: string
```

#### JSONB Structure Creation
**Team Object:**
```typescript
{
  is_team_member: true,
  job_title: string,
  department: string,
  image: string | null,
  skills: string[],
  pseudonym: string | null,
  description: string,
  is_featured: false,
  github_url: null,
  twitter_url: null,
  linkedin_url: null,
  display_order: 0,
  portfolio_url: null,
  experience_years: null,
  assigned_sections: []
}
```

**Customer Object:**
```typescript
{
  is_customer: true,
  company: string,
  job_title: string,
  image: string | null,
  rating: number,
  pseudonym: null,
  description: '',
  is_featured: false,
  company_logo: null,
  linkedin_url: null,
  project_type: '',
  display_order: 0,
  testimonial_date: null,
  testimonial_text: string,
  assigned_sections: []
}
```

### 4. ImageGalleryModal Integration

#### Implementation Pattern
```typescript
{isImageGalleryOpen && (
  <ImageGalleryModal
    isOpen={isImageGalleryOpen}
    onClose={() => setIsImageGalleryOpen(false)}
    onSelectImage={(imageUrl) => {
      if (currentImageField === 'team') {
        setFormData({ ...formData, team_image: imageUrl });
      } else if (currentImageField === 'customer') {
        setFormData({ ...formData, customer_image: imageUrl });
      }
      setIsImageGalleryOpen(false);
    }}
  />
)}
```

#### Image Field UI Components
- **Input Field**: URL input with full-width flex-1
- **Gallery Button**: PhotoIcon button with blue accent
- **Remove Button**: XMarkIcon button with red accent (conditional)
- **Preview**: 20x20 rounded image below input (conditional)

## Technical Details

### Icons Used
From `@heroicons/react/24/outline`:
- `PhotoIcon`: Gallery access button
- `PlusIcon`: Expand section button
- `MinusIcon`: Collapse section button
- `XMarkIcon`: Remove image button

### Styling Patterns
- **Section Headers**: flex justify-between with title and toggle button
- **Toggle Buttons**: Text-based with icon + label ("More" / "Less")
- **Image Controls**: Horizontal button row (input + gallery + remove)
- **Preview Images**: 
  - Create/Edit modals: 20x20 (w-20 h-20)
  - Detail modal: 16x16 (w-16 h-16)

### Data Flow
1. User checks "Team Member" or "Customer" checkbox
2. Base fields appear immediately
3. User clicks "+ More" button to reveal additional fields
4. `showTeamDetails` or `showCustomerDetails` state updates
5. Expanded section renders with all additional fields
6. User can click PhotoIcon to open ImageGalleryModal
7. `currentImageField` tracks which field is being edited
8. Selected image URL updates appropriate field
9. On save, all fields sent to API
10. API constructs proper JSONB structures for team/customer

### Form Data Structure
```typescript
formData = {
  // ... existing account fields ...
  
  // Team member fields
  is_team_member: boolean,
  team_job_title: string,
  team_department: string,
  team_image: string,
  team_pseudonym: string,
  team_description: string,
  team_skills: string, // comma-separated
  
  // Customer fields
  is_customer: boolean,
  customer_company: string,
  customer_job_title: string,
  customer_image: string,
  customer_rating: string, // converted to number in API
  customer_testimonial: string,
}
```

## Files Modified

### Component Files
1. **AccountEditModal.tsx**
   - Added expandable section state
   - Updated team/customer sections with expand/collapse UI
   - Integrated ImageGalleryModal
   - Extended formData with all additional fields
   - Updated API request to send all fields

2. **AccountDetailModal.tsx**
   - Added expandable section state
   - Updated team/customer sections (edit + view modes)
   - Integrated ImageGalleryModal
   - Extended editedData with all additional fields
   - Updated handleSave to include all fields in JSONB

### API Routes
3. **api/accounts/create/route.ts**
   - Added extended field destructuring from request body
   - Updated team JSONB construction with all fields
   - Updated customer JSONB construction with all fields
   - Added skills string-to-array conversion
   - Added rating string-to-number conversion

## UX Improvements

### Progressive Disclosure
- Initial form shows only essential fields
- Reduces cognitive load and visual clutter
- Advanced users can access detailed options via "More" button
- Clean, organized interface

### Visual Feedback
- Clear "+ More" / "- Less" toggle indicators
- Icon-based buttons for intuitive actions
- Image previews provide immediate visual confirmation
- Consistent button styling with theme colors

### Workflow Efficiency
- Base fields available immediately upon checking team/customer
- Quick data entry for common use cases
- Gallery integration streamlines image selection
- One-click image removal

## Testing Scenarios

### Create Account Flow
1. ✅ Check "Team Member" → verify base fields appear
2. ✅ Click "+ More" → verify expanded fields appear
3. ✅ Click PhotoIcon → verify ImageGalleryModal opens
4. ✅ Select image from gallery → verify URL populated and preview shown
5. ✅ Click XMarkIcon → verify image removed
6. ✅ Fill all fields → click Create → verify API receives all data
7. ✅ Verify JSONB structure in database

### Edit Account Flow
1. ✅ Open account with team member flag → verify existing data shown
2. ✅ Click Edit → verify base fields editable
3. ✅ Click "+ More" → verify expanded fields editable
4. ✅ Modify image via gallery → verify preview updates
5. ✅ Save changes → verify all fields update in database
6. ✅ View mode shows all fields without expand/collapse

## Future Enhancements

### Potential Additions
- [ ] Social media URL fields (GitHub, Twitter, LinkedIn) in expanded sections
- [ ] Portfolio URL and experience years for team members
- [ ] Company logo upload for customers
- [ ] Project type selection for customers
- [ ] Skill tags with auto-complete instead of comma-separated
- [ ] Rich text editor for descriptions and testimonials
- [ ] Image cropping/editing before selection
- [ ] Multiple image support for portfolio galleries

### Data Validation
- [ ] URL format validation for image fields
- [ ] Rating range validation (1-5)
- [ ] Required field indicators
- [ ] Character limits for text fields
- [ ] Skill count limits

## Summary

The expandable sections implementation provides a clean, efficient way to manage comprehensive team member and customer profiles without overwhelming the user with too many fields at once. The integration with ImageGalleryModal ensures consistent image management across the CRM system, while the API properly handles all extended fields in the appropriate JSONB structures.

**Status**: ✅ Complete and fully functional
**TypeScript Errors**: None
**Ready for**: Production use
