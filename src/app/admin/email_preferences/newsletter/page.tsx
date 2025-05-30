'use client';

import { useState } from 'react';

export default function NewsletterAdmin() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSendNewsletter = async () => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter', title, content }),
      });

      if (!response.ok) throw new Error('Failed to send newsletter');
      alert('Newsletter sent!');
    } catch (error) {
      console.error('Error sending newsletter:', error);
      alert('Error sending newsletter.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <input
        type="text"
        placeholder="Newsletter Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <textarea
        placeholder="Newsletter Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <button onClick={handleSendNewsletter} className="bg-teal-500 text-white p-2 rounded">
        Send Newsletter
      </button>
    </div>
  );
}