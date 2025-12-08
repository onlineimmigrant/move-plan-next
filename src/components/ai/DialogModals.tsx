// components/ai/DialogModals.tsx
import { Dialog, Transition, DialogPanel, DialogTitle } from '@headlessui/react';
import { Fragment, useEffect, useRef } from 'react';
import Button from '@/ui/Button';
import CloseIcon from '@/ui/CloseIcon';
import tutorialMaterials from '@/components/ai/AiModelsTutorialMaterials.json';

interface DialogModalProps {
  dialogKey: string;
  title: string;
  description: string;
  openDialog: string | null;
  setOpenDialog: (dialog: string | null) => void;
}

const DialogModal = ({ dialogKey, title, description, openDialog, setOpenDialog }: DialogModalProps) => {
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!descriptionRef.current || !openDialog) return;

    // Find all spans with cursor-pointer class (used for copyable text)
    const copyableSpans = descriptionRef.current.querySelectorAll('span.cursor-pointer');
    copyableSpans.forEach((span) => {
      // Extract the text to copy from the onclick attribute
      const onclickAttr = span.getAttribute('onclick');
      const textToCopy = onclickAttr?.match(/navigator\.clipboard\.writeText\("([^"]+)"\)/)?.[1];
      if (textToCopy) {
        // Remove the inline onclick to prevent React warnings
        span.removeAttribute('onclick');
        // Add click event listener for copying
        const handleClick = async () => {
          try {
            await navigator.clipboard.writeText(textToCopy);
            // Show visual feedback (temporary "Copied!" text)
            const originalText = span.textContent;
            span.textContent = 'Copied!';
            span.classList.add('text-green-600');
            setTimeout(() => {
              span.textContent = originalText;
              span.classList.remove('text-green-600');
            }, 1000);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        };
        span.addEventListener('click', handleClick);
        // Cleanup event listener
        return () => span.removeEventListener('click', handleClick);
      }
    });
  }, [openDialog, dialogKey]);

  return (
    <Transition show={openDialog === dialogKey} as={Fragment}>
      <Dialog onClose={() => setOpenDialog(null)} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="bg-white rounded-lg shadow-lg ring-1 ring-gray-200 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
              <Button
                variant="close"
                onClick={() => setOpenDialog(null)}
                className="absolute top-2 right-2 p-1"
                aria-label="Close modal"
              >
                <CloseIcon />
              </Button>
              <DialogTitle className="text-lg font-medium text-gray-800">{title}</DialogTitle>
              <Dialog.Description className="mt-2 text-sm text-gray-600">
                <div 
                  ref={descriptionRef} 
                  dangerouslySetInnerHTML={{ __html: description }}
                  className="prose prose-sm max-w-none [&_img]:max-w-full [&_img]:max-h-[400px] [&_img]:h-auto [&_img]:object-contain [&_img]:rounded-lg [&_img]:my-4 [&_img]:shadow-md [&_img]:mx-auto"
                />
              </Dialog.Description>
            </DialogPanel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};

interface DialogModalsProps {
  openDialog: string | null;
  setOpenDialog: (dialog: string | null) => void;
}

export default function DialogModals({ openDialog, setOpenDialog }: DialogModalsProps) {
  return (
    <>
      {tutorialMaterials.map((item) => (
        <DialogModal
          key={item.dialogKey}
          dialogKey={item.dialogKey}
          title={item.title}
          description={item.description}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
        />
      ))}
    </>
  );
}