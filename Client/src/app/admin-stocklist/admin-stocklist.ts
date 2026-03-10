import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-stocklist',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, AdminFooter, RouterLink],
  template: `
<div class="app-container" (click)="closeDropdown()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <span class="active">Stock List</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-list menu-icon"></i>
             <h2>Stock List</h2>
          </div>
          <div class="header-actions">
             <button class="btn-add" routerLink="/admin-stock">Add Opening Stock</button>
          </div>
        </header>

        <div class="page-card-content">
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>SI No</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Branch</th>
                  <th>Opening Stock</th>
                  <th>Current Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="stocks().length === 0">
                  <td colspan="7" class="no-data">No stock data found</td>
                </tr>
                <tr *ngFor="let s of stocks(); let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ s.stock_item_code }}</td>
                  <td>{{ s.stock_item_name }}</td>
                  <td>{{ s.branch_name }}</td>
                  <td>{{ s.opening_stock }}</td>
                  <td>{{ s.stock_qty }}</td>
                  <td class="action-cell">
                    <div class="action-wrapper" (click)="$event.stopPropagation()">
                       <button class="btn-action" (click)="toggleDropdown(i)">
                         Action <i class="fas fa-caret-down"></i>
                       </button>
                       <div class="action-dropdown" *ngIf="openDropdownIndex === i">
                          <div class="dropdown-item" (click)="onEdit(s)">
                            <i class="fas fa-edit"></i> Edit
                          </div>
                          <div class="dropdown-item delete" (click)="onDelete(s)">
                            <i class="fas fa-trash"></i> Delete
                          </div>
                       </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <div style="height: 50px;"></div>
  <app-admin-footer></app-admin-footer>
</div>
  `,
  styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 5px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    
    .breadcrumb-bar { font-size: 13px; color: #555; padding: 15px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-item { color: #555; text-decoration: none; display: flex; align-items: center; gap: 5px; }
    .breadcrumb-bar .active { color: #333; font-weight: 500; }
    .separator { color: #999; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; margin-top: 10px; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .menu-icon { font-size: 14px; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .header-actions { display: flex; gap: 5px; }
    .btn-add { background-color: #c92127; color: white; border: none; padding: 6px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 0; background: #fff; }
    
    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .report-table th { background: #f1f1f1; padding: 10px; text-align: left; border: 1px solid #ddd; color: #333; font-weight: 600; }
    .report-table td { padding: 10px; border: 1px solid #ddd; color: #555; vertical-align: middle; }
    .report-table tr:nth-child(even) { background: #fafafa; }
    .no-data { text-align: center; padding: 30px !important; color: #888; font-style: italic; }

    /* Action Button Styles */
    .action-cell { width: 100px; text-align: center; }
    .action-wrapper { position: relative; display: inline-block; }
    .btn-action { background-color: #c92127; color: white; border: none; padding: 4px 12px; font-size: 11px; font-weight: 500; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
    .action-dropdown { position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 3px; min-width: 120px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .dropdown-item { padding: 8px 12px; text-align: left; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 8px; color: #333; }
    .dropdown-item:hover { background-color: #f5f5f5; }
    .dropdown-item i { width: 14px; text-align: center; }
    .dropdown-item.delete { color: #d9534f; border-top: 1px solid #eee; }

    @media (max-width: 768px) {
       .report-table { min-width: 800px; }
    }
  `]
})
export class AdminStocklist implements OnInit {
  stocks = signal<any[]>([]);
  openDropdownIndex: number | null = null;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadStocks();
  }

  loadStocks() {
    this.apiService.listStocks().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.stocks.set(res.data || []);
        }
      },
      error: (err: any) => console.error('Error loading stocks', err)
    });
  }

  toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  closeDropdown() {
    this.openDropdownIndex = null;
  }

  onEdit(item: any) {
    this.router.navigate(['/admin-stock'], {
      queryParams: {
        id: item.stock_id,
        productId: item.stock_item_id,
        branchId: item.stock_item_branch,
        qty: item.stock_qty,
        code: item.stock_item_code,
        name: item.stock_item_name,
        branchName: item.branch_name
      }
    });
  }

  onDelete(item: any) {
    if (confirm('Are you sure you want to delete this stock entry?')) {
      this.apiService.deleteStock(item.stock_id).subscribe({
        next: (res: any) => {
          if (res.success) {
            alert('Stock entry deleted successfully!');
            this.loadStocks();
          } else {
            alert('Failed to delete: ' + res.message);
          }
        },
        error: (err) => alert('Error deleting stock entry')
      });
    }
  }
}
