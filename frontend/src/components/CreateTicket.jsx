import React, { useState } from 'react';

const CreateTicket = ({ onTicketCreated }) => {
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    client: 'Client A - Acme Corp',
    category: 'Incident Management',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('success', 'Ticket submitted successfully');
        setFormData({ ...formData, summary: '', description: '' });
        if (onTicketCreated) onTicketCreated();
      } else {
        showToast('error', 'Failed to submit ticket');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      showToast('error', 'Connection error — is the server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] relative overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary leading-none">
              New Request
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Submit a service ticket
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-border-subtle" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Summary */}
        <div>
          <label htmlFor="ticket-summary" className="block text-xs font-medium text-text-secondary mb-1.5">
            Summary
          </label>
          <input
            id="ticket-summary"
            required
            type="text"
            placeholder="Brief description of the issue"
            className="
              w-full px-3 py-2.5 text-sm text-text-primary
              bg-surface border border-border rounded-[var(--radius-input)]
              placeholder:text-text-muted/60
              focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
              transition-all duration-200
            "
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="ticket-description" className="block text-xs font-medium text-text-secondary mb-1.5">
            Description
          </label>
          <textarea
            id="ticket-description"
            required
            rows="4"
            placeholder="Detailed information about the request..."
            className="
              w-full px-3 py-2.5 text-sm text-text-primary
              bg-surface border border-border rounded-[var(--radius-input)]
              placeholder:text-text-muted/60 resize-none
              focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
              transition-all duration-200
            "
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Client Select */}
        <div>
          <label htmlFor="ticket-client" className="block text-xs font-medium text-text-secondary mb-1.5">
            Client
          </label>
          <div className="relative">
            <select
              id="ticket-client"
              className="
                w-full px-3 py-2.5 text-sm text-text-primary appearance-none
                bg-surface border border-border rounded-[var(--radius-input)]
                focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                transition-all duration-200 cursor-pointer
              "
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
            >
              <option>Client A - Acme Corp</option>
              <option>Client B - Wayne Enterprises</option>
              <option>Client C - Stark Industries</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="ticket-category" className="block text-xs font-medium text-text-secondary mb-1.5">
            Category
          </label>
          <div className="relative">
            <select
              id="ticket-category"
              className="
                w-full px-3 py-2.5 text-sm text-text-primary appearance-none
                bg-surface border border-border rounded-[var(--radius-input)]
                focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                transition-all duration-200 cursor-pointer
              "
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option>Incident Management</option>
              <option>Service Request</option>
              <option>Change Management</option>
              <option>Problem Management</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="submit-ticket"
          type="submit"
          disabled={isSubmitting}
          className="
            w-full mt-2 px-4 py-2.5 text-sm font-medium
            bg-text-primary text-surface rounded-[var(--radius-button)]
            hover:bg-slate-800 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
            transition-all duration-200
            flex items-center justify-center gap-2
          "
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              Submit Ticket
            </>
          )}
        </button>
      </form>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`
            absolute bottom-4 left-4 right-4 px-4 py-3 rounded-[var(--radius-input)]
            text-sm font-medium flex items-center gap-2
            animate-fade-in-up shadow-[var(--shadow-elevated)]
            ${toast.type === 'success'
              ? 'bg-status-resolved-bg text-status-resolved-text'
              : 'bg-status-new-bg text-status-new-text'
            }
          `}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default CreateTicket;