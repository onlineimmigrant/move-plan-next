// lib/styles.ts
export const styles = {
  buttonToggle: (isActive: boolean) =>
    `w-1/2 border-2 border-sky-500 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-sky-500 text-white shadow-md'
        : 'text-sky-500 hover:bg-sky-100 active:bg-sky-200 focus:ring-2 focus:ring-sky-400'
    }`,
  buttonPrimary:
    'w-full bg-sky-600 text-white font-semibold py-3 rounded-lg hover:bg-sky-700 active:bg-sky-800 focus:ring-2 focus:ring-sky-500 transition-all duration-200 shadow-md hover:shadow-lg',
  checkbox:
    'h-4 w-4 rounded border-gray-300 bg-white text-gray-600 focus:ring-2 focus:ring-gray-400',
  topicLabel:
    'flex cursor-pointer items-center justify-between border-b border-gray-200 p-3 hover:bg-gray-100 last:border-b-0',
  partialSelectionText: 'text-sm text-gray-500 mt-1', // New style for partial selection message
};