// ============================================================================
// Support Ticket API Client — DPC Dashboard
// API client for support ticket endpoints.
// ============================================================================

import type {
  CreateTicketPayload,
  SupportTicket,
  TicketComment,
  TicketListResponse,
  TicketStatus,
  TicketType,
} from './support-types';
import { authHeaders, handleUnauthorized } from './auth';

const API_BASE = '/api/support';

export async function createTicket(payload: CreateTicketPayload): Promise<SupportTicket> {
  const formData = new FormData();
  formData.append('ticket_type', payload.ticket_type);
  formData.append('message', payload.message);
  formData.append('submitted_by', payload.submitted_by);
  if (payload.tagged_email) formData.append('tagged_email', payload.tagged_email);
  if (payload.page_url) formData.append('page_url', payload.page_url);
  if (payload.browser_info) formData.append('browser_info', payload.browser_info);
  if (payload.screenshot) formData.append('screenshot', payload.screenshot);
  if (payload.attachment) formData.append('attachment', payload.attachment);

  const res = handleUnauthorized(await fetch(API_BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  }));
  if (!res.ok) throw new Error(`Failed to create ticket: ${res.statusText}`);
  return res.json();
}

export async function listTickets(params?: {
  type?: TicketType;
  status?: TicketStatus;
  limit?: number;
  offset?: number;
}): Promise<TicketListResponse> {
  const url = new URL(API_BASE, window.location.origin);
  if (params?.type) url.searchParams.set('ticket_type', params.type);
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));

  const res = handleUnauthorized(await fetch(url.toString(), { headers: authHeaders() }));
  if (!res.ok) throw new Error(`Failed to list tickets: ${res.statusText}`);
  return res.json();
}

export async function getTicket(id: number): Promise<SupportTicket> {
  const res = handleUnauthorized(await fetch(`${API_BASE}/${id}`, { headers: authHeaders() }));
  if (!res.ok) throw new Error(`Failed to get ticket: ${res.statusText}`);
  return res.json();
}

export async function updateTicketStatus(
  id: number,
  status: TicketStatus,
): Promise<SupportTicket> {
  const res = handleUnauthorized(await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status }),
  }));
  if (!res.ok) throw new Error(`Failed to update ticket: ${res.statusText}`);
  return res.json();
}

export async function addComment(
  ticketId: number,
  text: string,
): Promise<TicketComment> {
  const res = handleUnauthorized(await fetch(`${API_BASE}/${ticketId}/comments`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ text }),
  }));
  if (!res.ok) throw new Error(`Failed to add comment: ${res.statusText}`);
  return res.json();
}

export async function listComments(ticketId: number): Promise<TicketComment[]> {
  const res = handleUnauthorized(await fetch(`${API_BASE}/${ticketId}/comments`, { headers: authHeaders() }));
  if (!res.ok) throw new Error(`Failed to load comments: ${res.statusText}`);
  return res.json();
}
