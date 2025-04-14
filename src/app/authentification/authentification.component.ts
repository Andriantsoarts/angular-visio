import { HttpClient } from '@angular/common/http';
import { Component, inject, ElementRef, HostListener  } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';


@Component({
  selector: 'app-authentification',
  templateUrl: './authentification.component.html',
  styleUrl: './authentification.component.css',
  standalone: true,
  imports: [ReactiveFormsModule],
})
export class AuthentificationComponent {
    constructor(private elementRef: ElementRef) {}

    ngAfterViewInit() {
        this.setupAnimation();
    }

    setupAnimation() {
        const btn_have = this.elementRef.nativeElement.querySelector("#btn-have");
        const btn_dont_have = this.elementRef.nativeElement.querySelector("#btn-dont-have");
        const hide_login = this.elementRef.nativeElement.querySelector("#hide-login");
        const hide_register = this.elementRef.nativeElement.querySelector("#hide-register");

        const resetInputs = (divSelector: Element) => {
        const inputs = divSelector.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type !== 'submit') {
            input.value = '';
            }
        });
        }

        if (btn_dont_have) {
        btn_dont_have.addEventListener("click", function() {
            hide_register.style.right = "-50%";
            hide_register.style.borderRadius = "50% 0 0 50%";
            hide_register.style.boxShadow = "none";
            hide_login.style.left = "0";
            hide_login.style.borderRadius = "0";
            hide_login.style.boxShadow = "0px 0px 10px black";

            const loginForm = btn_dont_have.closest('.content').querySelector('.login form');
            if (loginForm) resetInputs(loginForm);
        });
        }

        if (btn_have) {
        btn_have.addEventListener("click", function() {
            hide_register.style.right = "0";
            hide_register.style.borderRadius = "0";
            hide_register.style.boxShadow = "0px 0px 10px black";
            hide_login.style.left = "-50%";
            hide_login.style.borderRadius = "0 50% 50% 0";
            hide_login.style.boxShadow = "none";

            const registerForm = btn_have.closest('.content').querySelector('.register form');
            if (registerForm) resetInputs(registerForm);
        });
        }

        const login = this.elementRef.nativeElement.querySelector('#login');
        const register = this.elementRef.nativeElement.querySelector('#register');
        const createAccountBtn = this.elementRef.nativeElement.querySelector('#btn-dont-have-hiden');
        const haveAccountBtn = this.elementRef.nativeElement.querySelector('#btn-have-hiden');

        if (createAccountBtn && haveAccountBtn && login && register) {
        createAccountBtn.addEventListener("click", function() {
            login.classList.add("show-register");
            register.classList.add("show-register");
            createAccountBtn.style.display = "none";
            haveAccountBtn.style.display = "block";
        });

        haveAccountBtn.addEventListener("click", function() {
            login.classList.remove("show-register");
            register.classList.remove("show-register");
            haveAccountBtn.style.display = "none";
            createAccountBtn.style.display = "block";
        });
        }

        this.checkScreenSize();
    }

    @HostListener('window:resize')
    checkScreenSize() {
        const login = this.elementRef.nativeElement.querySelector('#login');
        const createAccountBtn = this.elementRef.nativeElement.querySelector('#btn-dont-have-hiden');
        const haveAccountBtn = this.elementRef.nativeElement.querySelector('#btn-have-hiden');

        if (window.innerWidth > 650) {
        if (createAccountBtn) createAccountBtn.style.display = "none";
        if (haveAccountBtn) haveAccountBtn.style.display = "none";
        } else if (window.innerWidth < 650 && login.classList.contains("show-register")) {
        if (haveAccountBtn) haveAccountBtn.style.display = "block";
        if (createAccountBtn) createAccountBtn.style.display = "none";
        } else if (window.innerWidth < 650 && !login.classList.contains("show-register")) {
        if (haveAccountBtn) haveAccountBtn.style.display = "none";
        if (createAccountBtn) createAccountBtn.style.display = "block";
        }
    }

    fb = inject(FormBuilder);
    http = inject(HttpClient);
    authService = inject(AuthService);
    router = inject(Router);
    errorMessage: string | null = null;

    form = this.fb.nonNullable.group({
        email: ['', Validators.required],
        password: ['', Validators.required],
    });

    onSubmitLogin(): void {
        const rawForm = this.form.getRawValue();
        this.authService
        .login(rawForm.email, rawForm.password)
        .subscribe({
            next: () => {
            this.router.navigateByUrl('/');
            },
            error: (err) => {
            this.errorMessage = err.code;
            }
        })
    }

    formRegister = this.fb.nonNullable.group({
        username: ['', Validators.required],
        email: ['', Validators.required],
        password: ['', Validators.required],
    });

    onSubmitRegister(): void {
        const rawForm = this.formRegister.getRawValue();
        this.authService
        .register(rawForm.email, rawForm.username, rawForm.password)
        .subscribe({
            next: () => {
            this.router.navigateByUrl('/connexion');
            },
            error: (err) => {
            this.errorMessage = err.code;
            }
        })
    }
}
