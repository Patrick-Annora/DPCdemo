// ============================================================================
// Support Page — Ticket management view
// Route: /support
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Inbox,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Image,
  Loader2,
  Paperclip,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  addComment,
  listComments,
  listTickets,
  updateTicketStatus,
} from "@/lib/support-api";
import type {
  SupportTicket,
  TicketComment,
  TicketType,
  TicketStatus,
} from "@/lib/support-types";

// -- Relative time helper ----------------------------------------------------

function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// -- Badge styling maps ------------------------------------------------------

const TYPE_BADGE_CONFIG: Record<TicketType, { label: string; className: string }> = {
  bug: {
    label: "Bug",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  improvement: {
    label: "Improvement",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  question: {
    label: "Question",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  other: {
    label: "Other",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  },
};

const STATUS_BADGE_CONFIG: Record<
  TicketStatus,
  { label: string; className: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  open: {
    label: "Open",
    className: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400",
    variant: "outline",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    variant: "secondary",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    variant: "secondary",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    variant: "secondary",
  },
};

// -- Type badge component ----------------------------------------------------

function TypeBadge({ type }: { type: TicketType }) {
  const config = TYPE_BADGE_CONFIG[type];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

// -- Status badge component --------------------------------------------------

function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_BADGE_CONFIG[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

// -- Truncate helper ---------------------------------------------------------

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

// -- Screenshot modal (simple overlay, no Dialog dependency) ------------------

function ScreenshotModal({
  open,
  onClose,
  screenshotUrl,
  ticketId,
}: {
  open: boolean;
  onClose: () => void;
  screenshotUrl: string;
  ticketId: number;
}) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div
        className="relative z-10 mx-4 w-full max-w-3xl rounded-lg bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Screenshot — Ticket #{ticketId}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center">
          <img
            src={screenshotUrl}
            alt="Ticket screenshot full size"
            className="max-h-[70vh] rounded-md object-contain"
          />
        </div>
      </div>
    </div>
  );
}

// -- Expanded detail panel ---------------------------------------------------

function TicketDetailPanel({
  ticket,
  onStatusUpdate,
}: {
  ticket: SupportTicket;
  onStatusUpdate: (id: number, status: TicketStatus) => void;
}) {
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status);
  const [saving, setSaving] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);

  // Comments
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    setLoadingComments(true);
    listComments(ticket.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [ticket.id]);

  const handleSave = async () => {
    if (newStatus === ticket.status) return;
    setSaving(true);
    try {
      await onStatusUpdate(ticket.id, newStatus);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setAddingComment(true);
    try {
      const comment = await addComment(ticket.id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText("");
    } catch {
      // silently fail
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      {/* Full message */}
      <div>
        <h4 className="mb-1 text-xs font-medium text-muted-foreground">Message</h4>
        <p className="whitespace-pre-wrap text-sm">{ticket.message}</p>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ticket.tagged_email && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">Tagged Colleague</h4>
            <p className="text-sm">{ticket.tagged_email}</p>
          </div>
        )}
        {ticket.page_url && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">Page</h4>
            <p className="text-sm font-mono">{ticket.page_url}</p>
          </div>
        )}
        {ticket.browser_info && (
          <div className="min-w-0">
            <h4 className="text-xs font-medium text-muted-foreground">Browser</h4>
            <p className="truncate text-sm text-muted-foreground" title={ticket.browser_info}>
              {ticket.browser_info}
            </p>
          </div>
        )}
      </div>

      {/* Screenshot + Attachment */}
      <div className="flex flex-wrap gap-4">
        {ticket.screenshot_url && (
          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Page Screenshot</h4>
            <button
              type="button"
              onClick={() => setScreenshotOpen(true)}
              className="group relative overflow-hidden rounded-md border"
            >
              <img
                src={ticket.screenshot_url}
                alt="Ticket screenshot"
                className="h-20 w-32 object-cover transition-opacity group-hover:opacity-80"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                <Image className="size-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </button>

            <ScreenshotModal
              open={screenshotOpen}
              onClose={() => setScreenshotOpen(false)}
              screenshotUrl={ticket.screenshot_url}
              ticketId={ticket.id}
            />
          </div>
        )}

        {ticket.attachment_url && (
          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Attachment</h4>
            <a
              href={ticket.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              <Paperclip className="size-3.5" />
              Download
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </div>

      {/* Comments thread */}
      <div className="border-t pt-3">
        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h4>
        {loadingComments ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">No comments yet</p>
        ) : (
          <div className="mb-3 space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="rounded-md bg-background px-3 py-2">
                <p className="whitespace-pre-wrap text-sm">{c.text}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {relativeTime(c.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="h-8 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleAddComment();
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!commentText.trim() || addingComment}
            onClick={() => void handleAddComment()}
            className="h-8"
          >
            {addingComment ? "..." : "Post"}
          </Button>
        </div>
      </div>

      {/* Status update */}
      <div className="flex items-center gap-3 border-t pt-3">
        <span className="text-sm font-medium">Status:</span>
        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TicketStatus)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={newStatus === ticket.status || saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

// -- Ticket row (extracted for clean expand/collapse) ------------------------

function TicketRow({
  ticket,
  isExpanded,
  onToggle,
  onStatusUpdate,
}: {
  ticket: SupportTicket;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusUpdate: (id: number, status: TicketStatus) => void;
}) {
  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <TableCell className="w-8">
          {isExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="w-16 font-mono text-xs text-muted-foreground">
          #{ticket.id}
        </TableCell>
        <TableCell className="w-28">
          <TypeBadge type={ticket.ticket_type} />
        </TableCell>
        <TableCell className="max-w-xs text-sm">
          {truncate(ticket.message, 80)}
        </TableCell>
        <TableCell className="w-28 font-mono text-xs text-muted-foreground">
          {ticket.page_url ?? "\u2014"}
        </TableCell>
        <TableCell className="w-28">
          <StatusBadge status={ticket.status} />
        </TableCell>
        <TableCell className="w-24 text-xs text-muted-foreground">
          {relativeTime(ticket.created_at)}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={7} className="p-3">
            <TicketDetailPanel ticket={ticket} onStatusUpdate={onStatusUpdate} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// -- Main page component -----------------------------------------------------

function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TicketType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { type?: TicketType; status?: TicketStatus } = {};
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await listTickets(params);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  // Load on mount and when filters change
  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const handleStatusUpdate = async (id: number, status: TicketStatus) => {
    try {
      await updateTicketStatus(id, status);
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const toggleRow = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // -- Render ----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "ticket" : "tickets"} total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchTickets()}>
          <RefreshCw className="mr-1.5 size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TicketType | "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="question">Question</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading tickets...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
          <Inbox className="size-10 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium text-muted-foreground">No support tickets yet</p>
            <p className="text-sm text-muted-foreground/70">
              Use the chat widget in the bottom-right corner to submit one.
            </p>
          </div>
        </div>
      )}

      {/* Ticket table */}
      {!loading && !error && tickets.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-28">Page</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const isExpanded = expandedId === ticket.id;
                return (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    isExpanded={isExpanded}
                    onToggle={() => toggleRow(ticket.id)}
                    onStatusUpdate={handleStatusUpdate}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default SupportPage;
