import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { BrandService } from '../services/brand.service';

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

  constructor(private router: Router, private api: ApiService, private brandService: BrandService) { }

  getLogo(): string {
    const brand = this.brandService.getBrandConfig();
    if (brand && brand.brand_name.toLowerCase().includes('bajaj')) {
      return 'BajajLogo.png';
    }
    return 'KtmLogo.png';
  }

  getBrandName(): string {
    const brand = this.brandService.getBrandConfig();
    return brand ? brand.brand_name : 'KTM SALES';
  }

  getBrandColor(): string {
    const brand = this.brandService.getBrandConfig();
    return brand ? brand.brand_color : '#f36f21';
  }

  getDarkBrandColor(percent: number = 25): string {
    const color = this.getBrandColor();
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const darken = (val: number) => Math.max(0, Math.min(255, Math.round(val * (1 - percent / 100))));

    const dr = darken(r).toString(16).padStart(2, '0');
    const dg = darken(g).toString(16).padStart(2, '0');
    const db = darken(b).toString(16).padStart(2, '0');

    return `#${dr}${dg}${db}`;
  }

  getBrandGradient(): string {
    const color = this.getBrandColor();
    const darkColor = this.getDarkBrandColor(35); // 35% darker for rich gradient contrast
    return `linear-gradient(90deg, ${color} 0%, ${darkColor} 100%)`;
  }

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

