import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';

/**
 * Gets table attributes from a node at a given position
 */
export function getTableAttributes(node: ProseMirrorNode, pos: number, view: EditorView): Record<string, any> {
  const resolved = view.state.doc.resolve(pos);
  let currentNode: ProseMirrorNode = node;
  let currentPos = pos;

  for (let depth = resolved.depth; depth >= 0; depth--) {
    const parent = resolved.node(depth);
    if (parent.type.name === 'table') {
      return parent.attrs;
    }
    currentPos = resolved.before(depth);
    currentNode = resolved.node(depth);
  }

  return {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: '#e5e7eb',
    backgroundColor: 'transparent',
  };
}

/**
 * Plugin to apply inline border styles during editing
 */
export function createEditingStylePlugin() {
  return new Plugin({
    key: new PluginKey('tableEditingStyle'),
    view(editorView: EditorView) {
      return {
        update: () => {
          const tables = editorView.dom.querySelectorAll('.tiptap-table') as NodeListOf<HTMLElement>;
          tables.forEach((table) => {
            table.classList.add('editing');
            const attrs = table.dataset;
            const borderStyle = attrs.borderStyle || 'solid';
            const borderWidth = attrs.borderWidth || '1px';
            const borderColor = attrs.borderColor || '#e5e7eb';
            const border = borderStyle === 'none' ? 'none' : `${borderStyle} ${borderWidth} ${borderColor}`;
            const backgroundColor = attrs.backgroundColor || 'transparent';
            const cells = table.querySelectorAll('.tiptap-table-cell');
            const headers = table.querySelectorAll('.tiptap-table-header');
            cells.forEach((cell) => {
              (cell as HTMLElement).style.border = border;
            });
            headers.forEach((header) => {
              (header as HTMLElement).style.border = border;
              (header as HTMLElement).style.backgroundColor = backgroundColor;
            });
          });
        },
      };
    },
  });
}

/**
 * Resize plugin for draggable table borders
 */
export function createResizePlugin() {
  return new Plugin({
    key: new PluginKey('tableResize'),
    view(editorView: EditorView) {
      return {
        update: () => {
          const tables = editorView.dom.querySelectorAll('.tiptap-table') as NodeListOf<HTMLElement>;
          tables.forEach((table) => {
            table.classList.add('editing');
            addResizeHandles(table, editorView);
          });
        },
        destroy: () => {
          document.querySelectorAll('.resize-handle').forEach((handle) => handle.remove());
        },
      };
    },
  });
}

/**
 * Adds resize handles to table cells and rows
 */
function addResizeHandles(table: HTMLElement, editorView: EditorView) {
  table.querySelectorAll('.resize-handle').forEach((handle) => handle.remove());

  const rows = table.querySelectorAll('tr') as NodeListOf<HTMLElement>;
  const headerRow = table.querySelector('tr');
  if (headerRow) {
    const cells = headerRow.querySelectorAll('th, td') as NodeListOf<HTMLElement>;
    cells.forEach((cell, index) => {
      const handle = document.createElement('div');
      handle.className = 'resize-handle column-resize';
      handle.style.cssText = `
        position: absolute;
        top: 0;
        right: -4px;
        width: 8px;
        height: 100%;
        cursor: col-resize;
        background: transparent;
        z-index: 10;
      `;
      cell.style.position = 'relative';
      cell.appendChild(handle);

      handle.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        startColumnResize(e, table, index, editorView);
      });
      handle.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        startColumnResize(e, table, index, editorView);
      });
    });
  }

  rows.forEach((row, index) => {
    const handle = document.createElement('div');
    handle.className = 'resize-handle row-resize';
    handle.style.cssText = `
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 8px;
      cursor: row-resize;
      background: transparent;
      z-index: 10;
    `;
    row.style.position = 'relative';
    row.appendChild(handle);

    handle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      startRowResize(e, table, index, editorView);
    });
    handle.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      startRowResize(e, table, index, editorView);
    });
  });
}

/**
 * Starts column resizing interaction
 */
function startColumnResize(e: MouseEvent | TouchEvent, table: HTMLElement, colIndex: number, editorView: EditorView) {
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const startX = clientX;
  const cells = Array.from(table.querySelectorAll(`tr > *:nth-child(${colIndex + 1})`)) as HTMLElement[];
  const startWidth = cells[0].getBoundingClientRect().width;

  const onMove = (moveEvent: MouseEvent | TouchEvent) => {
    moveEvent.preventDefault();
    const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const delta = currentX - startX;
    const newWidth = Math.max(50, startWidth + delta);
    cells.forEach((cell) => {
      cell.style.width = `${newWidth}px`;
      cell.style.minWidth = `${newWidth}px`;
    });
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchend', onEnd);
    editorView.focus();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
}

/**
 * Starts row resizing interaction
 */
function startRowResize(e: MouseEvent | TouchEvent, table: HTMLElement, rowIndex: number, editorView: EditorView) {
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const startY = clientY;
  const row = table.querySelectorAll('tr')[rowIndex] as HTMLElement;
  const startHeight = row.getBoundingClientRect().height;

  const onMove = (moveEvent: MouseEvent | TouchEvent) => {
    moveEvent.preventDefault();
    const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
    const delta = currentY - startY;
    const newHeight = Math.max(20, startHeight + delta);
    row.style.height = `${newHeight}px`;
    row.style.minHeight = `${newHeight}px`;
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchend', onEnd);
    editorView.focus();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
}
