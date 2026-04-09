import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import {
  MessageCircleQuestion,
  X,
  ArrowLeft,
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  Paperclip,
  CheckCircle2,
  Loader2,
  ImageIcon,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createTicket } from "@/lib/support-api";
import type { TicketType } from "@/lib/support-types";

type Step = "menu" | "form" | "submitted";

const FLOWS = [
  {
    id: "bug" as const,
    icon: Bug,
    label: "Report a Bug",
    description: "Something isn't working correctly",
    placeholder: "Describe what happened and what you expected\u2026",
  },
  {
    id: "improvement" as const,
    icon: Lightbulb,
    label: "Suggest Improvement",
    description: "An idea to make the system better",
    placeholder: "Describe your suggestion\u2026",
  },
  {
    id: "question" as const,
    icon: HelpCircle,
    label: "Ask a Question",
    description: "Need help understanding something",
    placeholder: "What would you like to know?",
  },
  {
    id: "other" as const,
    icon: MoreHorizontal,
    label: "Other",
    description: "General feedback or comments",
    placeholder: "What's on your mind?",
  },
] as const;

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<TicketType | null>(null);
  const [step, setStep] = useState<Step>("menu");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const screenshotUrlRef = useRef<string | null>(null);

  function reset() {
    setFlow(null);
    setStep("menu");
    setMessage("");
    setEmail("");
    setScreenshot(null);
    setAttachment(null);
    setIsSubmitting(false);
    setTicketId(null);
    setError(null);
    if (screenshotUrlRef.current) {
      URL.revokeObjectURL(screenshotUrlRef.current);
      screenshotUrlRef.current = null;
    }
  }

  function handleClose() {
    setOpen(false);
    // Delay reset so close animation isn't jarring
    setTimeout(reset, 200);
  }

  async function captureScreenshot(): Promise<File | null> {
    try {
      const canvas = await html2canvas(document.body, {
        ignoreElements: (el) => el.closest("[data-support-widget]") !== null,
        scale: 1,
        logging: false,
        useCORS: true,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "page-screenshot.png", {
              type: "image/png",
            });
            screenshotUrlRef.current = URL.createObjectURL(file);
            resolve(file);
          } else {
            resolve(null);
          }
        }, "image/png");
      });
    } catch {
      return null;
    }
  }

  async function handleSelect(f: TicketType) {
    setFlow(f);
    setStep("form");
    // Auto-capture screenshot of the current page
    const captured = await captureScreenshot();
    if (captured) setScreenshot(captured);
  }

  async function handleSubmit() {
    if (!flow || message.trim().length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const ticket = await createTicket({
        ticket_type: flow,
        message: message.trim(),
        submitted_by: "user@dpc.com",
        tagged_email: email.trim() || undefined,
        page_url: window.location.pathname,
        browser_info: navigator.userAgent,
        screenshot: screenshot ?? undefined,
        attachment: attachment ?? undefined,
      });

      setTicketId(ticket.id);
      setStep("submitted");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit ticket",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeFlow = FLOWS.find((f) => f.id === flow);

  return (
    <div data-support-widget className="print:hidden">
      {/* Floating Button */}
      <button
        onClick={() => (open ? handleClose() : setOpen(true))}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 print:hidden",
          open
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "bg-dpc-red text-white hover:bg-dpc-red-light",
        )}
        aria-label={open ? "Close support" : "Open support"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircleQuestion className="h-5 w-5" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl print:hidden">
          {/* Header */}
          <div className="border-b border-slate-100 bg-dpc-red px-4 py-3">
            <div className="flex items-center gap-2">
              {step !== "menu" && (
                <button
                  onClick={reset}
                  className="text-white/60 transition-colors hover:text-white"
                  aria-label="Back to menu"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div>
                <p className="text-sm font-semibold text-white">
                  {step === "menu" && "How can we help?"}
                  {step === "form" && activeFlow?.label}
                  {step === "submitted" && "Thank you!"}
                </p>
                {step === "menu" && (
                  <p className="text-xs text-white/60">
                    Select an option below
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-3">
            {/* Menu */}
            {step === "menu" && (
              <div className="space-y-1">
                {FLOWS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelect(f.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <f.icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {f.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {f.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Form */}
            {step === "form" && activeFlow && (
              <div className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={activeFlow.placeholder}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  autoFocus
                />

                {/* Auto-captured screenshot preview + attachment */}
                <div className="flex items-center gap-2">
                  {screenshot && screenshotUrlRef.current ? (
                    <div className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600">
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="text-emerald-700">Page captured</span>
                      <img
                        src={screenshotUrlRef.current}
                        alt="Page screenshot"
                        className="ml-1 h-6 rounded border border-slate-200"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-md border border-dashed border-slate-200 px-2.5 py-1.5 text-xs text-slate-400">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Capturing page...
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50">
                    <Paperclip className="h-3.5 w-3.5" />
                    {attachment ? "1 file" : "Attach"}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv"
                      className="hidden"
                      onChange={(e) =>
                        setAttachment(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>

                {/* Show attachment filename */}
                {attachment && (
                  <p className="truncate text-xs text-slate-500">
                    Attachment: {attachment.name}
                  </p>
                )}

                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tag a colleague (email)"
                  className="text-sm"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={message.trim().length === 0 || isSubmitting}
                  className="w-full bg-dpc-red hover:bg-dpc-red-light"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-3.5 w-3.5" />
                      Submit
                    </>
                  )}
                </Button>

                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}
              </div>
            )}

            {/* Submitted */}
            {step === "submitted" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Ticket #{ticketId} created
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    We'll get back to you shortly.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
