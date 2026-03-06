import { Component, OnInit, signal } from '@angular/core';
import { UserNav } from "../user-nav/user-nav";
import { UserFooter } from "../user-footer/user-footer";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [UserNav, UserFooter, CommonModule],
  templateUrl: './user-home.html',
  styleUrl: './user-home.css',
})
export class UserHome implements OnInit {
  user = signal<any>(null);

  ngOnInit() {
    const data = localStorage.getItem('sarathy_user');
    if (data) {
      this.user.set(JSON.parse(data));
    }
  }
}
