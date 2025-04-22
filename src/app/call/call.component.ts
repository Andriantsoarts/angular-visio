import { Component } from '@angular/core';
import { CallingService } from '../services/calling.service';
import { CommonModule } from '@angular/common';
import { CallPageComponent } from './callPage/callPage.component';

@Component({
    selector: 'app-call',
    templateUrl: './call.component.html',
    styleUrls: ['./call.component.css'],
    standalone: true,
    imports: [CommonModule, CallPageComponent],
})

export class CallComponent {
    callingService : CallingService;

    constructor(callingService: CallingService) {
        this.callingService = callingService;
    }

    createNewCall() {
        this.callingService.createNewCall();
    }

    copyCallLink() {
        this.callingService.copyCallLink();
    }

    setCallId(callId: string) {
        this.callingService.setCallId(callId);
    }
}