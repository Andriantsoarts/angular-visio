import { HttpClient } from '@angular/common/http';
import { Component, inject, ElementRef, HostListener  } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { ChatService } from '../services/chat.service';
import { Message } from '../message.interface';
import {Conversation} from '../conversation.interface';
import { doc, getDoc, Firestore, query, collection, orderBy, getDocs, where } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-authentification',
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
})
export class ChatComponent {
    chatService = inject(ChatService);
    authService = inject(AuthService);
    firestore = inject(Firestore);
    fb = inject(FormBuilder);
    route = inject(ActivatedRoute);
    conversation: Conversation | null = null;
    otherParticipantUsername: string = '';
    messages: Message[] = [];
    messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
    private messagesSub?: Subscription;

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
        const conversationId = params.get('conversationId');
        if (conversationId) {
            this.loadConversation(conversationId);
        }
        });
    }

    ngOnDestroy(): void {
        if (this.messagesSub) {
        this.messagesSub.unsubscribe();
        }
    }

    async loadConversation(conversationId: string): Promise<void> {
        try {
            const conversationDoc = await getDoc(doc(this.firestore, 'conversations', conversationId));
            if (conversationDoc.exists()) {
                this.conversation = {
                id: conversationDoc.id,
                participants: conversationDoc.data()['participants'],
                createdAt: conversationDoc.data()['createdAt'].toDate(),
                lastMessage: conversationDoc.data()['lastMessage'],
                lastMessageSender: conversationDoc.data()['lastMessageSender'],
                lastMessageTimestamp: conversationDoc.data()['lastMessageTimestamp']
                    ? conversationDoc.data()['lastMessageTimestamp'].toDate()
                    : null
                };

                await this.loadOtherParticipantUsername();

                await this.loadMessages();
                if (this.conversation) {
                    const unreadCount = await this.chatService.getUnreadMessagesCount(conversationId);
                    console.log(`Messages non lus : ${unreadCount}`);
                }
            } else {
                console.error('Conversation not found');
                this.conversation = null;
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            this.conversation = null;
        }
    }

    async loadOtherParticipantUsername(): Promise<void> {
        if (!this.conversation) {
            this.otherParticipantUsername = '';
            return;
        }

        try {
            const currentUserUid = this.authService.currentUserSignal()?.uid;
            const otherUid = this.conversation.participants.find(uid => uid !== currentUserUid);
            if (otherUid) {
                const userDoc = await getDoc(doc(this.firestore, 'users', otherUid));
                if (userDoc.exists()) {
                this.otherParticipantUsername = userDoc.data()['username'] || 'Utilisateur';
                } else {
                this.otherParticipantUsername = 'Utilisateur';
                }
            } else {
                this.otherParticipantUsername = 'Utilisateur';
            }
        } catch (error) {
            console.error('Error loading participant username:', error);
            this.otherParticipantUsername = 'Utilisateur';
        }
    }
    loadMessages(): void {
        if (!this.conversation) {
          this.messages = [];
          return;
        }

        this.messagesSub = this.chatService.listenToMessages(this.conversation.id).subscribe({
          next: (messages) => {
            this.messages = messages;
            setTimeout(() => {
              const messagesDiv = document.querySelector('.messages');
              if (messagesDiv) {
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
              }
            }, 0);
          },
          error: (error) => {
            console.error('Error loading messages:', error);
            this.messages = [];
          }
        });
      }

    async sendMessage(): Promise<void> {
        if (this.messageForm.invalid || !this.conversation || !this.authService.currentUserSignal()?.uid) {
        return;
        }

        const content = this.messageForm.get('content')?.value?.trim();
        if (!content) {
        return;
        }

        try {
        const message = await this.chatService.sendMessage(
            this.conversation.id,
            this.authService.currentUserSignal()!.uid,
            content
        );
        // this.messages = [...this.messages, message];
        this.messageForm.reset();
        setTimeout(() => {
          const messagesDiv = document.querySelector('.messages');
          if (messagesDiv) {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }
        }, 0);
        } catch (error) {
        console.error('Failed to send message:', error);
        }
    }

    isSentMessage(message: Message): boolean {
        return message.senderId === this.authService.currentUserSignal()?.uid;
    }

  formatMessageDate(timestamp: Date): string {
    const now = new Date();
    const messageDate = new Date(timestamp);

    const isToday = now.getFullYear() === messageDate.getFullYear() &&
                    now.getMonth() === messageDate.getMonth() &&
                    now.getDate() === messageDate.getDate();

    const isSameYear = now.getFullYear() === messageDate.getFullYear();

    if (isToday) {
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(messageDate);
    } else if (isSameYear) {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(messageDate);
    } else {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(messageDate);
    }
  }
}