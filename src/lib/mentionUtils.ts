import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ParsedMention {
  admin_id: string;
  admin_name: string;
  mention_text: string;
  position: number;
}

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  organization_id: string;
}

/**
 * Parse @mentions from text and return admin IDs and positions
 * 
 * @param text - The text to parse
 * @param admins - List of available admins to match against
 * @returns Array of parsed mentions with admin IDs
 */
export function parseMentions(text: string, admins: Admin[]): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  const mentionRegex = /@(\w+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[1];
    
    // Find admin by name (case-insensitive, spaces removed)
    const admin = admins.find(
      (a) =>
        a.full_name.toLowerCase().replace(/\s+/g, '') === mentionText.toLowerCase()
    );

    if (admin) {
      mentions.push({
        admin_id: admin.id,
        admin_name: admin.full_name,
        mention_text: `@${mentionText}`,
        position: match.index,
      });
    }
  }

  return mentions;
}

/**
 * Extract context snippet around a mention
 * 
 * @param text - The full text
 * @param position - Position of the mention
 * @param contextLength - Number of characters before/after (default: 50)
 * @returns Context snippet with mention highlighted
 */
export function extractMentionContext(
  text: string,
  position: number,
  contextLength: number = 50
): string {
  const start = Math.max(0, position - contextLength);
  const end = Math.min(text.length, position + contextLength);
  
  let snippet = text.substring(start, end);
  
  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet.trim();
}

/**
 * Create mention records in database
 * 
 * @param ticketId - The ticket ID
 * @param responseId - The response ID (if in a response)
 * @param organizationId - Organization ID
 * @param mentionedByAdminId - Admin who created the mention
 * @param text - The text containing mentions
 * @param mentions - Parsed mentions
 */
export async function createMentionRecords(
  ticketId: string,
  responseId: string | null,
  organizationId: string,
  mentionedByAdminId: string,
  text: string,
  mentions: ParsedMention[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create mention records for each unique mentioned admin
    const uniqueAdminIds = [...new Set(mentions.map((m) => m.admin_id))];
    
    const mentionRecords = uniqueAdminIds.map((adminId) => {
      const mention = mentions.find((m) => m.admin_id === adminId)!;
      
      return {
        ticket_id: ticketId,
        response_id: responseId,
        organization_id: organizationId,
        mentioned_admin_id: adminId,
        mentioned_by_admin_id: mentionedByAdminId,
        mention_text: mention.mention_text,
        context_snippet: extractMentionContext(text, mention.position),
        is_read: false,
      };
    });

    const { error } = await supabase
      .from('admin_mentions')
      .insert(mentionRecords);

    if (error) {
      console.error('Error creating mention records:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createMentionRecords:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send real-time notification to mentioned admins
 * (Supabase real-time subscriptions will automatically handle this)
 * This function can be extended to send email/push notifications
 * 
 * @param mentions - Parsed mentions
 * @param ticketId - Ticket ID
 * @param ticketSubject - Ticket subject
 * @param mentionedByAdminName - Name of admin who mentioned
 */
export async function sendMentionNotifications(
  mentions: ParsedMention[],
  ticketId: string,
  ticketSubject: string,
  mentionedByAdminName: string
): Promise<void> {
  // Real-time notifications via Supabase subscriptions are automatic
  // This function can be extended for email/push notifications
  
  console.log(`📢 Sending ${mentions.length} mention notifications for ticket ${ticketId}`);
  
  // TODO: Send email notifications
  // TODO: Send push notifications
  // TODO: Create in-app notification banners
}

/**
 * Fetch admins for organization (for mention typeahead)
 * 
 * @param organizationId - Organization ID
 * @returns List of admins
 */
export async function fetchAdminsForMentions(
  organizationId: string
): Promise<Admin[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, organization_id')
    .eq('organization_id', organizationId)
    .eq('role', 'admin')
    .order('full_name');

  if (error) {
    console.error('Error fetching admins for mentions:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark mention as read
 * 
 * @param mentionId - Mention ID
 */
export async function markMentionAsRead(mentionId: string): Promise<void> {
  await supabase
    .from('admin_mentions')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', mentionId);
}

/**
 * Mark all mentions as read for an admin
 * 
 * @param adminId - Admin ID
 */
export async function markAllMentionsAsRead(adminId: string): Promise<void> {
  await supabase
    .from('admin_mentions')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('mentioned_admin_id', adminId)
    .eq('is_read', false);
}

/**
 * Get unread mention count for admin
 * 
 * @param adminId - Admin ID
 * @returns Number of unread mentions
 */
export async function getUnreadMentionCount(adminId: string): Promise<number> {
  const { count, error } = await supabase
    .from('admin_mentions')
    .select('*', { count: 'exact', head: true })
    .eq('mentioned_admin_id', adminId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread mention count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Subscribe to mention notifications for an admin
 * 
 * @param adminId - Admin ID
 * @param onNewMention - Callback when new mention is received
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToMentions(
  adminId: string,
  onNewMention: (mention: any) => void
): () => void {
  const channel = supabase
    .channel(`admin_mentions:${adminId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_mentions',
        filter: `mentioned_admin_id=eq.${adminId}`,
      },
      (payload) => {
        console.log('New mention received:', payload);
        onNewMention(payload.new);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Validate mention text format
 * 
 * @param text - Text to validate
 * @returns True if text contains valid @mentions
 */
export function hasValidMentions(text: string): boolean {
  const mentionRegex = /@(\w+)/;
  return mentionRegex.test(text);
}

/**
 * Highlight mentions in text for display
 * 
 * @param text - Text with mentions
 * @returns HTML string with highlighted mentions
 */
export function highlightMentions(text: string): string {
  return text.replace(
    /@(\w+)/g,
    '<span class="mention-highlight bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-medium">@$1</span>'
  );
}

/**
 * Remove mentions from text
 * 
 * @param text - Text with mentions
 * @returns Text without mentions
 */
export function removeMentions(text: string): string {
  return text.replace(/@(\w+)/g, '').trim();
}

/**
 * Count mentions in text
 * 
 * @param text - Text to analyze
 * @returns Number of @mentions found
 */
export function countMentions(text: string): number {
  const matches = text.match(/@(\w+)/g);
  return matches ? matches.length : 0;
}

const mentionUtils = {
  parseMentions,
  extractMentionContext,
  createMentionRecords,
  sendMentionNotifications,
  fetchAdminsForMentions,
  markMentionAsRead,
  markAllMentionsAsRead,
  getUnreadMentionCount,
  subscribeToMentions,
  hasValidMentions,
  highlightMentions,
  removeMentions,
  countMentions,
};

export default mentionUtils;