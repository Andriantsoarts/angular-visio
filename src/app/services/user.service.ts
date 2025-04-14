import { inject, Injectable, signal } from "@angular/core";
import { Auth, user  } from "@angular/fire/auth";
import { arrayRemove, arrayUnion, doc, Firestore, getDoc, setDoc, updateDoc } from "@angular/fire/firestore";
import { UserInterface } from "../user.interface";

@Injectable({
    providedIn: 'root'
})

export class UserService {

        firebaseAuth = inject(Auth);
        firestore = inject(Firestore);
        user$ = user(this.firebaseAuth);
        currentUserSignal = signal<UserInterface | null | undefined>(undefined);
        contacts = signal<UserInterface[]>([]);

        async getContacts(userId:string):Promise<void> {
            try{
                const userDoc = await getDoc(doc(this.firestore, 'users', userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const contactUids = userData['contacts'] || [];
                    const contactDetails: UserInterface[] = [];

                    for (const uid of contactUids) {
                      const contactDoc = await getDoc(doc(this.firestore, 'users', uid));
                      if (contactDoc.exists()) {
                        const contactData = contactDoc.data() as UserInterface;
                        contactDetails.push({
                          uid: contactDoc.id,
                          email: contactData.email,
                          username: contactData.username
                        });
                      }
                    }
                    this.contacts.set(contactDetails);
                  } else {
                    this.contacts.set([]);
                  }
                } catch (error) {
                  console.error('Error loading contacts:', error);
                  this.contacts.set([]);
                }
        }

        async addContact(userId: string, contactUid: string): Promise<void> {
            try {
                const contactDoc = await getDoc(doc(this.firestore, 'users', contactUid));
                if (!contactDoc.exists()) {
                    throw new Error('Contact does not exist');
                }
                if (userId === contactUid) {
                    throw new Error('Cannot add yourself as a contact');
                }

                const userDocRef = doc(this.firestore, 'users', userId);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        contacts: [],
                        email: this.currentUserSignal()?.email || '',
                        username: this.currentUserSignal()?.username || '',
                        createdAt: new Date()
                    });
                } else {
                    const userData = userDoc.data();
                    if (!Array.isArray(userData['contacts'])) {
                        await updateDoc(userDocRef, {
                            contacts: []
                        });
                    }
                }

                await updateDoc(userDocRef, {
                    contacts: arrayUnion(contactUid)
                });

                await this.getContacts(userId);
            } catch (error) {
                console.error('Error adding contact:', error);
                throw error;
            }
        }

        async removeContact(userId: string, contactUid: string): Promise<void> {
            try {
                await updateDoc(doc(this.firestore, 'users', userId), {
                    contacts: arrayRemove(contactUid)
                });

                await this.getContacts(userId);
            } catch (error) {
                console.error('Error removing contact:', error);
                throw error;
            }
        }


}