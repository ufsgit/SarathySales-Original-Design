import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(private router: Router, private api: ApiService) { }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter username and password.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          const user = this.api.getCurrentUser();
          if (user && user.role == 2) {
            this.router.navigate(['/user-home']);
          } else if (user && (user.role_des === 'admin' || user.role == 1)) {
            this.router.navigate(['/admin-home']);
          } else {
            alert('Access Denied: You do not have permission to access the system.');
            this.api.logout();
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Login failed. Please check your credentials.';
        
        // If the error message mentions 'not active', alert the user
        if (msg.toLowerCase().includes('not active')) {
          alert(msg);
        }
        
        this.errorMessage.set(msg);
      }
    });
  }
}

