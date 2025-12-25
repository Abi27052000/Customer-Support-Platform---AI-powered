
import { useState, useEffect } from 'react';
import './App.css';
import { vapiService } from './services/vapiService';
import { type VapiMessage, type TranscriptMessage, type CallStatus } from './types/vapi.types';
import TranscriptDisplay from './components/TranscriptDisplay';
import VoiceControls from './components/VoiceControls';

function App() {
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>({
    isActive: false,
    isConnecting: false,
  });
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const vapi = vapiService.getVapi();

    // Call started
    vapi.on('call-start', () => {
      console.log('Call started');
      setCallStatus({ isActive: true, isConnecting: false });
    });

    // Call ended
    vapi.on('call-end', () => {
      console.log('Call ended');
      setCallStatus({ isActive: false, isConnecting: false });
    });

    // Handle messages
    vapi.on('message', (message: VapiMessage) => {
      console.log('Message received:', message);

      if (message.type === 'transcript' && message.transcript) {
        const newTranscript: TranscriptMessage = {
          id: `${Date.now()}-${Math.random()}`,
          role: message.role || 'assistant',
          content: message.transcript,
          timestamp: new Date(),
          isFinal: message.transcriptType === 'final',
        };

        setTranscripts((prev) => {
          // If it's a partial transcript, update the last one if it's from the same role
          if (!newTranscript.isFinal && prev.length > 0) {
            const lastTranscript = prev[prev.length - 1];
            if (lastTranscript.role === newTranscript.role && !lastTranscript.isFinal) {
              return [...prev.slice(0, -1), newTranscript];
            }
          }
          return [...prev, newTranscript];
        });
      }
    });

    // Handle errors
    vapi.on('error', (error: Error) => {
      console.error('Vapi error:', error);
      setCallStatus({
        isActive: false,
        isConnecting: false,
        error: error.message || 'An error occurred',
      });
    });

    // Cleanup
    return () => {
      vapi.removeAllListeners();
    };
  }, []);

  const handleStartCall = async () => {
    try {
      setCallStatus({ isActive: false, isConnecting: true, error: undefined });
      setTranscripts([]);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b">
            <h1 className="text-3xl font-bold text-gray-800 text-center">
              TechSolutions Voice Assistant
            </h1>
            <p className="text-gray-600 text-center mt-2">
              Talk to Alex, your AI customer support agent
            </p>
          </div>

          {/* Chat Area */}
          <div className="bg-white shadow-lg" style={{ height: '500px' }}>
            <TranscriptDisplay transcripts={transcripts} />
          </div>

          {/* Controls */}
          <div className="bg-white rounded-b-2xl shadow-lg">
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
    </div>
  );
}

export default App;
