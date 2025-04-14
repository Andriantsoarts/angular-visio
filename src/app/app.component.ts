import { Component, inject, OnInit, ElementRef, Renderer2, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AuthentificationComponent } from './authentification/authentification.component';
import { Router } from '@angular/router';
import {UserInterface} from './user.interface';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  // imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [CommonModule, MatButtonModule, RouterOutlet,FormsModule, RouterLink, AuthentificationComponent],
})
export class AppComponent implements OnInit {
    authService = inject(AuthService);
    userService = inject(UserService);
    router = inject(Router);
    firestore = inject(Firestore);
    searchQuery = '';
    searchResults = signal<UserInterface[]>([]);
    contacts = this.userService.contacts;

    ngOnInit():void {
      this.authService.user$.subscribe((user) => {
        if(user) {
          this.authService.currentUserSignal.set({
            uid: user.uid,
            email: user.email!,
            username: user.displayName!,
          });
          this.userService.getContacts(user.uid);
        } else {
          this.authService.currentUserSignal.set(null);
          this.userService.contacts.set([]);
        }
      console.log(this.authService.currentUserSignal());
      })
    }



    constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

    ngAfterViewInit() {
      this.setupSidebarFunctionality();
    }

    setupSidebarFunctionality() {
      const open_btn = document.getElementById("open-menu");
      const close_btn = this.elementRef.nativeElement.querySelector("#close-menu");
      const sidebar = this.elementRef.nativeElement.querySelector(".side-bar");
      const links = this.elementRef.nativeElement.querySelectorAll(".side-bar .contact ul li a");

      if (open_btn && sidebar) {
        open_btn.addEventListener("click", () => {
          if (!sidebar.classList.contains("show")) {
            this.renderer.addClass(sidebar, "show");
          }
        });
      }

      if (close_btn && sidebar) {
        close_btn.addEventListener("click", () => {
          if (sidebar.classList.contains("show")) {
            this.renderer.removeClass(sidebar, "show");
          }
        });
      }

      if (links && sidebar) {
        links.forEach((link: Element) => {
          link.addEventListener("click", () => {
            if (sidebar.classList.contains("show")) {
              this.renderer.removeClass(sidebar, "show");
            }
          });
        });
      }
    }

    openSidebar() {
      const sidebar = this.elementRef.nativeElement.querySelector(".side-bar");
      if (sidebar) {
        this.renderer.addClass(sidebar, "show");
      }
    }

    closeSidebar() {
      const sidebar = this.elementRef.nativeElement.querySelector(".side-bar");
      if (sidebar) {
        this.renderer.removeClass(sidebar, "show");
      }
    }

    onSearchSubmit(event: Event) {
      event.preventDefault();
      const searchInput = this.elementRef.nativeElement.querySelector("#search-bar");
    }
    isProfileMenuOpen = false;

    toggleProfileMenu() {
      this.isProfileMenuOpen = !this.isProfileMenuOpen;
    }

    navigateToEditProfile() {
      this.router.navigate(['/edit-profile']);
      this.isProfileMenuOpen = false;
    }
    confirmLogout() {
      const confirmation = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (confirmation) {
        this.logout();
        this.isProfileMenuOpen = false;
      }
    }
    logout(): void {
      this.authService
        .logout()
        .subscribe({
          next: () => {
          this.router.navigateByUrl('/connexion');
          }
        });
    }
    async searchUsers(): Promise<void> {
      if (this.searchQuery.trim().length < 2) {
        this.searchResults.set([]);
        return;
      }

      try {
        const normalizedQuery = this.searchQuery.toLowerCase();
        const q = query(
          collection(this.firestore, 'users'),
          where('usernameLowercase', '>=', normalizedQuery),
          where('usernameLowercase', '<=', normalizedQuery + '\uf8ff')
        );
        const querySnapshot = await getDocs(q);
        const users: UserInterface[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as UserInterface;
          users.push({
            uid: data.uid,
            email: data.email,
            username: data.username
          });
        });
        if (this.authService.currentUserSignal()) {
          this.searchResults.set(users.filter(user => user.email !== this.authService.currentUserSignal()!.email));
        }
      } catch (error) {
        console.error('Search error:', error);
        this.searchResults.set([]);
      }
    }

    async selectUser(user: UserInterface): Promise<void> {
      const currentUserUid = this.authService.currentUserSignal()?.uid;
      if (currentUserUid && user.uid) {
        try {
          await this.userService.addContact(currentUserUid, user.uid);
          console.log('Contact ajouté:', user.username);
        } catch (error: any) {
          console.error('Erreur lors de l\'ajout:', error.message);
        }
      }
      console.log('Selected user:', user);
      this.searchQuery = '';
      this.searchResults.set([]);
    }

    selectContact(contact: UserInterface): void {
      console.log('Selected contact:', contact);
    }
}
