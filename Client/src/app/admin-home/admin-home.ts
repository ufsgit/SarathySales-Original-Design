import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [AdminNav, AdminFooter, RouterLink],
  template: `
<app-admin-nav></app-admin-nav>

<main class="main-container">
    <div class="breadcrumb-strip">
        <span class="home-icon"><i class="fas fa-home"></i></span>
        <a routerLink="/admin-home" class="breadcrumb-text">Home</a>
    </div>

    <div class="admin-welcome-area">
        <div class="welcome-card">
            <h1>Welcome to Admin Panel</h1>
            <p>Select an operation from the menu to get started.</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card blue" routerLink="/previous-sales-invoice">
                <i class="fas fa-file-invoice"></i>
                <div class="stat-info">
                    <h3>Recent Invoices</h3>
                    <p>Manage your sales and records</p>
                </div>
            </div>
            <div class="stat-card green" routerLink="/admin-empolyee">
                <i class="fas fa-users"></i>
                <div class="stat-info">
                    <h3>Employees</h3>
                    <p>Manage staff and designations</p>
                </div>
            </div>
            <div class="stat-card red" routerLink="/admin-stock">
                <i class="fas fa-boxes"></i>
                <div class="stat-info">
                    <h3>Stock</h3>
                    <p>Track inventory levels</p>
                </div>
            </div>
        </div>
    </div>
</main>

<app-admin-footer></app-admin-footer>
  `,
  styles: [`
    .main-container {
        min-height: calc(100vh - 150px);
        background: #f4f6f9;
        padding-bottom: 2rem;
    }

    .breadcrumb-strip {
        background: #fff;
        padding: 10px 20px;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
    }

    .home-icon { color: #0b5ed7; }
    .breadcrumb-text { color: #666; text-decoration: none; }

    .admin-welcome-area {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    .welcome-card {
        background: white;
        padding: 2.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        text-align: center;
        margin-bottom: 2rem;
        border-top: 4px solid #0b5ed7;
    }

    .welcome-card h1 {
        margin: 0;
        color: #333;
        font-size: 28px;
        font-weight: 700;
    }

    .welcome-card p {
        color: #666;
        margin-top: 10px;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
    }

    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.1);
    }

    .stat-card i {
        font-size: 2.5rem;
    }

    .stat-card.blue i { color: #0b5ed7; }
    .stat-card.green i { color: #28a745; }
    .stat-card.red i { color: #dc3545; }

    .stat-info h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
    }

    .stat-info p {
        margin: 5px 0 0;
        font-size: 14px;
        color: #777;
    }
  `]
})
export class AdminHome {}
