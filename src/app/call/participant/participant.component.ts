import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CallingService } from '../../services/calling.service';
import { CommonModule } from '@angular/common';
import { StreamVideoParticipant } from '@stream-io/video-client';

@Component({
    selector: 'app-participant',
    templateUrl: './participant.component.html',
    styleUrls: ['./participant.component.css'],
    standalone: true,
    imports: [CommonModule],
})

export class ParticipantComponent {
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('audioElement') audioElement!: ElementRef<HTMLVideoElement>;


    @Input() participant!: StreamVideoParticipant;
    unbindVideoElement: (() => void) | undefined;
    unbindAudioElement: (() => void) | undefined;
    
    constructor(private callingService: CallingService) {}

    ngAfterViewInit(): void {
        this.unbindVideoElement = this.callingService
          .call()
          ?.bindVideoElement(
            this.videoElement.nativeElement,
            this.participant.sessionId,
            'videoTrack'
          );

        this.unbindAudioElement = this.callingService
          .call()
          ?.bindAudioElement(
            this.audioElement.nativeElement,
            this.participant.sessionId
          );
      }

      ngOnDestroy(): void {
        this.unbindVideoElement?.();
        this.unbindAudioElement?.();
      }
}