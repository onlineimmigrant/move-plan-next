// Load environment variables
require('dotenv').config();

// Import dependencies
const { createClient } = require('@supabase/supabase-js');
const EPub = require('epub'); // Use node-epub library
const fetch = require('node-fetch'); // Use node-fetch@2 for CommonJS compatibility
const fs = require('fs').promises; // For writing TOC to a local file
const { DOMParser } = require('xmldom'); // For parsing toc.xhtml
const JSZip = require('jszip'); // For accessing EPUB archive

// Debug: Verify EPub constructor
console.log('EPub constructor:', typeof EPub);

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYm1kZmFvb3dxYmdzaGp1d3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NzkxNTIsImV4cCI6MjA1NzM1NTE1Mn0.sjcyJPSZvgiSbxeFMU9HX19GBHkm4XXP1LC-OxChKI8';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin credentials (loaded from environment variables for security)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'avelitch@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ave19751202.';

// Base URL for your app (adjust if running locally or on a deployed server)
const BASE_URL = 'http://localhost:3000';

// Function to normalize href values by removing prefixes like OPS/ or OEBPS/
function normalizeHref(href) {
  if (!href) return null;
  // Remove OPS/ or OEBPS/ prefixes, preserving the rest of the path
  return href.replace(/^(OPS\/|OEBPS\/)/, '');
}

// Function to authenticate and get an access token
async function authenticateAdmin() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }

    console.log('Authenticated as admin:', data.user.id);
    return data.session.access_token;
  } catch (error) {
    console.error('Error authenticating admin:', error);
    throw error;
  }
}

// Function to fetch study materials
async function fetchStudyMaterials() {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .select('id, lesson_id, file_path, file_type');

    if (error) {
      throw new Error(`Error fetching study materials: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching study materials:', error);
    throw error;
  }
}

// Function to generate SAS URL
async function generateSasUrl(accessToken, filePath, lessonId) {
  try {
    console.log('Fetch function:', typeof fetch);
    console.log('Generating SAS URL for file:', filePath, 'with lessonId:', lessonId);

    const response = await fetch(`${BASE_URL}/api/generate-sas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        filePath,
        lessonId: lessonId.toString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate SAS URL: ${errorText}`);
    }

    const { sasUrl } = await response.json();
    console.log('Generated SAS URL:', sasUrl);
    return sasUrl;
  } catch (error) {
    console.error('Error generating SAS URL for file:', filePath, error);
    throw error;
  }
}

// Function to extract TOC from EPUB
async function extractEpubToc(sasUrl, materialId) {
  let toc = [];
  const outputPath = `./toc_${materialId}.json`;

  try {
    console.log('Fetching EPUB from SAS URL:', sasUrl);
    const response = await fetch(sasUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch EPUB: ${response.statusText}`);
    }
    const epubArrayBuffer = await response.arrayBuffer();
    const epubBuffer = Buffer.from(epubArrayBuffer);

    // Save EPUB temporarily to disk (node-epub requires a file path)
    const tempEpubPath = `./temp_${materialId}.epub`;
    try {
      await fs.writeFile(tempEpubPath, epubBuffer);
      console.log('Temporary EPUB saved to:', tempEpubPath);
    } catch (writeError) {
      throw new Error(`Failed to save temporary EPUB: ${writeError.message}`);
    }

    // Initialize EPub
    console.log('Initializing EPub with file:', tempEpubPath);
    const book = new EPub(tempEpubPath);

    // Wait for book to be ready
    try {
      await new Promise((resolve, reject) => {
        book.on('end', () => {
          console.log('EPub parsing completed.');
          resolve();
        });
        book.on('error', (error) => {
          console.error('EPub parsing error:', error);
          reject(error);
        });
        book.parse();
      });
    } catch (parseError) {
      throw new Error(`Failed to parse EPUB: ${parseError.message}`);
    }

    // Debug: Log metadata and TOC
    console.log('Book metadata:', JSON.stringify(book.metadata, null, 2));
    console.log('Book TOC:', JSON.stringify(book.toc, null, 2));

    // Try standard TOC
    try {
      toc = book.toc.map((item, index) => ({
        label: item.title || `Section ${index + 1}`,
        href: normalizeHref(item.href) || null,
      }));
      console.log('Extracted standard TOC:', JSON.stringify(toc, null, 2));
    } catch (tocError) {
      console.error('Error accessing standard TOC:', tocError);
      toc = [];
    }

    // If standard TOC is empty or invalid, try parsing toc.xhtml
    if (toc.length === 0 || !toc.some(item => item.label)) {
      console.log('No valid standard TOC found, attempting to parse toc.xhtml...');
      try {
        // Load EPUB as a ZIP archive
        const zip = await JSZip.loadAsync(epubBuffer);
        const tocFile = zip.file('toc.xhtml') || zip.file('OEBPS/toc.xhtml');
        if (!tocFile) {
          throw new Error('toc.xhtml not found in EPUB.');
        }

        const tocContent = await tocFile.async('string');
        console.log('toc.xhtml content:', tocContent);

        // Parse toc.xhtml as HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(tocContent, 'text/html');
        const navItems = doc.querySelectorAll('nav[epub\\:type="toc"] ol li a');
        console.log('Found nav items:', navItems.length);

        toc = Array.from(navItems).map((item, index) => ({
          label: item.textContent.trim() || `Section ${index + 1}`,
          href: normalizeHref(item.getAttribute('href')) || null,
        }));

        console.log('Parsed TOC from toc.xhtml:', JSON.stringify(toc, null, 2));
      } catch (tocError) {
        console.error('Error parsing toc.xhtml:', tocError);
        // Fallback: Generate a basic TOC from flow
        try {
          toc = book.flow.map((item, index) => ({
            label: item.id || `Section ${index + 1}`,
            href: normalizeHref(item.href) || null,
          }));
          console.log('Fallback TOC from flow:', JSON.stringify(toc, null, 2));
        } catch (flowError) {
          console.error('Error generating fallback TOC from flow:', flowError);
          toc = [];
        }
      }
    }

    // Log detailed TOC items
    console.log('Generated TOC items:');
    if (toc.length === 0) {
      console.log('  No TOC items found.');
    } else {
      toc.forEach((item, index) => {
        console.log(`  Item ${index + 1}:`);
        console.log(`    Label: ${item.label || 'Untitled Section'}`);
        console.log(`    Href: ${item.href || 'null'}`);
        console.log(`    Order: ${index}`);
      });
    }

    // Map TOC for return
    toc = toc.map((item, index) => ({
      topic: item.label || 'Untitled Section',
      href: item.href || null,
      order: index,
    }));

    // Clean up temporary EPUB file
    try {
      await fs.unlink(tempEpubPath);
      console.log('Temporary EPUB file deleted:', tempEpubPath);
    } catch (unlinkError) {
      console.error('Error deleting temporary EPUB file:', unlinkError);
    }
  } catch (error) {
    console.error('Error extracting EPUB TOC:', error);
    toc = [];
    console.log('Generating empty TOC due to error.');
  }

  // Always save TOC to local JSON file
  try {
    await fs.writeFile(outputPath, JSON.stringify(toc, null, 2));
    console.log(`TOC saved locally to: ${outputPath}`);
  } catch (error) {
    console.error('Error saving TOC to local JSON:', error);
  }

  return toc;
}

