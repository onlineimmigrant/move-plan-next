import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Parse file content for AI analysis
 * Supports: PDF, DOCX, TXT, MD, Images (Grok Vision)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileIds } = await request.json();
    
    if (!fileIds || !Array.isArray(fileIds)) {
      return NextResponse.json({ error: 'File IDs array required' }, { status: 400 });
    }

    // Get files from database
    const { data: files, error: filesError } = await supabaseAdmin
      .from('chat_files')
      .select('*')
      .in('id', fileIds)
      .eq('user_id', user.id);

    if (filesError || !files || files.length === 0) {
      return NextResponse.json({ error: 'Files not found' }, { status: 404 });
    }

    const parsedFiles = [];

    for (const file of files) {
      try {
        let content = '';
        const mimeType = file.mime_type;

        // Download file from storage
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('chat-files')
          .download(file.file_path);

        if (downloadError || !fileData) {
          console.error('Download error:', downloadError);
          parsedFiles.push({
            id: file.id,
            name: file.file_name,
            content: `[Error: Could not download file]`,
            error: downloadError?.message
          });
          continue;
        }

        // Parse based on file type
        if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
          // Plain text and markdown
          content = await fileData.text();
        } 
        else if (mimeType === 'application/pdf') {
          // PDF - extract full text content using pdf2json (Node.js compatible)
          try {
            const PDFParser = (await import('pdf2json')).default;
            const pdfParser = new (PDFParser as any)(null, 1);
            
            const arrayBuffer = await fileData.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);
            
            // Parse PDF with promise wrapper
            const pdfData = await new Promise((resolve, reject) => {
              pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
              pdfParser.on('pdfParser_dataReady', (pdfData: any) => resolve(pdfData));
              pdfParser.parseBuffer(pdfBuffer);
            });
            
            // Extract text from parsed data
            const pages = (pdfData as any).Pages || [];
            const textParts: string[] = [];
            
            for (const page of pages) {
              const texts = page.Texts || [];
              const pageText = texts
                .map((text: any) => {
                  const encodedText = text.R.map((r: any) => r.T).join(' ');
                  try {
                    return decodeURIComponent(encodedText);
                  } catch (e) {
                    // If decoding fails, return the raw text
                    return encodedText;
                  }
                })
                .join(' ');
              textParts.push(pageText);
            }
            
            content = textParts.join('\n\n');
            console.log(`[Parse] Extracted ${pages.length} pages from PDF: ${file.file_name}`);
          } catch (pdfError: any) {
            console.error('[Parse] PDF parsing error:', pdfError);
            content = `[PDF Document: ${file.file_name}]\nSize: ${(file.file_size / 1024).toFixed(2)} KB\n\nError extracting content: ${pdfError.message}`;
          }
        }
        else if (
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mimeType === 'application/msword'
        ) {
          // DOCX/DOC - extract text using mammoth
          try {
            const mammoth = await import('mammoth');
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const result = await mammoth.extractRawText({ buffer });
            content = result.value;
            
            if (result.messages && result.messages.length > 0) {
              console.log(`[Parse] DOCX parsing messages:`, result.messages);
            }
            
            console.log(`[Parse] Extracted ${content.length} characters from DOCX: ${file.file_name}`);
          } catch (docxError: any) {
            console.error('[Parse] DOCX parsing error:', docxError);
            content = `[Word Document: ${file.file_name}]\nSize: ${(file.file_size / 1024).toFixed(2)} KB\n\nError extracting content: ${docxError.message}`;
          }
        }
        else if (mimeType.startsWith('image/')) {
          // Images - analyze with Vision AI (Grok, GPT-4, or Claude)
          try {
            // First try user's custom models
            let visionSettings = await supabaseAdmin
              .from('ai_models')
              .select('api_key, endpoint, name')
              .eq('user_id', user.id)
              .or('name.ilike.%grok%,name.ilike.%gpt-4%,name.ilike.%claude%,endpoint.ilike.%x.ai%,endpoint.ilike.%openai%,endpoint.ilike.%anthropic%')
              .limit(1);

            // If not found, try system models
            if (!visionSettings.data || visionSettings.data.length === 0) {
              visionSettings = await supabaseAdmin
                .from('ai_models_system')
                .select('api_key, endpoint, name')
                .or('name.ilike.%grok%,name.ilike.%gpt-4%,name.ilike.%claude%,endpoint.ilike.%x.ai%,endpoint.ilike.%openai%,endpoint.ilike.%anthropic%')
                .limit(1);
            }

            // If still not found, try default models
            if (!visionSettings.data || visionSettings.data.length === 0) {
              visionSettings = await supabaseAdmin
                .from('ai_models_default')
                .select('api_key, endpoint, name')
                .or('name.ilike.%grok%,name.ilike.%gpt-4%,name.ilike.%claude%,endpoint.ilike.%x.ai%,endpoint.ilike.%openai%,endpoint.ilike.%anthropic%')
                .limit(1);
            }

            console.log('[Parse] Vision AI settings query result:', { 
              found: !!(visionSettings.data && visionSettings.data.length > 0), 
              count: visionSettings.data?.length || 0,
              error: visionSettings.error?.message,
              firstResult: visionSettings.data?.[0] ? { 
                name: visionSettings.data[0].name, 
                hasKey: !!visionSettings.data[0].api_key,
                endpoint: visionSettings.data[0].endpoint 
              } : null
            });

            if (visionSettings.error || !visionSettings.data || visionSettings.data.length === 0 || !visionSettings.data[0]?.api_key) {
              console.log('[Parse] No Vision AI API key found in user settings, skipping image analysis');
              content = `[Image: ${file.file_name}]\nType: ${mimeType}\nSize: ${(file.file_size / 1024).toFixed(2)} KB\n\nNote: To analyze images, please configure a Vision AI model (Grok, GPT-4 Vision, or Claude Vision) in your settings.`;
            } else {
              const modelName = visionSettings.data[0].name.toLowerCase();
              const endpoint = visionSettings.data[0].endpoint || '';
              
              // Determine which vision provider and model to use
              let visionModel = '';
              let baseURL = '';
              
              if (modelName.includes('grok') || endpoint.includes('x.ai')) {
                visionModel = 'grok-2-vision-1212'; // Grok's vision model
                baseURL = 'https://api.x.ai/v1';
              } else if (modelName.includes('gpt-4') || endpoint.includes('openai')) {
                // Use GPT-4 Vision models
                if (modelName.includes('gpt-4o')) {
                  visionModel = 'gpt-4o'; // GPT-4o has vision built-in
                } else {
                  visionModel = 'gpt-4-vision-preview'; // Legacy GPT-4 Vision
                }
                baseURL = 'https://api.openai.com/v1';
              } else if (modelName.includes('claude') || endpoint.includes('anthropic')) {
                // Claude 3.5 Sonnet has vision
                visionModel = 'claude-3-5-sonnet-20241022';
                baseURL = 'https://api.anthropic.com/v1';
              } else {
                // Fallback to Grok
                visionModel = 'grok-2-vision-1212';
                baseURL = 'https://api.x.ai/v1';
              }

              console.log(`[Parse] Using vision model: ${visionModel} from ${baseURL}`);

              // Get signed URL for AI to access the image
              const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
                .from('chat-files')
                .createSignedUrl(file.file_path, 3600); // 1 hour expiry

              if (urlError || !signedUrlData?.signedUrl) {
                throw new Error('Failed to create signed URL for image');
              }

              console.log(`[Parse] Analyzing image with ${visionModel}: ${file.file_name}`);

              // Handle Claude's different API format
              if (modelName.includes('claude')) {
                const anthropic = await import('@anthropic-ai/sdk');
                const client = new anthropic.default({
                  apiKey: visionSettings.data[0].api_key,
                });

                const visionResponse = await client.messages.create({
                  model: visionModel,
                  max_tokens: 1000,
                  messages: [
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'image',
                          source: {
                            type: 'url',
                            url: signedUrlData.signedUrl,
                          },
                        },
                        {
                          type: 'text',
                          text: 'Analyze this image in detail. Describe what you see, including any text, objects, people, colors, layout, and context. Be thorough and specific.'
                        }
                      ]
                    }
                  ]
                });

                content = visionResponse.content[0]?.type === 'text' 
                  ? visionResponse.content[0].text 
                  : '[No description generated]';
              } else {
                // OpenAI-compatible API (Grok and GPT-4)
                const visionClient = new OpenAI({
                  apiKey: visionSettings.data[0].api_key,
                  baseURL: baseURL
                });

                const visionResponse = await visionClient.chat.completions.create({
                  model: visionModel,
                  messages: [
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'text',
                          text: 'Analyze this image in detail. Describe what you see, including any text, objects, people, colors, layout, and context. Be thorough and specific.'
                        },
                        {
                          type: 'image_url',
                          image_url: {
                            url: signedUrlData.signedUrl,
                            detail: 'high' // High detail for better analysis
                          }
                        }
                      ]
                    }
                  ],
                  max_tokens: 1000,
                  temperature: 0.3 // Lower temperature for more consistent analysis
                });

                content = visionResponse.choices[0]?.message?.content || '[No description generated]';
              }

              console.log(`[Parse] Vision analysis complete: ${content.length} characters`);
            }

          } catch (imageError: any) {
            console.error('[Parse] Vision AI error:', imageError);
            content = `[Image: ${file.file_name}]\nType: ${mimeType}\nSize: ${(file.file_size / 1024).toFixed(2)} KB\n\nError analyzing image: ${imageError.message}`;
          }
        }
        else {
          content = `[Unsupported file type: ${mimeType}]`;
        }

        parsedFiles.push({
          id: file.id,
          name: file.file_name,
          type: mimeType,
          size: file.file_size,
          content: content.substring(0, 10000), // Limit to 10KB per file
          truncated: content.length > 10000
        });

      } catch (parseError: any) {
        console.error('Parse error:', parseError);
        parsedFiles.push({
          id: file.id,
          name: file.file_name,
          content: `[Error parsing file: ${parseError.message}]`,
          error: parseError.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      files: parsedFiles
    });

  } catch (error: any) {
    console.error('Parse files error:', error);
    return NextResponse.json({ 
      error: 'Failed to parse files',
      details: error.message 
    }, { status: 500 });
  }
}
