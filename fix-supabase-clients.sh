#!/bin/bash

# Script to replace all createClient() calls with imports from singleton supabaseClient.js

# List of files to fix
files=(
  "src/components/AdminQuickActions/PageCreationModal.tsx"
  "src/components/ai/_shared/hooks/useModelManagement.ts"
  "src/components/ai/AiChatHistory.tsx"
  "src/components/ai/AiFlashcardsComponents/FlashcardModal.tsx"
  "src/components/ai/CardSyncPlanner.tsx"
  "src/components/ChatHelpWidget.tsx"
  "src/components/ChatHelpWidget/ChatWidgetWrapper.tsx"
  "src/components/EmailTemplates/_shared/hooks/useEmailTemplateManagement.ts"
  "src/components/HelpCenter/HelpCenterContainer.tsx"
  "src/components/MentionInput/MentionInput.tsx"
  "src/components/MentionsInbox/MentionsInbox.tsx"
  "src/components/modals/ChatHelpWidget/ChatWidgetWrapper.tsx"
  "src/components/modals/ChatWidget/ChatMessages.tsx"
  "src/components/modals/ChatWidget/ChatWidget.tsx"
  "src/components/modals/ChatWidget/FilesModal.tsx"
  "src/components/modals/ChatWidget/ShareFileModal.tsx"
  "src/components/modals/FooterEditModal/context.tsx"
  "src/components/modals/GlobalSettingsModal/GlobalSettingsModal.tsx"
  "src/components/modals/HeaderEditModal/context.tsx"
  "src/components/modals/HeroSectionModal/context.tsx"
  "src/components/modals/MeetingsModals/MeetingTypesModal/MeetingTypesSection.tsx"
  "src/components/modals/MeetingsModals/VideoCall/hooks/useCurrentUser.ts"
  "src/components/modals/MeetingsModals/VideoCall/hooks/useMeetingAIModels.ts"
  "src/components/modals/PageCreationModal/PageCreationModal.tsx"
  "src/components/modals/TemplateSectionModal/ProfileDataManager.tsx"
  "src/components/SiteManagement/AIAgentsSelect.tsx"
  "src/components/SiteManagement/sections/MeetingTypesSection.tsx"
  "src/components/TemplateSections/TeamMember.tsx"
  "src/components/TemplateSections/Testimonials.tsx"
)

echo "Fixing Supabase client imports in ${#files[@]} files..."

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Remove the createClient import line
    sed -i.bak '/^import.*createClient.*from.*@supabase\/supabase-js/d' "$file"
    
    # Remove the const supabase = createClient(...) blocks (handle multi-line)
    # This is tricky, so we'll use perl for multi-line matching
    perl -i.tmp -0pe 's/const supabase = createClient\([^)]*\);?\n?//gs' "$file"
    
    # Add the singleton import after the first import group (before the first blank line after imports)
    # Check if the import doesn't already exist
    if ! grep -q "from '@/lib/supabaseClient'" "$file"; then
      # Find the last import line and add our import after it
      awk '/^import/ {last=NR} NR==last+1 && /^$/ {print "import { supabase } from '\''@/lib/supabaseClient'\'';"; print; next} 1' "$file" > "$file.new"
      mv "$file.new" "$file"
    fi
    
    # Clean up backup files
    rm -f "$file.bak" "$file.tmp"
    
    echo "  ✓ Fixed: $file"
  else
    echo "  ✗ Not found: $file"
  fi
done

echo ""
echo "Done! Fixed ${#files[@]} files."
echo "Verifying remaining createClient calls..."
remaining=$(find src/components -name "*.tsx" -o -name "*.ts" | xargs grep -l "const supabase = createClient" 2>/dev/null | wc -l)
echo "Remaining files with createClient: $remaining"
