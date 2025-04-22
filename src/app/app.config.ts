import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

const firebaseConfig = {
  // Your Firebase configuration object
  
  apiKey: "AIzaSyAt97brA-t1Ep64FhPFZ63bxx-yHDWCQPk",
  authDomain: "angular-visio.firebaseapp.com",
  projectId: "angular-visio",
  storageBucket: "angular-visio.firebasestorage.app",
  messagingSenderId: "715871900309",
  appId: "1:715871900309:web:afa4c5c04dca2a19e5419c"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ]
};
