import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-admin-nav',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    template: `
<header class="admin-header">
    <div class="top-bar">
        <div class="brand-logo" routerLink="/admin-home" style="cursor: pointer;">
            <img src="sarathy-logo.png" alt="Sarathy Logo" style="height: 55px; width: auto;">
        </div>
        
        <div class="top-nav-links">
            <span class="nav-info"><i class="fas fa-user"></i> Welcome - Admin Panel</span>
            <span class="nav-info">0474 2728965 / www.sarathygroup.com</span>
            <a routerLink="/myprofile-changepassword" class="nav-action"><i class="fas fa-lock"></i> Change Password</a>
            <a href="#" class="nav-action" (click)="logout($event)"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    </div>
    
    <nav class="main-blue-nav">
        <div class="nav-container">
            <div class="nav-item">
                <a routerLink="/admin-home" routerLinkActive="active">Home</a>
            </div>
            
            <div class="nav-item dropdown">
                <a href="javascript:void(0)">Master Operations</a>
                <div class="dropdown-content">
                    <a routerLink="/admin-companymaster">Company Master</a>
                    <a routerLink="/admin-institutionmaster">Institution Master</a>
                    <a routerLink="/admin-empolyee">Employee</a>
                    <a routerLink="/admin-productmaster">Product Master</a>
                    <a routerLink="/admin-productmasterlist">Product Price Upload</a>
                    <a routerLink="/admin-hypothicationmaster">Hypothecation Master</a>
                    <a routerLink="/admin-color">Color Types</a>
                    <a routerLink="/admin-stock">Stock</a>
                </div>
            </div>

            <div class="nav-item dropdown">
                <a href="javascript:void(0)">Transactions</a>
                <div class="dropdown-content">
                    <a routerLink="/money-receipt">Money Receipt</a>
                    <a routerLink="/pay-slip">Pay slip</a>
                    <a routerLink="/gate-pass">Gate Pass</a>
                    <a routerLink="/proforma-invoice">Proforma Invoice</a>
                    <a routerLink="/purchase-invoice">Purchase Invoice</a>
                    <a routerLink="/purchase-upload">Purchase Invoice Upload</a>
                    <a routerLink="/sales-invoice">Sales Invoice</a>
                    <a routerLink="/branch-transfer">Branch Transfer</a>
                </div>
            </div>

            <div class="nav-item dropdown">
                <a href="javascript:void(0)">Previous Transaction</a>
                <div class="dropdown-content">
                    <a routerLink="/previous-money-receipt">Money Receipt</a>
                    <a routerLink="/previous-pay-slip">Pay slip</a>
                    <a routerLink="/previous-gate-pass">Gate Pass</a>
                    <a routerLink="/previous-proforma-invoice">Proforma Invoice</a>
                    <a routerLink="/previous-purchase-invoice">Purchase Invoice</a>
                    <a routerLink="/previous-sales-invoice">Sales Invoice</a>
                    <a routerLink="/admin-sales-returns">Sales Returns</a>
                    <a routerLink="/previous-branch-transfer">Branch Transfer</a>
                </div>
            </div>

            <div class="nav-item">
                <a routerLink="/admin-findvehicle" routerLinkActive="active">Find Vehicle</a>
            </div>

            <div class="nav-item dropdown">
                <a href="javascript:void(0)">Reports</a>
                <div class="dropdown-content">
                    <a routerLink="/reports-proforma-invoice">Proforma Invoice</a>
                    <a routerLink="/reports-stock-verification">Stock Verification</a>
                    <a routerLink="/report-stock-splitup">Stock Splitup</a>
                    <a routerLink="/report-purchase-report">Purchase Report</a>
                    <a routerLink="/report-sales-report">Sales Report</a>
                    <a routerLink="/reports-payslip">Payslip Report</a>
                    <a routerLink="/reports-money-receipt">Money Receipt Report</a>
                    <a routerLink="/report-branch-transfer">Branch Transfer Report</a>
                </div>
            </div>

            <div class="nav-item dropdown">
                <a href="javascript:void(0)">VSI Bill</a>
                <div class="dropdown-content">
                    <a routerLink="/vsi-invoice">VSI Bill</a>
                    <a routerLink="/vsi-list">List Previous Bill</a>
                    <a routerLink="/vsi-report">VSI Report</a>
                </div>
            </div>
        </div>
    </nav>
</header>
  `,
    styles: [`
    .admin-header {
        width: 100%;
        background: #fff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        position: sticky;
        top: 0;
        z-index: 1000;
    }

    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 20px;
        background: #fff;
    }

    .brand-logo {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .brand-text {
        display: flex;
        flex-direction: column;
    }

    .main-title {
        font-size: 18px;
        font-weight: 800;
        color: #ed1c24;
        letter-spacing: 1px;
        line-height: 1;
    }

    .tagline {
        font-size: 10px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .top-nav-links {
        display: flex;
        align-items: center;
        gap: 20px;
        font-size: 13px;
    }

    .nav-info {
        color: #666;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .nav-action {
        color: #ed1c24;
        text-decoration: none;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: color 0.2s;
    }

    .nav-action:hover {
        color: #b3141a;
    }

    .main-blue-nav {
        background: #0b5ed7;
        padding: 0;
    }

    .nav-container {
        display: flex;
        max-width: 1400px;
        margin: 0 auto;
    }

    .nav-item {
        position: relative;
    }

    .nav-item > a {
        display: block;
        padding: 12px 20px;
        color: white;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
    }

    .nav-item > a:hover, .nav-item > a.active {
        background: rgba(255, 255, 255, 0.1);
    }

    /* Dropdown Logic */
    .dropdown-content {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        min-width: 220px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        z-index: 1;
        border-radius: 0 0 4px 4px;
    }

    .dropdown:hover .dropdown-content {
        display: block;
    }

    .dropdown-content a {
        color: #333;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        font-size: 13px;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.2s, padding-left 0.2s;
    }

    .dropdown-content a:last-child {
        border-bottom: none;
    }

    .dropdown-content a:hover {
        background-color: #f8f9fa;
        color: #0b5ed7;
        padding-left: 20px;
    }

    @media (max-width: 992px) {
        .top-bar { flex-direction: column; gap: 10px; padding: 10px; }
        .nav-container { flex-wrap: wrap; }
        .nav-item > a { padding: 10px; font-size: 12px; }
    }
  `]
})
export class AdminNav {
    private api = inject(ApiService);
    private router = inject(Router);

    logout(event: Event) {
        event.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            this.api.logout();
            this.router.navigate(['/']);
        }
    }
}
