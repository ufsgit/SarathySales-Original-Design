import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { UserNav } from "../user-nav/user-nav";
import { UserFooter } from "../user-footer/user-footer";
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [UserNav, UserFooter, CommonModule],
  templateUrl: './user-home.html',
  styleUrl: './user-home.css',
})
export class UserHome implements OnInit {
  private apiService = inject(ApiService);
  user = signal<any>(null);
  isAdmin = computed(() => {
    const u = this.apiService.getCurrentUser();
    return u?.role == 1 || u?.role_des === 'admin';
  });

  ngOnInit() {
    const userData = this.apiService.getCurrentUser();
    if (userData) {
      this.user.set(userData);
    }
  }
}
