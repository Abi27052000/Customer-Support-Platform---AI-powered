import React from 'react';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { type CallStatus } from '../../types/vapi.types';

interface VoiceControlsProps {
  callStatus: CallStatus;
  isMuted: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  callStatus,
  isMuted,
  onStartCall,
  onEndCall,
  onToggleMute,
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-3">
        {!callStatus.isActive ? (
          <button
            onClick={onStartCall}
            disabled={callStatus.isConnecting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Phone className="h-5 w-5" />
            {callStatus.isConnecting ? 'Connecting...' : 'Start Call'}
          </button>
        ) : (
          <>
            <button
              onClick={onToggleMute}
              className={`flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-sm transition active:scale-95 ${
                isMuted ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#2D2A8C] hover:bg-[#242170]'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <button
              onClick={onEndCall}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
            >
              <PhoneOff className="h-5 w-5" />
              End Call
            </button>
          </>
        )}
      </div>

      {callStatus.isActive && (
        <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          Call active
        </div>
      )}

      {callStatus.error && (
        <p className="max-w-md text-center text-sm text-red-600">{callStatus.error}</p>
      )}
    </div>
  );
};

export default VoiceControls;
