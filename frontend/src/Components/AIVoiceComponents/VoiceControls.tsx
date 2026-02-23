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
    <div className="border-t border-gray-200 p-6 bg-gray-50">
      <div className="flex items-center justify-center gap-4">
        {/* Start/End Call Button */}
        {!callStatus.isActive ? (
          <button
            onClick={onStartCall}
            disabled={callStatus.isConnecting}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-full font-semibold
              transition-all duration-200 shadow-lg
              ${
                callStatus.isConnecting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:scale-95'
              }
              text-white
            `}
          >
            <Phone className="w-5 h-5" />
            {callStatus.isConnecting ? 'Connecting...' : 'Start Call'}
          </button>
        ) : (
          <>
            {/* Mute/Unmute Button */}
            <button
              onClick={onToggleMute}
              className={`
                p-4 rounded-full transition-all duration-200 shadow-lg
                ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
                text-white active:scale-95
              `}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="
                flex items-center gap-2 px-6 py-3 rounded-full font-semibold
                bg-red-600 hover:bg-red-700 text-white
                transition-all duration-200 shadow-lg active:scale-95
              "
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </button>
          </>
        )}
      </div>

      {/* Status Message */}
      {callStatus.isActive && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-green-600">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">Call Active</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {callStatus.error && (
        <div className="mt-4 text-center">
          <p className="text-red-600 text-sm">{callStatus.error}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceControls;
