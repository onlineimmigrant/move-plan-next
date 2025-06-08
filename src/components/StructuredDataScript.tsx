// src/components/StructuredDataScript.tsx
import { FC } from 'react';

interface StructuredDataScriptProps {
  data: any;
  index: number;
}

const StructuredDataScript: FC<StructuredDataScriptProps> = ({ data, index }) => {
  if (!data || typeof data !== 'object' || !data['@context'] || !data['@type']) {
    console.warn('Invalid structured data:', data);
    return null;
  }

  return (
    <script
      key={`structured-data-${index}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: `\n${JSON.stringify(data, null, 2)}\n` }}
    />
  );
};

export default StructuredDataScript;