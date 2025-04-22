import { inject, Injectable, signal } from "@angular/core";
import { Auth, user  } from "@angular/fire/auth";
import { arrayRemove, arrayUnion, doc, Firestore, getDoc, onSnapshot, setDoc, updateDoc } from "@angular/fire/firestore";
import { UserInterface } from "../user.interface";

@Injectable({
    providedIn: 'root'
})

export class UserService {

        private contactUnsubscribes: Map<string, () => void> = new Map();

        firebaseAuth = inject(Auth);
        firestore = inject(Firestore);
        user$ = user(this.firebaseAuth);
        currentUserSignal = signal<UserInterface | null | undefined>(undefined);
        contacts = signal<UserInterface[]>([]);

        async getContacts(userId: string): Promise<void> {
            try {
                // Nettoyer les anciens listeners
                this.cleanupContactListeners();

                const userDoc = await getDoc(doc(this.firestore, 'users', userId));
                if (userDoc.exists()) {
                    const contactUids = userDoc.data()['contacts'] || [];

                    contactUids.forEach((uid : string) => {
                        const docRef = doc(this.firestore, 'users', uid);

                        const unsubscribe = onSnapshot(docRef, (contactDoc) => {
                            if (contactDoc.exists()) {
                                const contactData = contactDoc.data() as UserInterface;

                                this.contacts.update(prevContacts => {
                                    const newContacts = [...prevContacts];
                                    const index = newContacts.findIndex(c => c.uid === uid);

                                    if (index > -1) {
                                        newContacts[index] = {
                                            ...contactData,
                                            uid: contactDoc.id
                                        };
                                    } else {
                                        newContacts.push({
                                            ...contactData,
                                            uid: contactDoc.id
                                        });
                                    }
                                    return newContacts;
                                });
                            }
                        });

                        this.contactUnsubscribes.set(uid, unsubscribe);
                    });
                }
            } catch (error) {
                console.error('Error loading contacts:', error);
                this.contacts.set([]);
            }
        }

        private cleanupContactListeners(): void {
            this.contactUnsubscribes.forEach(unsubscribe => unsubscribe());
            this.contactUnsubscribes.clear();
            this.contacts.set([]);
        }

        ngOnDestroy(): void {
            this.cleanupContactListeners();
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
                    throw new Error('User document does not exist');
                }

                const userData = userDoc.data();
                const currentContacts = userData['contacts'] || [];

                if (currentContacts.includes(contactUid)) {
                    throw new Error('CONTACT_ALREADY_EXISTS');
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