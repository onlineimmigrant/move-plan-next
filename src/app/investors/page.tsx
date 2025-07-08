//app/investors/page.tsx

import Link from 'next/link';
import { MetaTags } from '@/components/MetaTags';
import { StructuredData } from '@/components/StructuredData';
import FeedbackAccordion from '@/components/FeedbackAccordion';


export default function Investors() {
    const path = `investors`;
  return (
    <>
      <MetaTags path={path} />
      <StructuredData path={path} />
     
      
<div className='mt-16 '>

</div>
</>
  );
}