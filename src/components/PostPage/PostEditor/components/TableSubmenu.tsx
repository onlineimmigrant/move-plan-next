'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import Button from '@/ui/Button';

interface TableSubmenuProps {
  editor: Editor;
  applyStyle: (style: string) => void;
}

export const TableSubmenu: React.FC<TableSubmenuProps> = ({ editor, applyStyle }) => {
  return (
    <div className="border-b border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap gap-1">
        <Button
          size="sm"
          onClick={() => applyStyle('table')}
          variant="primary"
        >
          Insert Table
        </Button>
        {editor.isActive('table') && (
          <>
            <div className="w-px bg-gray-300 mx-2"></div>
            <Button
              size="sm"
              onClick={() => applyStyle('addRowAfter')}
              variant="outline"
            >
              + Row
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('addColumnAfter')}
              variant="outline"
            >
              + Column
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('deleteRow')}
              variant="outline"
            >
              - Row
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('deleteColumn')}
              variant="outline"
            >
              - Column
            </Button>
            <div className="w-px bg-gray-300 mx-2"></div>
            <Button
              size="sm"
              onClick={() => applyStyle('mergeCells')}
              variant="outline"
            >
              Merge
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('splitCell')}
              variant="outline"
            >
              Split
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('deleteTable')}
              variant="outline"
            >
              Delete Table
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
