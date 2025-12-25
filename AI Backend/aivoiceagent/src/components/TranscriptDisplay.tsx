import React from 'react';
import { type TranscriptMessage } from '../types/vapi.types.ts';

interface TranscriptDisplayProps {
  transcripts: TranscriptMessage[];
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcripts }) => {
  const transcriptEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {transcripts.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p className="text-lg">Start a conversation with Alex</p>
          <p className="text-sm mt-2">Click the microphone button to begin</p>
        </div>
      ) : (
        transcripts.map((transcript) => (
          <div
            key={transcript.id}
            className={`flex ${
              transcript.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                transcript.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              } ${!transcript.isFinal ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">
                  {transcript.role === 'user' ? 'You' : 'Alex'}
                </span>
                <span className="text-xs opacity-70">
                  {transcript.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{transcript.content}</p>
            </div>
          </div>
        ))
      )}
      <div ref={transcriptEndRef} />
    </div>
  );
};

export default TranscriptDisplay;
