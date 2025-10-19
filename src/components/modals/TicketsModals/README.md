# TicketsModals

Parent folder for all ticket-related modal components.

## Structure

```
TicketsModals/
├── shared/                    # Code shared between admin and customer modals
│   ├── components/           # Shared UI components (message bubbles, typing indicator, etc.)
│   ├── hooks/                # Shared React hooks (useTypingIndicator, useAutoScroll, etc.)
│   ├── utils/                # Shared utilities (formatting, validation, API helpers)
│   └── types/                # Shared TypeScript types (Ticket, TicketResponse, etc.)
├── TicketsAdminModal/        # Admin-specific ticket modal
│   ├── components/           # Admin-only components
│   ├── hooks/                # Admin-only hooks
│   ├── utils/                # Admin-only utilities
│   └── TicketsAdminModal.tsx
└── TicketsAccountModal/      # Customer-specific ticket modal
    ├── components/           # Customer-only components (to be created)
    ├── hooks/                # Customer-only hooks (to be created)
    ├── utils/                # Customer-only utilities (to be created)
    └── TicketsAccountModal.tsx
```

## Design Principles

1. **Shared First**: If code is used by both modals, it goes in `shared/`
2. **Single Responsibility**: Each folder has a clear purpose
3. **Type Safety**: Shared types ensure consistency between modals
4. **Maintainability**: Changes to shared code benefit both modals

## Phase 1: Folder Restructure ✅ COMPLETE
- Created parent TicketsModals folder
- Created shared/ subfolder structure
- Moved TicketsAdminModal to new location
- Moved TicketsAccountModal to new location
- Updated all import paths

## Phase 2: Extract Shared Code (In Progress)
- Identify sharable components, hooks, utils, types
- Move from TicketsAdminModal to shared/
- Update imports in TicketsAdminModal

## Phase 3: Apply to Customer Modal (Planned)
- Import shared code into TicketsAccountModal
- Remove inline duplicates
- Test functionality

## Phase 4: Extract Customer-Specific (Planned)
- Create TicketsAccountModal subfolder structure
- Extract customer-specific components
- Extract customer-specific hooks
