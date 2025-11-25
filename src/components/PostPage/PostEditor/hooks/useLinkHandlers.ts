import { Editor } from '@tiptap/react';

export interface LinkHandlers {
  setLink: () => void;
  handleLinkSave: (url: string) => void;
  handleUnlink: () => void;
}

export function useLinkHandlers(
  editor: Editor | null,
  setShowLinkModal: (show: boolean) => void,
  setCurrentLinkUrl: (url: string) => void
): LinkHandlers {
  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setCurrentLinkUrl(previousUrl || '');
    setShowLinkModal(true);
  };

  const handleLinkSave = (url: string) => {
    if (!editor) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
    setShowLinkModal(false);
  };

  const handleUnlink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  };

  return {
    setLink,
    handleLinkSave,
    handleUnlink,
  };
}
