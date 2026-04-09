// ============================================================================
// Support Ticket Types — DPC Dashboard
// Type definitions for the in-app support ticket system.
// ============================================================================

export type TicketType = 'bug' | 'improvement' | 'question' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: number;
  ticket_type: TicketType;
  message: string;
  submitted_by: string;
  tagged_email: string | null;
  page_url: string | null;
  browser_info: string | null;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  screenshot_url: string | null;
  attachment_url: string | null;
}

export interface CreateTicketPayload {
  ticket_type: TicketType;
  message: string;
  submitted_by: string;
  tagged_email?: string;
  page_url?: string;
  browser_info?: string;
  screenshot?: File;
  attachment?: File;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  text: string;
  created_at: string;
}

export interface TicketListResponse {
  tickets: SupportTicket[];
  total: number;
}
