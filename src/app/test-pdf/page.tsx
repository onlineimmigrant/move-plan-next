'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use a verified CDN link for the worker script
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.2.133/build/pdf.worker.min.js';

export default function TestPdf() {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  console.log('TestPdf props:', { pdfUrl, pageNumber });

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error('PDF load error:', err);
    setError(`Failed to load PDF: ${err.message}`);
  }

  return (
    <div className="p-4">
      <h1>Test PDF Viewer</h1>
      <p className="text-gray-600 mb-2">
        PDF URL: <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600">{pdfUrl}</a>
      </p>
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <div className="border rounded-lg shadow-lg min-h-[500px]">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<p>Loading PDF...</p>}
              noData={<p>No PDF data available.</p>}
              error={<p>Failed to load PDF.</p>}
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onLoadSuccess={() => console.log('Page loaded successfully')}
                onRenderSuccess={() => console.log('Page rendered successfully')}
                onRenderError={(err) => console.error('Page render error:', err)}
              />
            </Document>
          </div>
          {numPages && (
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber === 1}
                className="px-4 py-2 bg-sky-600 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {pageNumber} of {numPages}</span>
              <button
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber === numPages}
                className="px-4 py-2 bg-sky-600 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}