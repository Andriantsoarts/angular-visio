import { Component, Input, Signal } from '@angular/core';
import { CallingService } from '../../services/calling.service';
import { CommonModule } from '@angular/common';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { toSignal } from '@angular/core/rxjs-interop';
import { ParticipantComponent } from '../participant/participant.component';

@Component({
    selector: 'app-callPage',
    templateUrl: './callPage.component.html',
    styleUrls: ['./callPage.component.css'],
    standalone: true,
    imports: [CommonModule, ParticipantComponent],
})

export class CallPageComponent {
    @Input({ required: true }) call!: Call;

    participants : Signal<StreamVideoParticipant[]>

    constructor(private callingService: CallingService) {
        this.participants = toSignal(
            this.callingService.call()!.state.participants$,
            { requireSync: true }
        );
    }

    toogleMicrophone() {
        this.call.microphone.toggle();
    }
    toogleCamera() {
        this.call.camera.toggle();
    }
    trackBySessionId(_:number, participant: StreamVideoParticipant) {
        return participant.sessionId;
    }
    leaveCall() {
        this.callingService.setCallId(undefined);
    }

}