//app/investors/page.tsx
"use client"
import Link from 'next/link';
import { MetaTags } from '@/components/MetaTags';
import { StructuredData } from '@/components/StructuredData';
import FeedbackAccordion from '@/components/FeedbackAccordion';


import DotGrid from '@/components/AnimateElements/DotGrid';
 import ShapeBlur from '@/components/AnimateElements/ShapeBlur';
  import LetterGlitch from '@/components/AnimateElements/LetterGlitch';
  import Masonry from '@/components/AnimateElements/Masonry';



export default function Investors() {
    const path = `investors`;

const items = [
    {
      id: "1",
      img: "https://picsum.photos/id/1015/600/900?grayscale",
      url: "https://example.com/one",
      height: 400,
    },
    {
      id: "2",
      img: "https://picsum.photos/id/1011/600/750?grayscale",
      url: "https://example.com/two",
      height: 250,
    },
    {
      id: "3",
      img: "https://picsum.photos/id/1020/600/800?grayscale",
      url: "https://example.com/three",
      height: 600,
    },
    
];
  return (
    <>
   
     
      
<div className='mt-16 '>





  


<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DotGrid
    dotSize={36}
    gap={256}
    baseColor="#0ea5e9"
    activeColor="#0ea5e9"
    proximity={120}
    shockRadius={250}
    shockStrength={5}
    resistance={750}
    returnDuration={1.5}
  />

</div>
 

<div style={{position: 'relative', height: '800px', overflow: 'hidden'}}>

<ShapeBlur
  variation={0}
  pixelRatioProp={window.devicePixelRatio || 1}
  shapeSize={0.5}
  roundness={0.5}
  borderSize={0.05}
  circleSize={0.5}
  circleEdge={1}
/>
</div>





<Masonry
  items={items}
  ease="power3.out"
  duration={0.6}
  stagger={0.05}
  animateFrom="bottom"
  scaleOnHover={true}
  hoverScale={0.95}
  blurToFocus={true}
  colorShiftOnHover={false}
/>

</div>
</>
  );
}