// Function to store TOC in material_toc table and verify
async function storeToc(materialId, toc) {
  try {
    // Log the TOC data being inserted
    console.log('Preparing to insert TOC for material:', materialId);
    console.log('TOC data to insert:', JSON.stringify(toc, null, 2));

    // Delete existing TOC entries for this material
    const { error: deleteError } = await supabase
      .from('material_toc')
      .delete()
      .eq('material_id', materialId);

    if (deleteError) {
      throw new Error(`Failed to delete existing TOC: ${deleteError.message}`);
    }
    console.log('Deleted existing TOC entries for material:', materialId);

    // Insert new TOC entries (if any)
    if (toc.length > 0) {
      const { data, error } = await supabase
        .from('material_toc')
        .insert(
          toc.map((item) => ({
            material_id: materialId,
            topic: item.topic,
            page_number: null,
            href: item.href,
            order: item.order,
          }))
        )
        .select(); // Return inserted data

      if (error) {
        throw new Error(`Failed to store TOC: ${error.message}`);
      }

      console.log('TOC stored successfully for material:', materialId);
      console.log('Inserted TOC data from Supabase:', JSON.stringify(data, null, 2));
    } else {
      console.log('No TOC items to insert into Supabase.');
    }

    // Verify the inserted data by fetching it
    const { data: fetchedData, error: fetchError } = await supabase
      .from('material_toc')
      .select('*')
      .eq('material_id', materialId)
      .order('order', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch stored TOC: ${fetchError.message}`);
    }

    console.log('Fetched TOC from material_toc:', JSON.stringify(fetchedData, null, 2));

    return fetchedData;
  } catch (error) {
    console.error('Error storing TOC for material:', materialId, error);
    throw error;
  }
}

// Main function to process all study materials
async function main() {
  try {
    // Step 1: Authenticate as admin
    const accessToken = await authenticateAdmin();

    // Step 2: Fetch study materials
    const materials = await fetchStudyMaterials();
    console.log('Found study materials:', materials);

    // Step 3: Process each EPUB material
    for (const material of materials) {
      if (material.file_type !== 'epub') {
        console.log(`Skipping non-EPUB material: ${material.id} (${material.file_type})`);
        continue;
      }

      console.log(`Processing material: ${material.id} (${material.file_path})`);

      // Step 4: Generate SAS URL
      const sasUrl = await generateSasUrl(accessToken, material.file_path, material.lesson_id);

      // Step 5: Extract TOC
      const toc = await extractEpubToc(sasUrl, material.id);

      // Step 6: Store TOC and verify
      await storeToc(material.id, toc);
    }

    console.log('All materials processed successfully.');
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run the script
main();