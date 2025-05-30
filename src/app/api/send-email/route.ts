import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import WelcomeEmail from '../../../emails/WelcomeEmail';

export async function POST(request: Request) {
  try {
    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in environment variables');
      return NextResponse.json({ error: 'Server configuration error: Missing RESEND_API_KEY' }, { status: 500 });
    }

    // Initialize Resend client inside the handler
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { type, to, name } = await request.json();

    // Validate request body
    if (!type || !to || !name) {
      console.error('Invalid request body:', { type, to, name });
      return NextResponse.json({ error: 'Missing required fields: type, to, or name' }, { status: 400 });
    }

    if (type !== 'welcome') {
      console.error('Invalid email type:', type);
      return NextResponse.json({ error: 'Invalid email type. Only "welcome" is supported.' }, { status: 400 });
    }

    // Render the email HTML
    let emailHtml: string;
    try {
      const rendered = await render(WelcomeEmail({ name }), { pretty: true });
      console.log('Rendered output type:', typeof rendered);
      console.log('Rendered output:', rendered);
      if (typeof rendered !== 'string' || !rendered) {
        throw new Error('Rendered email HTML is not a valid string');
      }
      emailHtml = rendered;
    } catch (renderError: any) {
      console.error('Error rendering WelcomeEmail:', renderError);
      const errorMessage = renderError.message || 'Unknown rendering error';
      return NextResponse.json({ error: 'Failed to render email template', details: errorMessage }, { status: 500 });
    }

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: 'Your App <no-reply@metexam.co.uk>',
      to,
      subject: 'Welcome to Our Platform!',
      html: emailHtml,
    });

    // Check if Resend API returned an error
    if (emailResponse.error) {
      console.error('Resend API error:', emailResponse.error);
      return NextResponse.json({ error: 'Failed to send email via Resend', details: emailResponse.error }, { status: 500 });
    }

    console.log('Welcome email sent successfully:', emailResponse);
    return NextResponse.json({ message: 'Welcome email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/send-email:', error);
    const errorMessage = error.message || 'Unknown error';
    return NextResponse.json({ error: 'Failed to send email', details: errorMessage }, { status: 500 });
  }
}