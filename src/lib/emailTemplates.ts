/**
 * Email Templates for Ticket Notifications
 * 
 * These templates are used to send various notifications to customers
 * throughout the ticket lifecycle. They use HTML for rich formatting
 * with fallback plain text versions.
 */

export interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody: string
}

interface TemplateData {
  customerName: string
  ticketId: string
  ticketSubject: string
  ticketUrl?: string
  supportEmail?: string
  companyName?: string
}

interface NewResponseData extends TemplateData {
  responseMessage: string
  adminName: string
}

interface StatusChangeData extends TemplateData {
  oldStatus: string
  newStatus: string
  statusMessage?: string
}

interface AssignmentData extends TemplateData {
  adminName: string
  adminEmail?: string
  estimatedResponseTime?: string
}

interface ClosureData extends TemplateData {
  resolutionSummary?: string
  ratingUrl?: string
}

interface RatingRequestData extends TemplateData {
  ratingUrl: string
}

/**
 * Brand colors and styling constants
 */
const BRAND_COLORS = {
  primary: '#3b82f6', // blue-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  text: '#1f2937', // gray-800
  textLight: '#6b7280', // gray-500
  background: '#f9fafb', // gray-50
  border: '#e5e7eb', // gray-200
}

/**
 * Common email styles
 */
const emailStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${BRAND_COLORS.text};
      background-color: ${BRAND_COLORS.background};
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }
    .header {
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #2563eb 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .message-box {
      background-color: ${BRAND_COLORS.background};
      border-left: 4px solid ${BRAND_COLORS.primary};
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background-color: ${BRAND_COLORS.primary};
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .footer {
      background-color: ${BRAND_COLORS.background};
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: ${BRAND_COLORS.textLight};
      border-top: 1px solid ${BRAND_COLORS.border};
    }
    .ticket-info {
      background-color: ${BRAND_COLORS.background};
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .ticket-info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid ${BRAND_COLORS.border};
    }
    .ticket-info-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: ${BRAND_COLORS.textLight};
    }
    .value {
      color: ${BRAND_COLORS.text};
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }
    .status-open {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-in-progress {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .status-closed {
      background-color: #d1fae5;
      color: #065f46;
    }
  </style>
`

/**
 * Email header component
 */
const emailHeader = (title: string) => `
  <div class="header">
    <h1>${title}</h1>
  </div>
`

/**
 * Email footer component
 */
const emailFooter = (data: TemplateData) => `
  <div class="footer">
    <p style="margin: 0 0 12px 0;">
      This is an automated message from ${data.companyName || 'our support team'}.
    </p>
    <p style="margin: 0 0 12px 0;">
      Need help? Contact us at ${data.supportEmail || 'support@example.com'}
    </p>
    <p style="margin: 0; font-size: 12px;">
      <a href="#" style="color: ${BRAND_COLORS.textLight}; text-decoration: none;">Unsubscribe</a> |
      <a href="#" style="color: ${BRAND_COLORS.textLight}; text-decoration: none;">Notification Preferences</a>
    </p>
  </div>
`

/**
 * Template: New Response Received
 * Sent when a support agent replies to a customer's ticket
 */
export function newResponseTemplate(data: NewResponseData): EmailTemplate {
  const subject = `New response to your ticket: ${data.ticketSubject}`
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        ${emailHeader('💬 New Response from Support')}
        
        <div class="content">
          <p>Hi ${data.customerName},</p>
          
          <p><strong>${data.adminName}</strong> has replied to your support ticket.</p>
          
          <div class="ticket-info">
            <div class="ticket-info-row">
              <span class="label">Ticket ID:</span>
              <span class="value">#${data.ticketId}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">Subject:</span>
              <span class="value">${data.ticketSubject}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">From:</span>
              <span class="value">${data.adminName}</span>
            </div>
          </div>
          
          <div class="message-box">
            <p style="margin: 0; white-space: pre-wrap;">${data.responseMessage}</p>
          </div>
          
          ${data.ticketUrl ? `
            <div style="text-align: center;">
              <a href="${data.ticketUrl}" class="button">View Ticket & Reply</a>
            </div>
          ` : ''}
          
          <p style="color: ${BRAND_COLORS.textLight}; font-size: 14px; margin-top: 24px;">
            💡 <strong>Quick Tip:</strong> Reply directly to this email to add your response to the ticket.
          </p>
        </div>
        
        ${emailFooter(data)}
      </div>
    </body>
    </html>
  `
  
  const textBody = `
New Response from Support

Hi ${data.customerName},

${data.adminName} has replied to your support ticket.

Ticket ID: #${data.ticketId}
Subject: ${data.ticketSubject}
From: ${data.adminName}

Message:
---
${data.responseMessage}
---

${data.ticketUrl ? `View and reply to your ticket: ${data.ticketUrl}` : ''}

💡 Quick Tip: Reply directly to this email to add your response to the ticket.

---
This is an automated message from ${data.companyName || 'our support team'}.
Need help? Contact us at ${data.supportEmail || 'support@example.com'}
  `
  
  return { subject, htmlBody, textBody }
}

/**
 * Template: Ticket Status Changed
 * Sent when a ticket's status is updated
 */
export function statusChangeTemplate(data: StatusChangeData): EmailTemplate {
  const subject = `Ticket status updated: ${data.ticketSubject}`
  
  const statusColor = 
    data.newStatus === 'closed' ? BRAND_COLORS.success :
    data.newStatus === 'in-progress' ? BRAND_COLORS.primary :
    BRAND_COLORS.warning
  
  const statusEmoji =
    data.newStatus === 'closed' ? '✅' :
    data.newStatus === 'in-progress' ? '🔄' :
    '📋'
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        ${emailHeader(`${statusEmoji} Ticket Status Updated`)}
        
        <div class="content">
          <p>Hi ${data.customerName},</p>
          
          <p>The status of your support ticket has been updated.</p>
          
          <div class="ticket-info">
            <div class="ticket-info-row">
              <span class="label">Ticket ID:</span>
              <span class="value">#${data.ticketId}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">Subject:</span>
              <span class="value">${data.ticketSubject}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">Previous Status:</span>
              <span class="value status-badge status-${data.oldStatus}">${data.oldStatus}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">New Status:</span>
              <span class="value status-badge status-${data.newStatus}">${data.newStatus}</span>
            </div>
          </div>
          
          ${data.statusMessage ? `
            <div class="message-box">
              <p style="margin: 0;">${data.statusMessage}</p>
            </div>
          ` : ''}
          
          ${data.ticketUrl ? `
            <div style="text-align: center;">
              <a href="${data.ticketUrl}" class="button">View Ticket Details</a>
            </div>
          ` : ''}
        </div>
        
        ${emailFooter(data)}
      </div>
    </body>
    </html>
  `
  
  const textBody = `
Ticket Status Updated

Hi ${data.customerName},

The status of your support ticket has been updated.

Ticket ID: #${data.ticketId}
Subject: ${data.ticketSubject}
Previous Status: ${data.oldStatus}
New Status: ${data.newStatus}

${data.statusMessage ? `\n${data.statusMessage}\n` : ''}

${data.ticketUrl ? `View ticket details: ${data.ticketUrl}` : ''}

---
This is an automated message from ${data.companyName || 'our support team'}.
Need help? Contact us at ${data.supportEmail || 'support@example.com'}
  `
  
  return { subject, htmlBody, textBody }
}

/**
 * Template: Ticket Assigned
 * Sent when a ticket is assigned to a support agent
 */
export function ticketAssignedTemplate(data: AssignmentData): EmailTemplate {
  const subject = `Your ticket has been assigned: ${data.ticketSubject}`
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        ${emailHeader('👤 Ticket Assigned')}
        
        <div class="content">
          <p>Hi ${data.customerName},</p>
          
          <p>Great news! Your support ticket has been assigned to <strong>${data.adminName}</strong>.</p>
          
          <div class="ticket-info">
            <div class="ticket-info-row">
              <span class="label">Ticket ID:</span>
              <span class="value">#${data.ticketId}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">Subject:</span>
              <span class="value">${data.ticketSubject}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">Assigned To:</span>
              <span class="value">${data.adminName}</span>
            </div>
            ${data.estimatedResponseTime ? `
              <div class="ticket-info-row">
                <span class="label">Expected Response:</span>
                <span class="value">${data.estimatedResponseTime}</span>
              </div>
            ` : ''}
          </div>
          
          <p>They'll review your request and get back to you as soon as possible.</p>
          
          ${data.ticketUrl ? `
            <div style="text-align: center;">
              <a href="${data.ticketUrl}" class="button">View Ticket Status</a>
            </div>
          ` : ''}
        </div>
        
        ${emailFooter(data)}
      </div>
    </body>
    </html>
  `
  
  const textBody = `
Ticket Assigned

Hi ${data.customerName},

Great news! Your support ticket has been assigned to ${data.adminName}.

Ticket ID: #${data.ticketId}
Subject: ${data.ticketSubject}
Assigned To: ${data.adminName}
${data.estimatedResponseTime ? `Expected Response: ${data.estimatedResponseTime}` : ''}

They'll review your request and get back to you as soon as possible.

${data.ticketUrl ? `View ticket status: ${data.ticketUrl}` : ''}

---
This is an automated message from ${data.companyName || 'our support team'}.
Need help? Contact us at ${data.supportEmail || 'support@example.com'}
  `
  
  return { subject, htmlBody, textBody }
}

/**
 * Template: Ticket Closed
 * Sent when a ticket is marked as resolved/closed
 */
export function ticketClosedTemplate(data: ClosureData): EmailTemplate {
  const subject = `Ticket resolved: ${data.ticketSubject}`
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        ${emailHeader('✅ Ticket Resolved')}
        
        <div class="content">
          <p>Hi ${data.customerName},</p>
          
          <p>Your support ticket has been marked as resolved.</p>
          
          <div class="ticket-info">
            <div class="ticket-info-row">
              <span class="label">Ticket ID:</span>
              <span class="value">#${data.ticketId}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">Subject:</span>
              <span class="value">${data.ticketSubject}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">Status:</span>
              <span class="value status-badge status-closed">Resolved</span>
            </div>
          </div>
          
          ${data.resolutionSummary ? `
            <div class="message-box">
              <p style="margin: 0; font-weight: 600;">Resolution Summary:</p>
              <p style="margin: 8px 0 0 0;">${data.resolutionSummary}</p>
            </div>
          ` : ''}
          
          <p>We hope we've addressed your issue. If you have any other questions or concerns, please don't hesitate to create a new ticket.</p>
          
          ${data.ratingUrl ? `
            <div style="background-color: ${BRAND_COLORS.background}; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 16px 0; font-weight: 600;">How did we do?</p>
              <p style="margin: 0 0 16px 0; color: ${BRAND_COLORS.textLight};">
                Your feedback helps us improve our support service.
              </p>
              <a href="${data.ratingUrl}" class="button">Rate This Support Experience</a>
            </div>
          ` : ''}
        </div>
        
        ${emailFooter(data)}
      </div>
    </body>
    </html>
  `
  
  const textBody = `
Ticket Resolved

Hi ${data.customerName},

Your support ticket has been marked as resolved.

Ticket ID: #${data.ticketId}
Subject: ${data.ticketSubject}
Status: Resolved

${data.resolutionSummary ? `\nResolution Summary:\n${data.resolutionSummary}\n` : ''}

We hope we've addressed your issue. If you have any other questions or concerns, please don't hesitate to create a new ticket.

${data.ratingUrl ? `\nHow did we do?\nYour feedback helps us improve our support service.\nRate this support experience: ${data.ratingUrl}\n` : ''}

---
This is an automated message from ${data.companyName || 'our support team'}.
Need help? Contact us at ${data.supportEmail || 'support@example.com'}
  `
  
  return { subject, htmlBody, textBody }
}

/**
 * Template: Rating Request
 * Sent to request customer satisfaction rating (can be sent separately from closure)
 */
export function ratingRequestTemplate(data: RatingRequestData): EmailTemplate {
  const subject = `We'd love your feedback on ticket: ${data.ticketSubject}`
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        ${emailHeader('⭐ Rate Your Support Experience')}
        
        <div class="content">
          <p>Hi ${data.customerName},</p>
          
          <p>We recently resolved your support ticket and we'd love to hear about your experience.</p>
          
          <div class="ticket-info">
            <div class="ticket-info-row">
              <span class="label">Ticket ID:</span>
              <span class="value">#${data.ticketId}</span>
            </div>
            <div class="ticket-info-row">
              <span class="label">Subject:</span>
              <span class="value">${data.ticketSubject}</span>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 12px; text-align: center; margin: 24px 0; color: white;">
            <p style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
              How satisfied were you with our support?
            </p>
            <p style="margin: 0 0 24px 0; opacity: 0.9;">
              Your feedback takes less than a minute and helps us improve.
            </p>
            <a href="${data.ratingUrl}" class="button" style="background-color: white; color: #667eea;">
              Take 1-Minute Survey
            </a>
          </div>
          
          <p style="text-align: center; color: ${BRAND_COLORS.textLight}; font-size: 14px;">
            Thank you for choosing ${data.companyName || 'our service'}! 🙏
          </p>
        </div>
        
        ${emailFooter(data)}
      </div>
    </body>
    </html>
  `
  
  const textBody = `
Rate Your Support Experience

Hi ${data.customerName},

We recently resolved your support ticket and we'd love to hear about your experience.

Ticket ID: #${data.ticketId}
Subject: ${data.ticketSubject}

How satisfied were you with our support?

Your feedback takes less than a minute and helps us improve.

Take 1-Minute Survey: ${data.ratingUrl}

Thank you for choosing ${data.companyName || 'our service'}!

---
This is an automated message from ${data.companyName || 'our support team'}.
Need help? Contact us at ${data.supportEmail || 'support@example.com'}
  `
  
  return { subject, htmlBody, textBody }
}

/**
 * Export all template functions
 */
export const emailTemplates = {
  newResponse: newResponseTemplate,
  statusChange: statusChangeTemplate,
  ticketAssigned: ticketAssignedTemplate,
  ticketClosed: ticketClosedTemplate,
  ratingRequest: ratingRequestTemplate,
}

/**
 * Export types
 */
export type {
  NewResponseData,
  StatusChangeData,
  AssignmentData,
  ClosureData,
  RatingRequestData,
}
