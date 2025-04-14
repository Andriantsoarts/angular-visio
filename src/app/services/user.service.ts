import { inject, Injectable, signal } from "@angular/core";
import { Auth, user  } from "@angular/fire/auth";
import { Firestore } from "@angular/fire/firestore";
import { UserInterface } from "../user.interface";

@Injectable({
    providedIn: 'root'
})

export class UserService {

        firebaseAuth = inject(Auth);
        firestore = inject(Firestore);
        user$ = user(this.firebaseAuth);
        currentUserSignal = signal<UserInterface | null | undefined>(undefined);

}