import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../services/translate.pipe';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    // Casilla de términos y aviso de privacidad (opción B que votó el equipo).
    // Nace sin marcar a propósito: una casilla ya marcada no cuenta como aceptación.
    aceptaTerminos: [false, Validators.requiredTrue]
  });
  submitted = false;
  loading = false;
  errorMessage = '';
  isModoClaro = false;
  showPassword = false;

  ngOnInit(): void {
    const temaGuardado = localStorage.getItem('olimpo:tema');
    this.isModoClaro = temaGuardado === 'claro';
    this.aplicarTema();
  }

  toggleTema(): void {
    this.isModoClaro = !this.isModoClaro;
    this.aplicarTema();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private aplicarTema(): void {
    const tema = this.isModoClaro ? 'claro' : 'oscuro';
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem('olimpo:tema', tema);
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get aceptaTerminos() {
    return this.loginForm.get('aceptaTerminos');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

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
