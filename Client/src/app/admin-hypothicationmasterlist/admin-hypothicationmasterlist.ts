import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-hypothicationmasterlist',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, AdminFooter, RouterLink],
  template: `
<div class="app-container" (click)="closeAllDropdowns()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Main Card -->
      <div class="theme-card mt-8">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>List Hypothication Master</h2>
          </div>
          <div class="header-actions">
             <button class="btn-add" routerLink="/admin-hypothicationmaster">Add Hypothication Master</button>
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
                  <th style="width: 50px; text-align: center;">SI No</th>
                  <th style="text-align: center;">Finance Company Name</th>
                  <th>Address</th>
                  <th style="text-align: center;">GST IN</th>
                  <th style="width: 100px; text-align: center;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="hypothecations().length === 0">
                  <td colspan="5" class="no-data">No data available</td>
                </tr>
                <tr *ngFor="let item of hypothecations(); let i = index">
                  <td style="text-align: center;">{{ rowIndex(i) }}</td>
                  <td>{{ item.name }}</td>
                  <td class="desc-cell">{{ item.address }}</td>
                  <td style="text-align: center;">{{ item.gstin || '0' }}</td>
                  <td class="action-cell" style="text-align: center;">
                    <div class="action-wrapper" (click)="$event.stopPropagation()">
                      <button class="btn-action" (click)="toggleDropdown(i)">
                        Action <i class="fas fa-caret-down"></i>
                      </button>
                      <div class="action-dropdown" *ngIf="openDropdownIndex === i">
                        <div class="dropdown-item edit" (click)="openEditModal(item)">
                          <i class="fas fa-edit"></i> Edit
                        </div>
                        <div class="dropdown-item delete" (click)="confirmDelete(item)">
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

<!-- ===== Edit Modal ===== -->
<div class="modal-overlay" *ngIf="showEditModal" (click)="closeModalOverlay($event)">
  <div class="modal-box">
    <div class="modal-header">Edit Hypothication Master</div>
    <div class="modal-body edit-form-body">
      <div class="form-narrow-layout">
          <div class="form-group row">
              <label>Finance Company Name :</label>
              <input type="text" class="form-control" name="name" [(ngModel)]="editData.name">
          </div>
          
          <div class="form-group row align-start">
              <label>Address:</label>
              <textarea class="form-control" name="address" [(ngModel)]="editData.address" rows="4"></textarea>
          </div>

          <div class="form-group row">
              <label>GSTIN:</label>
              <input type="text" class="form-control" name="gstin" [(ngModel)]="editData.gstin">
          </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-modal-primary" (click)="saveEdit()" [disabled]="saving">
        {{ saving ? 'Saving...' : 'Update' }}
      </button>
      <button class="btn-modal-cancel" (click)="showEditModal = false">Cancel</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background: #e9ecef; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 20px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    
    .theme-card { background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; max-width: 1000px; margin: 0 auto; }
    .mt-8 { margin-top: 15px; }

    .blue-header-strip { background: #0b5ed7; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .blue-header-strip h2 { margin: 0; font-size: 16px; font-weight: 600; }
    .header-actions { display: flex; gap: 0; }
    .btn-add { background: #c92127; color: white; border: none; padding: 8px 15px; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    
    .page-card-content { padding: 0; background: #fff; }

    .controls-row { display: flex; justify-content: space-between; padding: 15px; align-items: center; }
    .entries-group { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; }
    .entries-select { padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; outline: none; }

    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .report-table th { background: #f1f1f1; color: #333; font-weight: 600; padding: 12px 10px; text-align: left; border: 1px solid #ddd; white-space: nowrap; border-bottom: 2px solid #ccc; }
    .report-table td { padding: 10px; border: 1px solid #ddd; color: #444; vertical-align: middle; }
    .desc-cell { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .report-table tr:nth-child(even) { background: #f9f9f9; }
    .report-table tr:hover { background: #f1f7fd; }
    .no-data { text-align: center; padding: 40px !important; font-style: italic; color: #999; }

    /* Action Dropdown */
    .action-cell { position: relative; }
    .action-wrapper { position: relative; display: inline-block; }
    .btn-action { background: #c92127; color: white; border: none; padding: 6px 15px; font-size: 12px; font-weight: 600; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
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

    /* Modals */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-box { background: #fff; border-radius: 6px; width: 450px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { background: #1a62bf; color: white; padding: 15px 20px; font-size: 16px; font-weight: 600; flex-shrink: 0; }
    .modal-body { padding: 25px 20px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 15px 20px; display: flex; justify-content: flex-end; gap: 12px; background: #f9f9f9; border-top: 1px solid #eee; flex-shrink: 0; }
    .btn-modal-primary { background: #0b5ed7; color: white; border: none; padding: 8px 30px; font-size: 14px; font-weight: 600; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
    .btn-modal-primary:hover { background: #094eb3; }
    .btn-modal-primary:disabled { background: #a0b8e0; cursor: not-allowed; }
    .btn-modal-cancel { background: #fff; color: #555; border: 1px solid #ccc; padding: 8px 30px; font-size: 14px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
    .btn-modal-cancel:hover { background: #f0f0f0; }

    /* Form inside Modal */
    .form-narrow-layout { display: flex; flex-direction: column; gap: 15px; }
    .form-group { display: flex; align-items: center; gap: 15px; }
    .form-group.align-start { align-items: flex-start; }
    .form-group label { min-width: 140px; text-align: left; font-size: 13px; color: #333; font-weight: 500; }
    .form-control { flex: 1; padding: 8px 10px; font-size: 13px; border: 1px solid #ddd; border-radius: 3px; background: #fff !important; transition: border-color 0.2s; width: 100%; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
    textarea.form-control { resize: vertical; }
    .form-control:focus { border-color: #1a62bf; outline: none; box-shadow: 0 0 0 3px rgba(26, 98, 191, 0.1); }
  `]
})
export class AdminHypothicationmasterlist implements OnInit {
  hypothecations = signal<any[]>([]);
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

