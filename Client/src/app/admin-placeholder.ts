import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminNav } from './admin-nav/admin-nav';
import { AdminFooter } from './admin-footer/admin-footer';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  imports: [AdminNav, AdminFooter, RouterLink],
  template: `
<app-admin-nav></app-admin-nav>
<main class="page-container">
    <div class="breadcrumb-bar">
        <a routerLink="/admin-home"><i class="fas fa-home"></i> Home</a>
        <span> > </span>
        <span class="active">Admin Page Placeholder</span>
    </div>
    <div class="theme-card">
        <header class="blue-header-strip">
           <h2>Admin Module</h2>
        </header>
        <div class="page-card-content" style="padding: 50px; text-align: center;">
            <i class="fas fa-tools" style="font-size: 48px; color: #ccc; margin-bottom: 20px; display: block;"></i>
            <h3>Admin Page Under Construction</h3>
            <p>This module is currently being refined to match the new design system.</p>
        </div>
    </div>
</main>
<app-admin-footer></app-admin-footer>
  `,
  styles: [`
    .page-container { padding: 20px; background: #f4f4f4; min-height: 80vh; }
    .breadcrumb-bar { margin-bottom: 15px; font-size: 13px; color: #666; }
    .breadcrumb-bar a { color: #666; text-decoration: none; }
    .theme-card { background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .blue-header-strip { background: #0b5ed7; color: white; padding: 10px 15px; }
    .blue-header-strip h2 { margin: 0; font-size: 18px; }
  `]
})
export class AdminPlaceholderComponent {}
