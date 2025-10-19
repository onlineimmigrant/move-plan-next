/**
 * Process ticket responses to flatten attachments structure
 * 
 * Supabase returns attachments as a nested `ticket_attachments` array.
 * This utility flattens that to a simpler `attachments` property.
 * 
 * @param responses - Raw responses from Supabase with ticket_attachments
 * @returns Processed responses with flattened attachments
 * 
 * @example
 * const processed = processTicketResponses(responsesData);
 * // Before: response.ticket_attachments
 * // After: response.attachments
 */
export function processTicketResponses(responses: any[]): any[] {
  return (responses || []).map((response: any) => ({
    ...response,
    attachments: response.ticket_attachments || []
  }));
}
