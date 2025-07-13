"use client";
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MetaTags } from '@/components/MetaTags';
import { StructuredData } from '@/components/StructuredData';
import FeedbackAccordion from '@/components/FeedbackAccordion';
import DotGrid from '@/components/AnimateElements/DotGrid';
import ShapeBlur from '@/components/AnimateElements/ShapeBlur';
import LetterGlitch from '@/components/AnimateElements/LetterGlitch';
import Masonry from '@/components/AnimateElements/Masonry';
import Stepper from '@/components/AnimateElements/Stepper';
import Privacy from '@/components/Privacy';
import Terms from '@/components/Terms';
import ContactModal from '@/components/ContactModal';

// Define TypeScript interfaces for Stepper
interface StepContent {
  type: 'text' | 'image' | 'custom';
  value: string;
  className: string;
}

interface StepConfig {
  id: string;
  title: string;
  content: StepContent[];
}

const steps: StepConfig[] = [
  {
    id: 'step1',
    title: 'Welcome to the React Bits stepper!',
    content: [
      { type: 'text', value: 'Check out the next step!', className: 'text-center text-lg' },
    ],
  },
  {
    id: 'step2',
    title: 'Step 2',
    content: [
      { type: 'text', value: 'Custom step content!', className: 'text-center text-lg' },
    ],
  },
  {
    id: 'step3',
    title: 'How about an input?',
    content: [{ type: 'text', value: '', className: 'text-center text-lg' }],
  },
  {
    id: 'step4',
    title: 'Final Step',
    content: [{ type: 'text', value: 'You made it!', className: 'text-center text-lg' }],
  },
];

export default function Investors() {
  const path = `investors`;
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

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
      <div className='mt-16'>
        <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
        <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

        <Stepper
          steps={steps}
          initialStep={1}
          onStepChange={(step) => console.log(step)}
          onFinalStepCompleted={() => console.log('All steps completed!')}
          backButtonText="Prev"
          nextButtonText="Next"
        />

        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
          <DotGrid
            dotSize={36}
            gap={256}
            baseColor="#f9fafb"
            activeColor="#f9fafb"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>

        <div style={{ position: 'relative', height: '800px', overflow: 'hidden' }}>
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