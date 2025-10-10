# Base Modal Components

A flexible, composable modal system for React with support for static, draggable, and resizable modals.

## Components

### `<Modal>`
The root modal component that handles:
- Portal rendering
- Backdrop management
- Escape key handling
- Body scroll prevention
- Accessibility (role, aria-modal)

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose?: () => void` - Close handler
- `closeOnBackdropClick?: boolean` - Default: true
- `closeOnEscape?: boolean` - Default: true
- `zIndex?: number` - Default: 60

### `<ModalContent>`
The modal content wrapper with positioning and sizing:
- Static centered mode (default)
- Draggable mode (with `draggable` prop)
- Resizable mode (with `resizable` prop)
- Fullscreen mode (with `fullscreen` prop)

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'` - Default: 'lg'
- `draggable?: boolean` - Enable drag functionality
- `resizable?: boolean` - Enable resize functionality
- `fullscreen?: boolean` - Fullscreen mode

### `<ModalBackdrop>`
The backdrop/overlay behind the modal.

**Props:**
- `onClick?: () => void` - Click handler
- `blur?: boolean` - Apply backdrop blur (default: true)

### `<ModalHeader>`
Standardized header with title, subtitle, and action buttons.

**Props:**
- `title: string` - Main title
- `subtitle?: string` - Optional subtitle
- `onClose?: () => void` - Close button handler
- `onToggleFullscreen?: () => void` - Fullscreen toggle handler
- `isFullscreen?: boolean` - Fullscreen state
- `showCloseButton?: boolean` - Default: true
- `showFullscreenButton?: boolean` - Default: false
- `actions?: ReactNode` - Custom action buttons

### `<ModalBody>`
Scrollable content area.

**Props:**
- `noPadding?: boolean` - Remove default padding
- `scrollable?: boolean` - Enable scroll (default: true)

### `<ModalFooter>`
Footer with action buttons.

**Props:**
- `align?: 'left' | 'center' | 'right' | 'between'` - Default: 'right'

## Usage Examples

### Basic Modal
```tsx
import { Modal, ModalContent, ModalBackdrop, ModalHeader, ModalBody, ModalFooter } from '@/ui/Modal';
import Button from '@/ui/Button';

function BasicModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <ModalBackdrop onClick={() => setIsOpen(false)} />
      <ModalContent size="md">
        <ModalHeader 
          title="Create New Page" 
          subtitle="Enter page details"
          onClose={() => setIsOpen(false)}
        />
        <ModalBody>
          <form>
            {/* Your form fields */}
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

### Draggable & Resizable Modal
```tsx
function DraggableModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <ModalBackdrop onClick={() => setIsOpen(false)} />
      <ModalContent 
        size="lg"
        draggable={!isFullscreen}
        resizable={!isFullscreen}
        fullscreen={isFullscreen}
      >
        <div className="modal-drag-handle cursor-move">
          <ModalHeader 
            title="Global Settings" 
            subtitle="Manage site configuration"
            onClose={() => setIsOpen(false)}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            isFullscreen={isFullscreen}
            showFullscreenButton
          />
        </div>
        <ModalBody>
          {/* Content */}
        </ModalBody>
        <ModalFooter>
          <Button>Save Changes</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

### Fullscreen Modal
```tsx
function FullscreenModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <ModalBackdrop onClick={() => setIsOpen(false)} />
      <ModalContent fullscreen>
        <ModalHeader 
          title="Post Editor" 
          onClose={() => setIsOpen(false)}
        />
        <ModalBody noPadding>
          {/* Full editor */}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
```

## Draggable Feature

For draggable modals, wrap the header (or any section you want to be the drag handle) with a div that has the className `modal-drag-handle`:

```tsx
<div className="modal-drag-handle cursor-move">
  <ModalHeader {...props} />
</div>
```

This allows users to click and drag the modal from that specific area.

## Styling

All components accept a `className` prop for custom styling. The components use Tailwind CSS with a clean, modern design that includes:

- Neomorphic shadow effects
- Smooth transitions
- Responsive sizing
- Accessibility features

## Composition

These components are designed to be composable. You can:
- Mix and match components
- Add custom content between sections
- Override styles with className
- Extend with custom hooks
- Create preset modal configurations

## Next Steps

See `/components/modals/_shared/` for higher-level modal utilities built on these primitives.
