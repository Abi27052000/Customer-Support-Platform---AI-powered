import React from 'react';

interface EscalationViewProps {
  onGoBack?: () => void;
}

const EscalationView: React.FC<EscalationViewProps> = ({ onGoBack }) => {
  const ticketRef = React.useRef(
    `TKT-${Date.now().toString(36).toUpperCase()}`
  );

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 px-6 py-10 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-indigo-100 border-4 border-indigo-300 flex items-center justify-center mb-6 shadow-md">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-800 mb-3">
        We're connecting you with a human agent
      </h2>

      {/* Body */}
      <p className="text-gray-600 text-sm max-w-md leading-relaxed mb-6">
        We noticed you may be having a frustrating experience and we're sorry
        about that. A member of our support team will reach out to you shortly
        to help resolve your issue personally.
      </p>

      {/* Ticket badge */}
      <div className="bg-white border border-indigo-200 rounded-xl px-6 py-4 shadow-sm mb-8 w-full max-w-xs">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
          Reference number
        </p>
        <p className="text-lg font-mono font-semibold text-indigo-600">
          {ticketRef.current}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Please keep this for your records
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-full max-w-sm text-left mb-8">
        {[
          { icon: '📧', text: 'You will receive a confirmation via email' },
          { icon: '⏱️', text: 'Expected response time: within 2 business hours' },
          { icon: '📞', text: 'A staff member may call you if urgent' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-start gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100">
            <span className="text-lg leading-none mt-0.5">{icon}</span>
            <span className="text-sm text-gray-600">{text}</span>
          </div>
        ))}
      </div>

      {/* Go back button */}
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="text-sm text-indigo-500 underline hover:text-indigo-700 transition-colors"
        >
          Return to chat (continue with AI assistant)
        </button>
      )}
    </div>
  );
};

export default EscalationView;
