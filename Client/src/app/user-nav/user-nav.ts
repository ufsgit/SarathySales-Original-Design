import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../services/api.service';
import { BrandService } from '../services/brand.service';
import { AdminNav } from '../admin-nav/admin-nav';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AdminNav, CommonModule],
  templateUrl: './user-nav.html',
  styleUrl: './user-nav.css',
})
export class UserNav {
  private api = inject(ApiService);
  private router = inject(Router);
  private brandService = inject(BrandService);
  menuOpen = false;

  getLogo(): string {
    const brand = this.brandService.getBrandConfig();
    if (!brand) return '';
    if (brand.brand_name.toLowerCase().includes('bajaj')) {
      return 'BajajLogo.png';
    }
    if (brand.brand_name.toLowerCase().includes('ktm')) {
      return 'KtmLogo.png';
    }
    return '';
  }

  isAdmin = computed(() => {
    const user = this.api.getCurrentUser();
    return user && (user.role == 1 || user.role_des === 'admin');
  });

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout(event: Event) {
    event.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
      this.api.logout();
      this.router.navigate(['/']);
    }
  }
}