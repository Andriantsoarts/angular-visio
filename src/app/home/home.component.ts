import { HttpClient } from "@angular/common/http";
import { Component, inject, ElementRef, HostListener } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
    selector: "app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.css"],
    standalone: true,
    imports: [ReactiveFormsModule],
})
export class HomeComponent {

}