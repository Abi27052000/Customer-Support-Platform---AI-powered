import React, { useState, useEffect } from 'react';
import { vapiService } from '../../../services/vapiService';
import { type CallStatus } from '../../../types/vapi.types';
import VoiceControls from '../../../Components/AIVoiceComponents/VoiceControls';

export const AIVoiceChat: React.FC = () => {
  const [callStatus, setCallStatus] = useState<CallStatus>({
    isActive: false,
    isConnecting: false,
  });
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const vapi = vapiService.getVapi();

    vapi.on('call-start', () => {
      setCallStatus({ isActive: true, isConnecting: false });
    });

    vapi.on('call-end', () => {
      setCallStatus({ isActive: false, isConnecting: false });
    });

    vapi.on('message', (message: any) => {
      console.log('Message received:', message);
    });

    vapi.on('error', (error: Error) => {
      console.error('Vapi error:', error);
      setCallStatus({
        isActive: false,
        isConnecting: false,
        error: error.message || 'An error occurred',
      });
    });

    return () => {
      vapi.removeAllListeners();
    };
  }, []);

  const handleStartCall = async () => {
    try {
      setCallStatus({ isActive: false, isConnecting: true, error: undefined });
      await vapiService.startCall();
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus({
        isActive: false,
        isConnecting: false,
        error: 'Failed to start call. Please try again.',
      });
    }
  };

  const handleEndCall = () => {
    vapiService.stopCall();
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    vapiService.setMuted(newMutedState);
    setIsMuted(newMutedState);
  };

  return (
    <div className="h-full bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-8">
        {/* Chatbot Icon with glow effect when active */}
        <div className="relative">
          {callStatus.isActive && (
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-75 animate-pulse"></div>
          )}
          <div
            className={`
              relative w-32 h-32 rounded-full flex items-center justify-center text-white text-6xl
              transition-all duration-300 shadow-2xl
              ${
                callStatus.isActive
                  ? 'bg-blue-600 shadow-blue-500/50 animate-pulse'
                  : 'bg-gray-600 shadow-gray-500/50'
              }
            `}
          >
            {callStatus.isConnecting ? '⏳' : '🤖'}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Voice Assistant</h1>
          <p className="text-gray-600">
            {callStatus.isConnecting && 'Connecting...'}
            {callStatus.isActive && 'Listening...'}
            {!callStatus.isActive && !callStatus.isConnecting && 'Ready to talk'}
            {callStatus.error && `Error: ${callStatus.error}`}
          </p>
        </div>

        {/* Voice Controls */}
        <div className="mt-8">
          <VoiceControls
            callStatus={callStatus}
            isMuted={isMuted}
            onStartCall={handleStartCall}
            onEndCall={handleEndCall}
            onToggleMute={handleToggleMute}
          />
        </div>
      </div>
    </div>
  );
};


