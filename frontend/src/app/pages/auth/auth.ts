import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, LoginComponent],
  templateUrl: './auth.html',
  styleUrls: ['./login.scss'],
})
export class AuthComponent {}
