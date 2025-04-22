import { computed, Injectable, signal } from '@angular/core';
import { Call, StreamVideoClient, User } from '@stream-io/video-client';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class CallingService {
  callId = signal<string | undefined>(undefined);
  generatedCallId = signal<string | undefined>(undefined);

  call = computed<Call | undefined>(() => {
    const currentCallId = this.callId();
    if (currentCallId !== undefined) {
      const call = this.client.call('default',currentCallId);

      call.join({ create: true }).then(async () => {
        call.camera.enable();
        call.microphone.enable();
      });
      return call;
    }else {
      return undefined;
    }

  })
  client: StreamVideoClient;

  constructor() {
    const apiKey = 'mmhfdzb5evj2'
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0FuYWtpbl9Tb2xvIiwidXNlcl9pZCI6IkFuYWtpbl9Tb2xvIiwidmFsaWRpdHlfaW5fc2Vjb25kcyI6NjA0ODAwLCJpYXQiOjE3NDQ3ODcwOTEsImV4cCI6MTc0NTM5MTg5MX0.pC89TR9MWqXx7VRT96oisnqi_MRBJw-wGwGi7UeW5pY'
    const user: User = {id: 'Anakin_Solo'}

    this.client = new StreamVideoClient({apiKey, token, user});
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
