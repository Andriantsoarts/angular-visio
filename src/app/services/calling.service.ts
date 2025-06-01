import { computed, Injectable, signal } from '@angular/core';
import { Call, StreamVideoClient, User } from '@stream-io/video-client';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class CallingService {
  callId = signal<string | undefined>(undefined);
  generatedCallId = signal<string | undefined>(undefined);

  call = computed<Call | undefined>(() => {
    const currentCallId = this.callId();
    if (currentCallId !== undefined) {
      const call = this.client.call('default', currentCallId);

      call.join({ create: true }).then(async () => {
        call.camera.enable();
        call.microphone.enable();
      });
      return call;
    } else {
      return undefined;
    }
  });
  client: StreamVideoClient;

  constructor() {
    const apiKey = 'mmhfdzb5evj2';
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0NhcHRhaW5fUmV4IiwidXNlcl9pZCI6IkNhcHRhaW5fUmV4IiwidmFsaWRpdHlfaW5fc2Vjb25kcyI6NjA0ODAwLCJpYXQiOjE3NDg1OTY4MjAsImV4cCI6MTc0OTIwMTYyMH0.V3fG15FmgtGbHwS7kWAsZpZS7RTIb1BsB2rIG25fjK4';
    const user: User = { id: 'Captain_Rex' };

    this.client = new StreamVideoClient({ apiKey, token, user });
  }
  createNewCall() {
    const newCallId = uuidv4();
    this.generatedCallId.set(newCallId);
    this.setCallId(newCallId);
  }
  getCallLink(): string {
    return `${this.generatedCallId()}`;
  }

  copyCallLink() {
    navigator.clipboard.writeText(this.getCallLink());
  }

  setCallId(callId: string | undefined) {
    if (callId === undefined) {
      this.call()?.leave();
    }
    this.callId.set(callId);
  }
}
