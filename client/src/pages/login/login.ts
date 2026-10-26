import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../services/translate.pipe';
import { AuthService } from '../../services/auth.service';

// Intro "Luz de vitrina": su animación más larga dura 1.6 s (login-intro.css), más un margen
const DURACION_INTRO_MS = 1650;
const INTRO_VISTA = 'olimpo:intro-vista';

// Solo la primera vez por sesión y nunca con "reducir movimiento".
// Si el navegador no deja usar sessionStorage, mejor sin intro que repetirla siempre.
function tocaIntro(): boolean {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (sessionStorage.getItem(INTRO_VISTA)) return false;
    sessionStorage.setItem(INTRO_VISTA, '1');
    return true;
  } catch {
    return false;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrls: ['./login.css', './login-intro.css'],
  host: { '[class.con-intro]': 'introActiva()' }
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  readonly introActiva = signal(tocaIntro());
  private campoUsuario = viewChild<ElementRef<HTMLInputElement>>('campoUsuario');
  private finIntro?: ReturnType<typeof setTimeout>;

  loginForm: FormGroup = this.fb.group({
    // Se entra con el nombre de usuario. Los términos y el aviso de privacidad ya no se
    // aceptan aquí: le llegan a cada empleado por correo cuando lo dan de alta.
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });
  submitted = false;
  // Signals: sin zone.js, la respuesta del servidor no redibuja la pantalla por sí sola
  // (con variables normales el botón se quedaba en "INGRESANDO..." y el error no salía)
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  showPassword = false;

  ngOnInit(): void {
    this.aplicarTema();

    // Al terminar la intro (o de una vez si no hubo) el cursor queda en el usuario.
    // En pantallas táctiles no, para que no salte el teclado encima del login.
    this.finIntro = setTimeout(() => {
      this.introActiva.set(false);
      if (matchMedia('(pointer: fine)').matches) {
        this.campoUsuario()?.nativeElement.focus({ preventScroll: true });
      }
    }, this.introActiva() ? DURACION_INTRO_MS : 0);
  }

  ngOnDestroy(): void {
    clearTimeout(this.finIntro);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private aplicarTema(): void {
    const temaGuardado = localStorage.getItem('olimpo:tema');
    const tema = temaGuardado === 'claro' ? 'claro' : 'oscuro';
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem('olimpo:tema', tema);
  }

  get usuario() {
    return this.loginForm.get('usuario');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);

    const credenciales = {
      usuario: this.loginForm.value.usuario.trim(),
      contrasena: this.loginForm.value.password.trim()
    };

    this.authService.iniciarSesion(credenciales).subscribe({
      next: (_resp) => {
        this.loading.set(false);
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error al iniciar sesión:', err);
        this.errorMessage.set(err.error?.error || 'Credenciales inválidas o error de conexión.');
      }
    });
  }
}
