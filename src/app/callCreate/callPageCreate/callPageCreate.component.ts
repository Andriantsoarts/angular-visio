import { Component, Input, Signal } from '@angular/core';
import { CallingService } from '../../services/calling.service';
import { CommonModule } from '@angular/common';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { toSignal } from '@angular/core/rxjs-interop';
import { ParticipantComponent } from '../../call/participant/participant.component';

@Component({
    selector: 'app-callPageCreate',
    templateUrl: './callPageCreate.component.html',
    styleUrls: ['./callPageCreate.component.css'],
    standalone: true,
    imports: [CommonModule, ParticipantComponent],
})

export class CallPageCreateComponent {
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
    deleteCall() {
        const confirmation = confirm("Voulez-vous vraiment supprimer cette réunion ?");
        if (!confirmation) return;
        this.call.endCall().then(() =>{
            this.callingService.setCallId(undefined);
        })
    }

}