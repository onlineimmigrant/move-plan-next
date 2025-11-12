#!/usr/bin/env python3
import re

files_to_update = [
    ('src/components/modals/HeroSectionModal/sections/DescriptionStyleSection.tsx',
     'toggleColorPicker: (key: \'descriptionColor\') => void;',
     'toggleColorPicker: (key: \'descriptionColor\') => void;\n  primaryColor: string;',
     '  toggleColorPicker,',
     '  toggleColorPicker,\n  primaryColor,'),
    ('src/components/modals/HeroSectionModal/sections/ImageStyleSection.tsx',
     '  openImageGallery: () => void;',
     '  openImageGallery: () => void;\n  primaryColor: string;',
     '  openImageGallery,',
     '  openImageGallery,\n  primaryColor,'),
    ('src/components/modals/HeroSectionModal/sections/BackgroundStyleSection.tsx',
     'toggleColorPicker: (key: \'backgroundColor\' | \'backgroundGradientFrom\' | \'backgroundGradientVia\' | \'backgroundGradientTo\') => void;',
     'toggleColorPicker: (key: \'backgroundColor\' | \'backgroundGradientFrom\' | \'backgroundGradientVia\' | \'backgroundGradientTo\') => void;\n  primaryColor: string;',
     '  toggleColorPicker,',
     '  toggleColorPicker,\n  primaryColor,'),
    ('src/components/modals/HeroSectionModal/sections/AnimationSection.tsx',
     '  setFormData: (data: HeroFormData) => void;',
     '  setFormData: (data: HeroFormData) => void;\n  primaryColor: string;',
     '  setFormData,',
     '  setFormData,\n  primaryColor,'),
]

for filepath, old1, new1, old2, new2 in files_to_update:
    with open(filepath, 'r') as f:
        content = f.read()
    
    content = content.replace(old1, new1)
    content = content.replace(old2, new2)
    
    # Replace sky colors
    content = re.sub(r'focus:ring-sky-500', 'focus:ring-2" style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}', content)
    content = re.sub(r'text-sky-600 focus:ring-sky-500', 'focus:ring-2" style={{ color: primaryColor, "--tw-ring-color": primaryColor } as React.CSSProperties}', content)
    content = re.sub(r'bg-sky-100 text-sky-700 border-sky-300', 'border-2" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: primaryColor }}', content)
    content = re.sub(r'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100', 'border-2" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, borderColor: primaryColor }}', content)
    content = re.sub(r'bg-sky-600', '", content)
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Updated all files!")
