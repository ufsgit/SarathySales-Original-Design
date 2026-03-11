import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-vsi-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNav, UserFooter],
  template: `
<div class="app-container">
  <app-user-nav></app-user-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a (click)="navigate('/user-home')"><i class="fas fa-home"></i> Home</a>
        <span> > </span>
        <span>VSI</span>
        <span> > </span>
        <span class="active">List Previous Bill</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>VSI BILL LIST</h2>
          </div>
        </header>

        <div class="page-card-content">
           <div class="list-controls">
               <div class="search-box">
                 <input type="text" class="form-control" placeholder="Search bills...">
               </div>
               <div class="entries-select">
                 <span>Show</span>
                 <select class="form-control" style="width: auto; padding: 4px; height: 30px;">
                   <option>10</option>
                   <option>25</option>
                   <option>50</option>
                 </select>
                 <span>entries</span>
               </div>
           </div>

           <div class="table-responsive">
              <table class="item-table">
                <thead>
                  <tr>
                    <th>SI:No</th>
                    <th>Customer Details</th>
                    <th>Branch</th>
                    <th>Sales Inv No</th>
                    <th>Invoice No</th>
                    <th>Invoice Date</th>
                    <th>Customer GSTIN</th>
                    <th class="text-right">Total Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Row 1 -->
                  <tr>
                    <td>1</td>
                    <td>
                      <div class="cust-info">
                        <strong>Arun Kumar</strong>
                        <div class="text-muted small">+91 98471 23456</div>
                      </div>
                    </td>
                    <td>Kollam KTM</td>
                    <td>SINV-2025-001</td>
                    <td>VSI-2026-042</td>
                    <td>14-02-2026</td>
                    <td>32ABCDE1234F1Z5</td>
                    <td class="text-right font-weight-bold">₹ 14,500.00</td>
                    <td>
                      <button class="btn-icon edit" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                      <button class="btn-icon print" title="Print"><i class="fas fa-print"></i> Print</button>
                    </td>
                  </tr>
                   <!-- Row 2 -->
                  <tr>
                    <td>2</td>
                    <td>
                      <div class="cust-info">
                        <strong>Priya Nair</strong>
                        <div class="text-muted small">+91 98460 98765</div>
                      </div>
                    </td>
                    <td>Trivandrum KTM</td>
                    <td>SINV-2025-089</td>
                    <td>VSI-2026-041</td>
                    <td>13-02-2026</td>
                    <td>--</td>
                    <td class="text-right font-weight-bold">₹ 2,450.00</td>
                    <td>
                      <button class="btn-icon edit" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                      <button class="btn-icon print" title="Print"><i class="fas fa-print"></i> Print</button>
                    </td>
                  </tr>
                </tbody>
              </table>
           </div>

           <div class="pagination-footer">
              <span>Showing 1 to 2 of 2 entries</span>
              <div class="pagination-buttons">
                <button disabled>Previous</button>
                <button class="active">1</button>
                <button disabled>Next</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  </main>
  
  <div style="height: 50px;"></div>
  
  <app-user-footer></app-user-footer>
</div>
  `,
  styles: [`
    .app-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f4f4;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .page-container {
        padding: 2px 0 0 0;
    }

    .page-content-wrapper {
        width: 100%;
        padding: 0 15px;
    }

    /* Breadcrumb */
    .breadcrumb-bar {
        font-size: 12px;
        color: #555;
        padding: 10px 0;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .breadcrumb-bar a { color: #555; text-decoration: none; cursor: pointer; }
    .breadcrumb-bar .active { font-weight: bold; color: #333; }

    /* Card & Header */
    .theme-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        overflow: hidden;
    }

    .orange-header-strip {
        background: #f36f21; /* KTM Orange */
        padding: 10px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .menu-icon {
        background: #d85c15;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }

    .orange-header-strip h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        text-transform: capitalize;
    }

    .header-actions {
        display: flex;
        gap: 5px;
    }

    .receipt-badge {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        line-height: 1.1;
    }
    .receipt-badge .label { font-size: 9px; font-weight: bold; }
    .receipt-badge .val { font-size: 14px; font-weight: bold; }

    /* Content Area */
    .page-card-content {
        padding: 20px;
        background: #fff;
        min-height: 600px;
    }

    /* Controls */
    .list-controls {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        align-items: center;
        font-size: 12px;
    }
    .search-box { width: 300px; }
    
    .entries-select {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #555;
        font-weight: 500;
    }

    .form-control {
        width: 100%;
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 3px;
        height: 28px;
    }
    .form-control:focus {
        border-color: #f36f21;
        outline: none;
    }

    /* Table Styles (Matching Invoice Table Style) */
    .table-responsive {
        width: 100%;
        overflow-x: auto;
        margin-bottom: 20px;
    }
    .item-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }
    .item-table th {
        text-align: left;
        color: #555;
        font-weight: 600;
        padding: 8px 10px;
        background-color: #f9fafb;
        border-bottom: 2px solid #eee;
    }
    .item-table td {
        padding: 10px;
        border-bottom: 1px solid #eee;
        color: #333;
    }
    .item-table tr:hover { background-color: #fcfcfc; }
    
    .text-right { text-align: right; }
    .font-weight-bold { font-weight: 700; }
    .text-muted { color: #888; }
    .small { font-size: 11px; }

    /* Action Buttons */
    .btn-icon {
        border: none;
        background: none;
        cursor: pointer;
        padding: 5px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-right: 5px;
    }
    .btn-icon.edit { background-color: #e0f2fe; color: #0284c7; }
    .btn-icon.print { background-color: #dcfce7; color: #16a34a; }

    /* Pagination */
    .pagination-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 15px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
    }
    .pagination-buttons { display: flex; gap: 5px; }
    .pagination-buttons button {
        border: 1px solid #ddd;
        background: white;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
    }
    .pagination-buttons button.active {
        background-color: #f36f21;
        color: white;
        border-color: #f36f21;
    }
    .pagination-buttons button:disabled { opacity: 0.6; cursor: not-allowed; }

    @media (max-width: 768px) {
        .list-controls { flex-direction: column; gap: 10px; align-items: flex-start; }
        .search-box { width: 100%; }
    }
  `]
})
export class VsiListComponent implements OnInit {
  isAdmin = signal(false);
  constructor(private router: Router, private api: ApiService) { }

  ngOnInit(): void {
    const user = this.api.getCurrentUser();
    this.isAdmin.set(user?.role == 1 || user?.role_des === 'admin');
  }

  navigate(path: string) { this.router.navigate([path]); }
}