  // Edit modal
  showEditModal = false;
  saving = false;
  editId: number | null = null;
  editData: any = {};

  constructor(private apiService: ApiService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.apiService.listHypothecations(this.page(), this.limit()).subscribe({
      next: (res: any) => { 
        if (res.success) {
          this.hypothecations.set(res.data || []);
          this.total.set(res.total || 0);
        }
      },
      error: (err: any) => console.error('Error loading hypothecations', err)
    });
  }

  onLimitChange(value: string): void {
    this.limit.set(Number(value));
    this.page.set(1);
    this.loadData();
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.page.update(p => p - 1);
      this.loadData();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update(p => p + 1);
      this.loadData();
    }
  }

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p !== this.page()) {
      this.page.set(p);
      this.loadData();
    }
  }

  rowIndex(i: number): number {
    return (this.page() - 1) * this.limit() + i + 1;
  }

  // ---- Action Dropdown ----
  toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  closeAllDropdowns() {
    this.openDropdownIndex = null;
  }

  closeModalOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showEditModal = false;
    }
  }

  // ---- Edit Modal ----
  openEditModal(item: any) {
    this.openDropdownIndex = null;
    this.editId = item.id;
    this.editData = {
      name: item.name,
      address: item.address,
      gstin: item.gstin
    };
    this.showEditModal = true;
  }

  saveEdit() {
    if (!this.editId || !this.editData.name) return;
    this.saving = true;

    this.http.put<any>(`http://localhost:5000/api/admin/hypothecations/edit/${this.editId}`, this.editData).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          alert('✅ Hypothecation Master updated successfully!');
          this.showEditModal = false;
          this.loadData();
        } else {
          alert('❌ ' + res.message);
        }
      },
      error: (err) => {
        this.saving = false;
        alert('❌ Server error: ' + (err.error?.message || 'Update failed'));
      }
    });
  }

  // ---- Delete ----
  confirmDelete(item: any) {
    this.openDropdownIndex = null;
    const confirm = window.confirm(`Are you sure you want to delete:\n"${item.name}"?`);
    if (!confirm) return;

    this.http.delete<any>(`http://localhost:5000/api/admin/hypothecations/delete/${item.id}`).subscribe({
      next: (res) => {
        if (res.success) {
          alert('✅ Hypothecation Master deleted successfully!');
          this.loadData();
        } else {
          alert('❌ ' + res.message);
        }
      },
      error: (err) => {
        alert('❌ Server error: ' + (err.error?.message || 'Delete failed'));
      }
    });
  }
}

