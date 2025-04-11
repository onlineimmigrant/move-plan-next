// src/components/EditDeleteButton.tsx
import Link from 'next/link';

export default function EditDeleteButton({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href} className="text-blue-500 hover:underline">
      {title}
    </Link>
  );
}