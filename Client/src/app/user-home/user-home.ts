import { Component, OnInit, signal, inject } from '@angular/core';
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

  ngOnInit() {
    const userData = this.apiService.getCurrentUser();
    if (userData) {
      this.user.set(userData);
    }
  }
}
