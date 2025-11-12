#!/bin/bash

# Update DescriptionStyleSection
sed -i '' 's/toggleColorPicker: (key: .descriptionColor.) => void;/toggleColorPicker: (key: '\''descriptionColor'\'') => void;\n  primaryColor: string;/' src/components/modals/HeroSectionModal/sections/DescriptionStyleSection.tsx
sed -i '' 's/  toggleColorPicker,/  toggleColorPicker,\n  primaryColor,/' src/components/modals/HeroSectionModal/sections/DescriptionStyleSection.tsx

# Update ImageStyleSection  
sed -i '' 's/  openImageGallery: () => void;/  openImageGallery: () => void;\n  primaryColor: string;/' src/components/modals/HeroSectionModal/sections/ImageStyleSection.tsx
sed -i '' 's/  openImageGallery,/  openImageGallery,\n  primaryColor,/' src/components/modals/HeroSectionModal/sections/ImageStyleSection.tsx

# Update BackgroundStyleSection
sed -i '' 's/toggleColorPicker: (key: .backgroundColor. | .backgroundGradientFrom. | .backgroundGradientVia. | .backgroundGradientTo.) => void;/toggleColorPicker: (key: '\''backgroundColor'\'' | '\''backgroundGradientFrom'\'' | '\''backgroundGradientVia'\'' | '\''backgroundGradientTo'\'') => void;\n  primaryColor: string;/' src/components/modals/HeroSectionModal/sections/BackgroundStyleSection.tsx
sed -i '' 's/  toggleColorPicker,/  toggleColorPicker,\n  primaryColor,/' src/components/modals/HeroSectionModal/sections/BackgroundStyleSection.tsx

# Update AnimationSection
sed -i '' 's/  setFormData: (data: HeroFormData) => void;/  setFormData: (data: HeroFormData) => void;\n  primaryColor: string;/' src/components/modals/HeroSectionModal/sections/AnimationSection.tsx
sed -i '' 's/  setFormData,/  setFormData,\n  primaryColor,/' src/components/modals/HeroSectionModal/sections/AnimationSection.tsx

echo "Updated all section interfaces"
