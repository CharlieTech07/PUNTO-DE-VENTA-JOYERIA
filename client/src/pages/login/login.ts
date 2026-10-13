// client/src/pages/login/login.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submitted = false;
  loading = false;
  errorMessage = '';

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    // Asegurarse de enviar 'correo' y 'contrasena'
    const credenciales = {
      correo: this.loginForm.value.email.trim(),
      contrasena: this.loginForm.value.password.trim()
    };

    this.authService.iniciarSesion(credenciales).subscribe({
      next: (_resp) => {
        this.loading = false;
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al iniciar sesión:', err);
        this.errorMessage = err.error?.error || 'Credenciales inválidas o error de conexión.';
      }
    });
  }
}