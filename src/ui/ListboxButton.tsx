import { forwardRef } from 'react';
import { Listbox } from '@headlessui/react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'start' | 'close' | 'link' | 'outline' | 'card-sync-plannner';

interface ListboxButtonProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  [key: string]: any; // Allow additional props
}

const getVariantStyles = (variant: Variant = 'primary'): string => {
  switch (variant) {
    case 'primary':
      return 'py-1 shadow-lg bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500';
    case 'secondary':
      return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
    case 'start':
      return 'w-full font-medium bg-sky-600 text-white font-semibold py-2 rounded-lg hover:bg-sky-700 active:bg-sky-800 focus:ring-2 focus:ring-sky-500 transition-all duration-200 shadow-md hover:shadow-lg';
    case 'close':
      return 'absolute top-2 right-2 text-gray-700 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-gray-500';
    case 'link':
      return 'text-sky-600 hover:text-sky-700 focus:ring-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500';
    case 'outline':
      return ' shadow-sm bg-transparent border border-gray-300 text-gray-700 hover:border-sky-600 hover:text-sky-600 focus:ring-sky-500';
    case 'card-sync-plannner':
      return 'py-1 shadow-lg  text-white';
    default:
      return 'shadow-lg bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500'; // Fallback to primary
  }
};

const ListboxButton = forwardRef<HTMLButtonElement, ListboxButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const baseStyles = `
      cursor-pointer inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 
      sm:px-6  text-sm sm:text-sm transition-all duration-300 ease-in-out 
      focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    `;

    return (
      <Listbox.Button
        as="button"
        ref={ref}
        className={cn(baseStyles, getVariantStyles(variant), className)}
        {...props}
      >
        {children}
      </Listbox.Button>
    );
  }
);

ListboxButton.displayName = 'ListboxButton';

export default ListboxButton;