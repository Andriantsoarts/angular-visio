import { Component } from '@angular/core';
import { CallingService } from '../services/calling.service';
import { CommonModule } from '@angular/common';
// import { CallPageCreateComponent } from './callPageCreate/callPageCreate.component';

@Component({
  selector: 'app-callCreate',
  templateUrl: './callCreate.component.html',
  styleUrls: ['./callCreate.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class CallCreateComponent {
  callingService: CallingService;

  constructor(callingService: CallingService) {
    this.callingService = callingService;
  }

  createNewCall() {
    this.callingService.createNewCall();
  }
  isCallInfoVisible = true;
  copyCallLink() {
    this.callingService.copyCallLink();
    this.isCallInfoVisible = false;
  }

  setCallId(callId: string) {
    this.callingService.setCallId(callId);
  }
}
