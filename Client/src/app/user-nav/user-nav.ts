import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-user-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './user-nav.html',
  styleUrl: './user-nav.css',
})
export class UserNav {
  private api = inject(ApiService);
  private router = inject(Router);
  menuOpen = false;

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