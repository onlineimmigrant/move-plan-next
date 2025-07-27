// Test ChatHelpWidget integration
'use client';
import ChatHelpWidget from '@/components/ChatHelpWidget';

export default function TestChatHelp() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ChatHelpWidget Test</h1>
      <p className="mb-4">Testing the widget with real database content and HTML rendering</p>
      <ChatHelpWidget />
    </div>
  );
}
