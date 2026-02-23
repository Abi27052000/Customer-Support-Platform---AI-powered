import Vapi from '@vapi-ai/web';

const VAPI_PUBLIC_KEY = '6d21de06-93a1-4e9f-ba94-d461b251e5c2';
const ASSISTANT_ID = '02cd2642-9854-4cf3-8760-27b2b0dff305';

class VapiService {
  private vapi: Vapi;

  constructor() {
    this.vapi = new Vapi(VAPI_PUBLIC_KEY);
  }

  getVapi() {
    return this.vapi;
  }

  startCall() {
    return this.vapi.start(ASSISTANT_ID);
  }

  stopCall() {
    return this.vapi.stop();
  }

  isMuted() {
    return this.vapi.isMuted();
  }

  setMuted(muted: boolean) {
    return this.vapi.setMuted(muted);
  }

  send(message: any) {
    return this.vapi.send(message);
  }
}

export const vapiService = new VapiService();
