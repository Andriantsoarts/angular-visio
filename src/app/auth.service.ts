import { inject, Injectable, signal } from "@angular/core";
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, user } from "@angular/fire/auth";
import { Firestore, doc, getDoc, setDoc, updateDoc } from "@angular/fire/firestore";
import { Observable, from } from "rxjs";
import { UserInterface } from "./user.interface";


@Injectable({
    providedIn: 'root'
})

export class AuthService {
    firebaseAuth = inject(Auth);
    firestore = inject(Firestore);
    user$ = user(this.firebaseAuth);
    currentUserSignal = signal<UserInterface | null | undefined>(undefined);


    register(email: string, username: string, password: string): Observable<void>{
        const promise = createUserWithEmailAndPassword(
            this.firebaseAuth,
            email,
            password,
        ).then(response => {
            const user = response.user;
            return updateProfile(user, { displayName: username }).then(() => user);
        })
        .then(user => {
            return setDoc(doc(this.firestore, 'users', user.uid), {
                uid: user.uid,
                username: username,
                email: email,
                usernameLowercase: username.toLowerCase(),
                createdAt: new Date(),
                contacts: [],
                isConnected: false,
            });
        })
        .then(() => signOut(this.firebaseAuth));

        return from(promise)
    }

    async updateConnectionStatus(userId: string, isConnected: boolean): Promise<void> {
        try {
          const userRef = doc(this.firestore, 'users', userId);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            throw new Error('User does not exist');
          }
          await updateDoc(userRef, { isConnected });
        } catch (error) {
          console.error('Error updating connection status:', error);
          throw error;
        }
    }
    login(email: string, password: string): Observable<void> {
        const promise = signInWithEmailAndPassword(
            this.firebaseAuth,
            email,
            password,
        ).then((response) => {
            const user = response.user;
            this.updateConnectionStatus(user.uid, true);
          });


        return from(promise)
    }
    logout(): Observable<void> {
        const promise = signOut(this.firebaseAuth);

        return from(promise)
    }
}