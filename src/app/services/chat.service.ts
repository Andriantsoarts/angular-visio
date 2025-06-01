import { inject, Injectable, signal } from "@angular/core";
import { Auth, user } from "@angular/fire/auth";
import { Firestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc, arrayUnion, orderBy, onSnapshot, writeBatch } from "@angular/fire/firestore";
import { UserInterface } from "../user.interface";
import { Conversation } from "../conversation.interface";
import { Message } from "../message.interface";
import { Observable } from "rxjs";
import { UserService } from "./user.service";


export interface Contact {
  uid: string;
  username: string;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  firebaseAuth = inject(Auth);
  firestore = inject(Firestore);
  userService = inject(UserService);
  user$ = user(this.firebaseAuth);
  currentUserSignal = signal<UserInterface | null | undefined>(undefined);


  async getAllConversations( currentUserId : string | null | undefined ): Promise<Conversation[]> {
    try {
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      const q = query(
        collection(this.firestore, 'conversations'),
        where('participants', 'array-contains', currentUserId),
        orderBy('lastMessageTimestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        participants: doc.data()['participants'],
        createdAt: doc.data()['createdAt'].toDate(),
        lastMessage: doc.data()['lastMessage'],
        lastMessageSender: doc.data()['lastMessageSender'],
        lastMessageTimestamp: doc.data()['lastMessageTimestamp'] ? doc.data()['lastMessageTimestamp'].toDate() : null,
      }));
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    try {
      const participants = [userId1, userId2].sort();
      const q = query(
        collection(this.firestore, 'conversations'),
        where('participants', '==', participants)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          participants: doc.data()['participants'],
          createdAt: doc.data()['createdAt'].toDate(),
          lastMessage: doc.data()['lastMessage'],
          lastMessageSender: doc.data()['lastMessageSender'],
          lastMessageTimestamp: doc.data()['lastMessageTimestamp'] ? doc.data()['lastMessageTimestamp'].toDate() : null,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  async createConversation(userId1: string, userId2: string): Promise<string> {
    try {
      const userDoc1 = await getDoc(doc(this.firestore, 'users', userId1));
      const userDoc2 = await getDoc(doc(this.firestore, 'users', userId2));
      if (!userDoc1.exists() || !userDoc2.exists()) {
        throw new Error('One or both users do not exist');
      }

      if (userId1 === userId2) {
        throw new Error('Cannot create a conversation with yourself');
      }

      const existingConversation = await this.getConversation(userId1, userId2);
      if (existingConversation) {
        return existingConversation.id;
      }

      const participants = [userId1, userId2].sort();
      const conversationRef = doc(collection(this.firestore, 'conversations'));
      await setDoc(conversationRef, {
        participants,
        createdAt: new Date(),
        lastMessage: '',
        lastMessageSender: '',
        lastMessageTimestamp: null
      });

      return conversationRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const conversationDoc = await getDoc(doc(this.firestore, 'conversations', conversationId));
      if (!conversationDoc.exists()) {
        throw new Error('Conversation does not exist');
      }

      await deleteDoc(doc(this.firestore, 'conversations', conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  async addContact(userId: string, contactId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User does not exist');
      }

      const contactDoc = await getDoc(doc(this.firestore, 'users', contactId));
      if (!contactDoc.exists()) {
        throw new Error('Contact does not exist');
      }

      const contacts = userDoc.data()['contacts'] || [];
      if (!contacts.includes(contactId)) {
        await updateDoc(userRef, {
          contacts: arrayUnion(contactId)
        });
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    try {
      const conversationDoc = await getDoc(doc(this.firestore, 'conversations', conversationId));
      if (!conversationDoc.exists()) {
        throw new Error('Conversation does not exist');
      }

      const participants = conversationDoc.data()['participants'] as string[];
      const receiverId = participants.find(uid => uid !== senderId);
      if (!receiverId) {
        throw new Error('Recipient not found in conversation');
      }

      await this.addContact(receiverId, senderId);

      const messageRef = doc(collection(this.firestore, 'messages'));
      const timestamp = new Date();
      const message: Message = {
        id: messageRef.id,
        conversationId,
        senderId,
        content: content.trim(),
        createdAt: timestamp,
        isRead: false
      };

      await setDoc(messageRef, message);

      await updateDoc(doc(this.firestore, 'conversations', conversationId), {
        lastMessage: content.trim(),
        lastMessageSender: senderId,
        lastMessageTimestamp: timestamp
      });


      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  listenToMessages(conversationId: string): Observable<Message[]> {
    const messagesQuery = query(
      collection(this.firestore, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    return new Observable<Message[]>(observer => {
      const unsubscribe = onSnapshot(messagesQuery, snapshot => {
        const messages: Message[] = snapshot.docs.map(doc => ({
          id: doc.id,
          conversationId: doc.data()['conversationId'],
          senderId: doc.data()['senderId'],
          content: doc.data()['content'],
          createdAt: doc.data()['createdAt'].toDate(),
          isRead: doc.data()['isRead']
        }));
        observer.next(messages);
      }, error => {
        console.error('Error listening to messages:', error);
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }


  async getUnreadMessagesCount(conversationId: string): Promise<number> {
    try {
      const currentUserId = this.firebaseAuth.currentUser?.uid;
      const messagesQuery = query(
        collection(this.firestore, 'messages'),
        where('conversationId', '==', conversationId),
        where('isRead', '==', false),
        where('senderId', '!=', currentUserId)
      );
      const querySnapshot = await getDocs(messagesQuery);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error counting unread messages:', error);
      throw error;
    }
  }
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      const currentUserId = this.firebaseAuth.currentUser?.uid;
      const messagesQuery = query(
        collection(this.firestore, 'messages'),
        where('conversationId', '==', conversationId),
        where('isRead', '==', false),
        where('senderId', '!=', currentUserId)
      );
      const querySnapshot = await getDocs(messagesQuery);

      const batch = writeBatch(this.firestore);
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }


}