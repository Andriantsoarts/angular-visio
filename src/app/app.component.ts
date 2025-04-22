import { Component, inject, OnInit, ElementRef, Renderer2, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AuthentificationComponent } from './authentification/authentification.component';
import { Router } from '@angular/router';
import {UserInterface} from './user.interface';
import { collection, doc, Firestore, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { UserService } from './services/user.service';
import { ChatService } from './services/chat.service';


@Component({
  selector: 'app-root',
  // imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [CommonModule, MatButtonModule, RouterOutlet,FormsModule, RouterLink],
})
export class AppComponent implements OnInit {
    authService = inject(AuthService);
    userService = inject(UserService);
    chatService = inject(ChatService);
    router = inject(Router);
    firestore = inject(Firestore);
    searchQuery = '';
    searchResults = signal<UserInterface[]>([]);
    contacts = this.userService.contacts;

    constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

    ngOnInit():void {
      this.authService.user$.subscribe((user) => {
        if(user) {
          this.authService.currentUserSignal.set({
            uid: user.uid,
            email: user.email!,
            username: user.displayName!,
            isConnected: true
          });
          this.userService.getContacts(user.uid);
        } else {
          this.authService.currentUserSignal.set(null);
          this.userService.contacts.set([]);
        }
      console.log(this.authService.currentUserSignal());
      })
    }




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
    showConversations = true;
    isSearchBarVisible = false;


    toggleProfileMenu() {
      this.isProfileMenuOpen = !this.isProfileMenuOpen;
    }
    isVisioMenuOpen = false;
    toggleVisioMenu() {
      this.isVisioMenuOpen = !this.isVisioMenuOpen;
      this.isSearchBarVisible = false;
      this.isProfileMenuOpen = false;
    }
    toggleConversations() {
      this.showConversations = true;
      this.isVisioMenuOpen = false;
      this.isSearchBarVisible = false;
      this.isProfileMenuOpen = false;
    }
    toggleContacts() {
      this.showConversations = false;
      this.isVisioMenuOpen = false;
      this.isSearchBarVisible = false;
      this.isProfileMenuOpen = false;
    }
    toggleSearchBar() {
      this.isSearchBarVisible = !this.isSearchBarVisible;
      this.isVisioMenuOpen = false;
      this.isProfileMenuOpen = false;
    }

    navigateToEditProfile() {
      this.router.navigate(['/edit-profile']);
      this.isProfileMenuOpen = false;
      this.isVisioMenuOpen = false;
    }
    navigateToHome() {
      this.router.navigate(['/']);
      this.isProfileMenuOpen = false;
      this.isSearchBarVisible = false;
      this.isVisioMenuOpen = false;
    }

    navigateToCallCreatePage(){
      this.router.navigate(['/callCreate']);
      this.isVisioMenuOpen = false;
    }
    navigateToCallPage(){
      this.router.navigate(['/call']);
      this.isVisioMenuOpen = false;
    }
    confirmLogout() {
      const confirmation = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (confirmation) {
        this.logout();
        this.isProfileMenuOpen = false;
      }
    }
    logout(): void {
      const currentUser = this.authService.currentUserSignal();
      if (currentUser) {
        this.authService.updateConnectionStatus(currentUser.uid, false);
      }
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
            username: data.username,
            isConnected: data.isConnected
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
          await this.selectContact(user);
        } catch (error: any) {
          if (error.message === 'CONTACT_ALREADY_EXISTS') {
            await this.selectContact(user);
          } else {
            console.error('Erreur lors de l\'ajout:', error.message);
          }
        }
      }
      this.searchQuery = '';
      this.searchResults.set([]);
    }


  async selectContact(contact: UserInterface): Promise<void> {
    const currentUserUid = this.authService.currentUserSignal()?.uid;
    if (currentUserUid && contact.uid) {
      try {
        const conversationId = await this.chatService.createConversation(currentUserUid, contact.uid);
        await this.router.navigate(['/chat', conversationId]);
      } catch (error: any) {
        console.error('Erreur lors de la création de la conversation:', error.message);
      }
    }
  }
  dummyConversations = [
    {
      name: 'John Doe',
      lastMessage: 'Salut, ça va ?',
      unread: 2,
      isConnected: true
    },
    {
      name: 'John Doe',
      lastMessage: 'Salut, ça va ?',
      unread: 2,
      isConnected: true
    },
    {
      name: 'John Doe',
      lastMessage: 'Salut, ça va ?',
      unread: 2,
      isConnected: true
    },
    {
      name: 'John Doe',
      lastMessage: 'Salut, ça va ?',
      unread: 2,
      isConnected: true
    },
    {
      name: 'John Doe',
      lastMessage: 'Salut, ça va ?',
      unread: 2,
      isConnected: true
    },
    {
      name: 'John Doe',
      lastMessage: 'Salut, ça va ?',
      unread: 2,
      isConnected: true
    },
    {
      name: 'John Doe',
      lastMessage: 'Salut, ça va ?',
      unread: 2,
      isConnected: true
    },
    {
      name: 'Marie Dupont',
      lastMessage: 'À demain pour la réunion !',
      unread: 0,
      isConnected: false
    }
  ];
}
