import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
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
          <!-- Page Controls -->
          <div class="controls-row">
            <div class="entries-group">
              <label>Show</label>
              <select class="entries-select" [value]="limit()" (change)="onLimitChange($any($event.target).value)">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <label>entries</label>
            </div>
            <div class="filters-group">
              <div class="custom-select-container" (click)="$event.stopPropagation()">
                <div class="custom-select-trigger" (click)="toggleBranchDropdown()">
                  <span>{{ getSelectedBranchName() }}</span>
                  <i class="fas fa-caret-down dropdown-arrow"></i>
                </div>
                <div class="custom-select-dropdown" *ngIf="isBranchDropdownOpen()">
                  <div class="dropdown-search-box">
                    <input type="text"
                           [value]="branchSearchTerm()"
                           (input)="onBranchSearchInput($any($event.target).value)"
                           placeholder="SEARCH..."
                           (click)="$event.stopPropagation()">
                  </div>
                  <ul class="dropdown-options-list">
                    <li (click)="onBranchSelect('')">All Branches</li>
                    <li *ngFor="let b of filteredBranches()" (click)="onBranchSelect(b.b_id)">
                      {{b.branch_name}}
                    </li>
                  </ul>
                </div>
              </div>
              <label class="checkbox-label">
                <input type="checkbox" [ngModel]="hasStock()" (ngModelChange)="onHasStockChange($event)">
                Current Stock Only
              </label>
              <div class="search-group">
                <input type="text" class="search-input" placeholder="Search Item Code or Name..." [ngModel]="searchTerm()" (ngModelChange)="onSearchChange($event)">
              </div>
            </div>
          </div>

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
                  <td>{{ rowIndex(i) }}</td>
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

          <!-- Pagination Footer -->
          <div class="table-footer" *ngIf="total() > 0">
            <div class="showing-text">Showing {{ fromEntry() }} to {{ toEntry() }} of {{ total() }} entries</div>
            <div class="dt-pagination">
              <button class="dt-page-btn" [disabled]="!hasPrev()" (click)="prevPage()" [class.disabled]="!hasPrev()">Previous</button>

              <ng-container *ngFor="let p of visiblePages()">
                <button class="dt-page-btn" [class.active]="p === page()" [class.ellipsis]="p === '...'"
                  [disabled]="p === '...'" (click)="goToPage(p)">
                  {{ p }}
                </button>
              </ng-container>

              <button class="dt-page-btn" [disabled]="!hasNext()" (click)="nextPage()" [class.disabled]="!hasNext()">Next</button>
            </div>
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

    .controls-row { display: flex; justify-content: space-between; padding: 15px; align-items: center; flex-wrap: wrap; gap: 15px; }
    .entries-group { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; }
    .entries-select { padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; outline: none; }
    
    .filters-group { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
    
    /* Custom Select Dropdown Styles */
    .custom-select-container { position: relative; width: 240px; font-family: sans-serif; }
    .custom-select-trigger { 
      padding: 6px 10px; border: 1px solid #ccc; border-radius: 3px; background: #fff;
      display: flex; justify-content: space-between; align-items: center; cursor: pointer;
      font-size: 13px; color: #333; min-height: 30px; box-sizing: border-box;
    }
    .custom-select-trigger .dropdown-arrow { font-size: 14px; color: #777; }
    
    .custom-select-dropdown { 
      position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #ccc;
      border-top: none; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
    }
    .dropdown-search-box { padding: 6px; }
    .dropdown-search-box input { 
      width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 2px; font-size: 12px; outline: none;
      box-sizing: border-box; color: #555;
    }
    .dropdown-search-box input::placeholder { color: #aaa; }
    
    .dropdown-options-list { margin: 0; padding: 0; list-style: none; max-height: 250px; overflow-y: auto; }
    .dropdown-options-list li { padding: 8px 10px; font-size: 13px; cursor: pointer; color: #444; }
    .dropdown-options-list li:hover { background-color: #f5f5f5; }

    .checkbox-label { font-size: 13px; color: #333; display: flex; align-items: center; gap: 6px; cursor: pointer; }
    .search-group { display: flex; align-items: center; }
    .search-input { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; outline: none; font-size: 13px; width: 220px; }

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

    /* Pagination Footer */
    .table-footer { display: flex; justify-content: space-between; align-items: center; padding: 20px 15px; border-top: 1px solid #eee; }
    .showing-text { font-size: 13px; color: #666; }
    .dt-pagination { display: flex; gap: 5px; }
    .dt-page-btn { padding: 6px 12px; border: 1px solid #ddd; background: #fff; color: #333; font-size: 13px; cursor: pointer; border-radius: 4px; transition: all 0.2s; }
    .dt-page-btn:hover:not([disabled]) { background: #f0f0f0; border-color: #ccc; }
    .dt-page-btn.active { background: #0b5ed7; color: #fff; border-color: #0b5ed7; }
    .dt-page-btn.disabled { cursor: not-allowed; opacity: 0.6; }
    .dt-page-btn.ellipsis { cursor: default; background: transparent; border: none; }

    @media (max-width: 768px) {
       .report-table { min-width: 800px; }
    }
  `]
})
export class AdminStocklist implements OnInit {
  stocks = signal<any[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(25);
  searchTerm = signal('');
  selectedBranchId = signal('');
  hasStock = signal(false);
  branches = signal<any[]>([]);
  branchSearchTerm = signal('');
  isBranchDropdownOpen = signal(false);
  openDropdownIndex: number | null = null;

  filteredBranches = computed(() => {
    const term = this.branchSearchTerm().toLowerCase();
    return this.branches().filter(b => b.branch_name?.toLowerCase().includes(term));
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  fromEntry = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1);
  toEntry = computed(() => Math.min(this.page() * this.limit(), this.total()));
  hasPrev = computed(() => this.page() > 1);
  hasNext = computed(() => this.page() < this.totalPages());

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');
      const start = Math.max(2, current - 2);
      const end = Math.min(total - 1, current + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 3) pages.push('...');
      if (total > 1) pages.push(total);
    }
    return pages;
  });

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.loadBranches();
    this.loadStocks();
  }

  loadBranches() {
    this.apiService.listBranches().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.branches.set(res.data || []);
        }
      },
      error: (err: any) => console.error('Error loading branches', err)
    });
  }

  loadStocks() {
    const branchId = this.selectedBranchId() || undefined;
    this.apiService.listStocks(branchId, this.page(), this.limit(), this.searchTerm(), this.hasStock()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.stocks.set(res.data || []);
          this.total.set(res.total || 0);
        }
      },
      error: (err: any) => console.error('Error loading stocks', err)
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    this.page.set(1);
    this.loadStocks();
  }

  toggleBranchDropdown() {
    this.isBranchDropdownOpen.set(!this.isBranchDropdownOpen());
    if (this.isBranchDropdownOpen()) {
      this.branchSearchTerm.set('');
    }
  }

  onBranchSearchInput(value: string) {
    this.branchSearchTerm.set(value);
  }

  @HostListener('document:click')
  closeBranchDropdown() {
    this.isBranchDropdownOpen.set(false);
  }

  onBranchSelect(value: string) {
    this.selectedBranchId.set(value);
    this.isBranchDropdownOpen.set(false);
    this.page.set(1);
    this.loadStocks();
  }

  getSelectedBranchName(): string {
    const id = this.selectedBranchId();
    if (!id) return 'All Branches';
    const branch = this.branches().find(b => b.b_id?.toString() === id.toString());
    return branch ? branch.branch_name : 'All Branches';
  }

  onHasStockChange(value: boolean) {
    this.hasStock.set(value);
    this.page.set(1);
    this.loadStocks();
  }

  onLimitChange(value: string): void {
    this.limit.set(Number(value));
    this.page.set(1);
    this.loadStocks();
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.page.update(p => p - 1);
      this.loadStocks();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update(p => p + 1);
      this.loadStocks();
    }
  }

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p !== this.page()) {
      this.page.set(p);
      this.loadStocks();
    }
  }

  rowIndex(i: number): number {
    return (this.page() - 1) * this.limit() + i + 1;
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

