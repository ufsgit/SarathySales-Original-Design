import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-companymasterlist',
  standalone: true,
  imports: [CommonModule, AdminNav, AdminFooter, RouterLink, FormsModule],
  template: `
<div class="app-container" (click)="closeDropdowns()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <a routerLink="/admin-companymaster" class="breadcrumb-item">Add Company Master</a>
        <span class="separator"> > </span>
        <span class="active">List Company Master</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Company Master List</h2>
          </div>
          <div class="header-actions">
             <button class="btn-add" (click)="goToAdd()">Add Company Master</button>
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
          </div>

          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>SI No</th>
                  <th>Company Id</th>
                  <th>Company Name</th>
                  <th>Company Address</th>
                  <th>Contact Number</th>
                  <th>Dealership Code</th>
                  <th>C.S.T No</th>
                  <th>L.S.T No</th>
                  <th>Email Id</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let comp of companies(); let i = index">
                  <td>{{ rowIndex(i) }}</td>
                  <td>{{ comp.c_reg_no }}</td>
                  <td>{{ comp.c_name }}</td>
                  <td>{{ comp.c_address }}</td>
                  <td>{{ comp.c_contact_no }}</td>
                  <td>{{ comp.c_dealership_code }}</td>
                  <td>{{ comp.cst_no }}</td>
                  <td>{{ comp.lst_no }}</td>
                  <td>{{ comp.c_email }}</td>
                  <td class="action-cell">
                    <div class="action-wrapper" (click)="$event.stopPropagation()">
                      <button class="btn-action" (click)="toggleDropdown(i)">
                        Action <i class="fas fa-caret-down"></i>
                      </button>
                      <div class="action-dropdown" *ngIf="openDropdownIndex === i">
                        <div class="dropdown-item edit" (click)="onEdit(comp)">
                          <i class="fas fa-edit"></i> Edit
                        </div>
                        <div class="dropdown-item delete" (click)="onDelete(comp)">
                          <i class="fas fa-trash"></i> Delete
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="companies().length === 0">
                  <td colspan="10" class="no-data">No records found</td>
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
    .breadcrumb-item { color: #555; text-decoration: none; cursor: pointer; }
    .breadcrumb-bar .active { font-weight: 500; color: #333; }
    .separator { color: #999; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
    
    .blue-header-strip { background: #0b5ed7; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .blue-header-strip h2 { margin: 0; font-size: 16px; font-weight: 600; text-transform: none; }
    
    .btn-add { background-color: #c92127; color: white; border: none; padding: 8px 15px; font-size: 13px; cursor: pointer; font-weight: 600; border-radius: 0; }
    
    .page-card-content { padding: 0; background: #fff; }

    .controls-row { display: flex; justify-content: space-between; padding: 15px; align-items: center; }
    .entries-group { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; }
    .entries-select { padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; outline: none; }
    
    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .report-table th { background: #f1f1f1; color: #333; font-weight: 600; padding: 10px; text-align: left; border: 1px solid #ddd; white-space: nowrap; }
    .report-table td { padding: 8px 10px; border: 1px solid #ddd; color: #444; vertical-align: middle; }
    .report-table tr:nth-child(even) { background: #fafafa; }
    .no-data { text-align: center; padding: 40px !important; font-style: italic; color: #999; }

    /* Action Dropdown */
    .action-cell { position: relative; }
    .action-wrapper { position: relative; display: inline-block; }
    .btn-action { background: #c92127; color: white; border: none; padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    .action-dropdown { position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 4px; min-width: 130px; z-index: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .dropdown-item { padding: 10px 16px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; text-align: left; }
    .dropdown-item:hover { background: #f5f5f5; }
    .dropdown-item.edit { color: #0b5ed7; }
    .dropdown-item.delete { color: #c92127; border-top: 1px solid #f0f0f0; }

    /* Pagination Footer */
    .table-footer { display: flex; justify-content: space-between; align-items: center; padding: 20px 15px; border-top: 1px solid #eee; }
    .showing-text { font-size: 13px; color: #666; }
    .dt-pagination { display: flex; gap: 5px; }
    .dt-page-btn { padding: 6px 12px; border: 1px solid #ddd; background: #fff; color: #333; font-size: 13px; cursor: pointer; border-radius: 4px; transition: all 0.2s; }
    .dt-page-btn:hover:not([disabled]) { background: #f0f0f0; border-color: #ccc; }
    .dt-page-btn.active { background: #0b5ed7; color: #fff; border-color: #0b5ed7; }
    .dt-page-btn.disabled { cursor: not-allowed; opacity: 0.6; }
    .dt-page-btn.ellipsis { cursor: default; background: transparent; border: none; }
  `]
})
export class AdminCompanymasterlist implements OnInit {
  companies = signal<any[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(25);
  openDropdownIndex: number | null = null;

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

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies() {
    this.apiService.listCompanies(this.page(), this.limit()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.companies.set(res.data || []);
          this.total.set(res.total || 0);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onLimitChange(value: string): void {
    this.limit.set(Number(value));
    this.page.set(1);
    this.loadCompanies();
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.page.update(p => p - 1);
      this.loadCompanies();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update(p => p + 1);
      this.loadCompanies();
    }
  }

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p !== this.page()) {
      this.page.set(p);
      this.loadCompanies();
    }
  }

  rowIndex(i: number): number {
    return (this.page() - 1) * this.limit() + i + 1;
  }

  toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  closeDropdowns() {
    this.openDropdownIndex = null;
  }

  onEdit(comp: any) {
    this.router.navigate(['/admin-companymaster'], {
      queryParams: {
        id: comp.c_id,
        code: comp.c_reg_no,
        name: comp.c_name,
        address: comp.c_address,
        phone: comp.c_contact_no,
        dealershipCode: comp.c_dealership_code,
        cstNo: comp.cst_no,
        lstNo: comp.lst_no,
        email: comp.c_email
      }
    });
  }

  onDelete(comp: any) {
    if (confirm(`Are you sure you want to delete company "${comp.c_name}"?`)) {
      this.apiService.deleteCompanyMaster(comp.c_id).subscribe({
        next: (res: any) => {
          if (res.success) {
            alert('Company deleted successfully');
            this.loadCompanies();
          } else {
            alert('Failed to delete: ' + res.message);
          }
        },
        error: (err: any) => {
          console.error(err);
          alert('Error deleting company');
        }
      });
    }
  }

  goToAdd() {
    this.router.navigate(['/admin-companymaster']);
  }
}

