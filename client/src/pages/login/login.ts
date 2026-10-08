import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  isModoClaro = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    const temaGuardado = localStorage.getItem('tema');
    this.isModoClaro = temaGuardado === 'claro';
    this.aplicarTema();
  }

  toggleTema(): void {
    this.isModoClaro = !this.isModoClaro;
    this.aplicarTema();
  }

  private aplicarTema(): void {
    const tema = this.isModoClaro ? 'claro' : 'oscuro';
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem('tema', tema);
  }

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

    // Llamada al backend
    this.router.navigate(['/inicio']);
  }
}
