'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PageSectionsContextType {
  templateSections: any[];
  templateHeadingSections: any[];
  setTemplateSections: (sections: any[]) => void;
  setTemplateHeadingSections: (sections: any[]) => void;
}

const PageSectionsContext = createContext<PageSectionsContextType | undefined>(undefined);

export function PageSectionsProvider({ 
  children,
  initialTemplateSections = [],
  initialTemplateHeadingSections = []
}: { 
  children: ReactNode;
  initialTemplateSections?: any[];
  initialTemplateHeadingSections?: any[];
}) {
  const [templateSections, setTemplateSections] = useState(initialTemplateSections);
  const [templateHeadingSections, setTemplateHeadingSections] = useState(initialTemplateHeadingSections);

  return (
    <PageSectionsContext.Provider 
      value={{ 
        templateSections, 
        templateHeadingSections,
        setTemplateSections,
        setTemplateHeadingSections
      }}
    >
      {children}
    </PageSectionsContext.Provider>
  );
}

export function usePageSections() {
  const context = useContext(PageSectionsContext);
  if (context === undefined) {
    return {
      templateSections: [],
      templateHeadingSections: [],
      setTemplateSections: () => {},
      setTemplateHeadingSections: () => {}
    };
  }
  return context;
}
