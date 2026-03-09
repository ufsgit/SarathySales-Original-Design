import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../services/api.service';
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
  menuOpen = false;

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