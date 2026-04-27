import { Component, OnInit, signal, computed } from '@angular/core';

import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNav } from '../admin-nav/admin-nav';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-admin-taxmaster',
    standalone: true,
    imports: [CommonModule, FormsModule, AdminNav, RouterLink],
    template: `
<div class="app-container">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">

      <div class="breadcrumb-bar">
        <a routerLink="/admin-home"><i class="fas fa-home"></i> Home</a>
        <span> > </span>
        <span>Master Operations</span>
        <span> > </span>
        <span class="active">Tax Master</span>
      </div>

      <div class="theme-card">
        <header class="blue-header-strip">
          <div class="header-left">
            <i class="fas fa-percent"></i>
            <h2>Tax Master (GST Slabs)</h2>
          </div>
        </header>

        <div class="page-card-content">

          <!-- Add New Slab Form -->
          <div class="add-section">
            <h3 class="section-title">Add New Tax Slab</h3>
            <div class="add-form">
              <div class="field-group">
                <label>CGST (%)</label>
                <input type="number" class="form-input" placeholder="e.g. 9" [ngModel]="cgstNew()" (ngModelChange)="cgstNew.set($event)" min="0" step="0.01">
              </div>
              <div class="field-group">
                <label>SGST (%)</label>
                <input type="number" class="form-input" placeholder="e.g. 9" [ngModel]="sgstNew()" (ngModelChange)="sgstNew.set($event)" min="0" step="0.01">
              </div>
              <div class="field-group">
                <label>CESS (%)</label>
                <input type="number" class="form-input" placeholder="e.g. 0" [ngModel]="cessNew()" (ngModelChange)="cessNew.set($event)" min="0" step="0.01">
              </div>
              <div class="field-group">
                <label>GST (auto)</label>
                <input type="number" class="form-input readonly" [value]="computedGST()" readonly>
              </div>
              <div class="field-group">
                <label>IGST (auto)</label>
                <input type="number" class="form-input readonly" [value]="computedGST()" readonly>
              </div>
              <button class="btn-add" (click)="addSlab()" [disabled]="saving()">
                <i class="fas fa-plus"></i> {{ saving() ? 'Adding...' : 'Add Slab' }}
              </button>
            </div>
          </div>

          <!-- Show Entries and Search -->
          <div class="table-tools">
            <div class="entries-control">
              <span>Show</span>
              <select class="form-input size-select" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
                <option *ngFor="let opt of pageSizeOptions" [value]="opt">{{ opt }}</option>
              </select>
              <span>entries</span>
            </div>
            <div class="search-control">
              <i class="fas fa-search"></i>
              <input type="text" class="form-input search-input" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search Tax/GST...">
            </div>
          </div>

          <!-- Table -->
          <div class="table-container">
            <table class="tax-table">
              <thead>
                <tr>
                  <th>SI</th>
                  <th>GST (%)</th>
                  <th>CGST (%)</th>
                  <th>SGST (%)</th>
                  <th>IGST (%)</th>
                  <th>CESS (%)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="slabs().length === 0">
                  <td colspan="7" class="no-data">No tax slabs found.</td>
                </tr>
                <ng-container *ngFor="let slab of slabs(); let i = index">
                  <!-- View row -->
                  <tr *ngIf="editingId() !== slab.id_tax_slab">
                    <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                    <td><span class="badge">{{ slab.GST | number:'1.2-2' }}%</span></td>
                    <td>{{ slab.CGST | number:'1.2-2' }}%</td>
                    <td>{{ slab.SGST | number:'1.2-2' }}%</td>
                    <td>{{ slab.IGST | number:'1.2-2' }}%</td>
                    <td>{{ slab.CESS | number:'1.2-2' }}%</td>
                    <td class="action-cell">
                      <button class="btn-edit" (click)="startEdit(slab)"><i class="fas fa-edit"></i> Edit</button>
                      <button class="btn-delete" (click)="deleteSlab(slab)"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                  </tr>
                  <!-- Inline Edit row -->
                  <tr *ngIf="editingId() === slab.id_tax_slab" class="edit-row">
                    <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                    <td><span class="badge">{{ editComputedGST() | number:'1.2-2' }}%</span></td>
                    <td><input type="number" class="inline-input" [ngModel]="editCGST()" (ngModelChange)="editCGST.set($event)" min="0" step="0.01"></td>
                    <td><input type="number" class="inline-input" [ngModel]="editSGST()" (ngModelChange)="editSGST.set($event)" min="0" step="0.01"></td>
                    <td><input type="number" class="inline-input readonly" [value]="editComputedGST()" readonly></td>
                    <td><input type="number" class="inline-input" [ngModel]="editCESS()" (ngModelChange)="editCESS.set($event)" min="0" step="0.01"></td>
                    <td class="action-cell">
                      <button class="btn-save" (click)="saveEdit()" [disabled]="saving()">{{ saving() ? '...' : 'Save' }}</button>
                      <button class="btn-cancel" (click)="cancelEdit()">Cancel</button>
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-footer" *ngIf="totalItems > 0">
            <div class="pagination-info">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} entries
            </div>
            <div class="pagination-pages">
              <button class="page-btn nav-btn" [disabled]="currentPage === 1" (click)="onPageChange(currentPage - 1)">Previous</button>
              <ng-container *ngFor="let p of pagesArray">
                <button class="page-btn" [class.active]="p === currentPage" (click)="onPageChange(p)">{{ p }}</button>
              </ng-container>
              <button class="page-btn nav-btn" [disabled]="currentPage === totalPages" (click)="onPageChange(currentPage + 1)">Next</button>
            </div>
          </div>

        </div>
      </div>
      
          <!-- Dependency Warning Modal -->
          <div class="modal-overlay" *ngIf="showDependencyModal()">
            <div class="modal-content warning-modal">
              <header class="modal-header warning">
                <h3>⚠️ Tax Slab In Use</h3>
                <button class="close-btn" (click)="closeDependencyModal()"><i class="fas fa-times"></i></button>
              </header>
              <div class="modal-body">
                <p class="warning-text" *ngIf="pendingAction() === 'edit'">Editing this tax slab will affect existing labour codes and vehicles.</p>
                <div class="summary-stats">
                  <div class="stat-box">
                    <i class="fas fa-tools"></i> 
                    <span>{{ affectedLabourCodes().length }} Labour Codes affected</span>
                  </div>
                  <div class="stat-box">
                    <i class="fas fa-car"></i> 
                    <span>{{ affectedVehicles().length }} Available Vehicles affected</span>
                  </div>
                </div>

                <div class="dependency-lists">
                  <div class="list-section" *ngIf="affectedLabourCodes().length > 0">
                    <h4>Labour Codes</h4>
                    <div class="table-wrap">
                      <table class="dep-table">
                        <thead><tr><th>Sl No.</th><th>Labour Code</th><th>Labour Title</th></tr></thead>
                        <tbody>
                          <tr *ngFor="let l of affectedLabourCodes(); let i = index"><td>{{ i + 1 }}</td><td>{{ l.labour_code }}</td><td>{{ l.labour_title }}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="list-section" *ngIf="affectedVehicles().length > 0">
                    <h4>Vehicles</h4>
                    <div class="table-wrap">
                      <table class="dep-table">
                        <thead><tr><th>Sl No.</th><th>Chassis No</th><th>Labour Code</th></tr></thead>
                        <tbody>
                          <tr *ngFor="let v of affectedVehicles(); let i = index"><td>{{ i + 1 }}</td><td>{{ v.chassis_no }}</td><td>{{ v.labour_code }}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <footer class="modal-footer">
                <button class="btn-cancel" style="padding: 8px 16px; font-size: 13px;" (click)="closeDependencyModal()">Cancel ❌</button>
                <button class="btn-danger" (click)="confirmForceAction()">
                  {{ pendingAction() === 'edit' ? 'Continue Edit' : 'Delete Anyway ⚠️' }}
                </button>
              </footer>
            </div>
          </div>

    </div>
  </main>
  <div style="height:50px"></div>
</div>
    `,
    styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 2px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    .breadcrumb-bar { font-size: 13px; color: #555; padding: 10px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-bar a { color: #555; text-decoration: none; cursor: pointer; }
    .breadcrumb-bar .active { font-weight: 500; color: #333; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: visible; }
    .blue-header-strip { background: #1a62bf; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; color: white; border-radius: 4px 4px 0 0; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; }
    .blue-header-strip i { font-size: 16px; }

    .page-card-content { padding: 20px; }

    /* Add Form */
    .add-section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 600; color: #444; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .add-form { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; background: #f8f9fc; border: 1px solid #e0e6f0; border-radius: 4px; padding: 14px 16px; }
    .field-group { display: flex; flex-direction: column; gap: 4px; }
    .field-group label { font-size: 11px; color: #666; font-weight: 500; }
    .form-input { padding: 6px 10px; font-size: 13px; border: 1px solid #ccc; border-radius: 3px; outline: none; width: 110px; }
    .form-input:focus { border-color: #1a62bf; }
    .form-input.readonly { background: #f4f4f4; color: #777; }
    .btn-add { background: #1a62bf; color: white; border: none; padding: 7px 18px; font-size: 13px; font-weight: 600; border-radius: 3px; cursor: pointer; height: 34px; align-self: flex-end; display: flex; align-items: center; gap: 6px; }
    .btn-add:disabled { background: #8aaee0; cursor: not-allowed; }
    .btn-add:hover:not(:disabled) { background: #1450a3; }

    /* Table Tools */
    .table-tools { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; background: #fff; padding: 5px 0; }
    .entries-control { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; }
    .size-select { width: 70px !important; padding: 4px 6px !important; }
    .search-control { position: relative; display: flex; align-items: center; }
    .search-control i { position: absolute; left: 10px; color: #888; font-size: 13px; }
    .search-input { padding-left: 32px !important; width: 220px !important; }

    /* Table */
    .table-container { overflow-x: auto; }
    .tax-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tax-table th { background: #f1f5fb; color: #333; font-weight: 600; padding: 10px 14px; text-align: center; border: 1px solid #dde3ef; }
    .tax-table td { padding: 9px 14px; border: 1px solid #eee; color: #444; text-align: center; vertical-align: middle; }
    .tax-table tr:nth-child(even):not(.edit-row) { background: #fafbff; }
    .tax-table tr:hover:not(.edit-row) { background: #eef3fc; }
    .edit-row { background: #fffde7 !important; }
    .no-data { text-align: center; padding: 40px !important; font-style: italic; color: #999; }

    .badge { display: inline-block; background: #1a62bf; color: white; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px; }

    /* Action buttons */
    .action-cell { display: flex; gap: 6px; justify-content: center; border: none !important; }
    .btn-edit { background: #0b5ed7; color: white; border: none; padding: 5px 12px; font-size: 12px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
    .btn-edit:hover { background: #0943a6; }
    .btn-delete { background: #c92127; color: white; border: none; padding: 5px 12px; font-size: 12px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
    .btn-delete:hover { background: #a31a1f; }
    .btn-save { background: #28a745; color: white; border: none; padding: 5px 14px; font-size: 12px; border-radius: 3px; cursor: pointer; font-weight: 600; }
    .btn-save:hover:not(:disabled) { background: #1e7e34; }
    .btn-cancel { background: #6c757d; color: white; border: none; padding: 5px 12px; font-size: 12px; border-radius: 3px; cursor: pointer; }
    .btn-cancel:hover { background: #545b62; }

    .inline-input { width: 80px; padding: 4px 7px; font-size: 12px; border: 1px solid #bbb; border-radius: 2px; text-align: center; outline: none; }
    .inline-input:focus { border-color: #1a62bf; }
    .inline-input.readonly { background: #f0f4f8; color: #666; }

    /* Pagination */
    .pagination-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
    .pagination-info { font-size: 13px; color: #666; }
    .pagination-pages { display: flex; gap: 5px; }
    .page-btn { background: #fff; border: 1px solid #ddd; color: #333; padding: 5px 10px; min-width: 32px; height: 32px; border-radius: 3px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .page-btn.nav-btn { min-width: 80px; }
    .page-btn:hover:not(:disabled) { background: #f0f4f8; border-color: #1a62bf; color: #1a62bf; }
    .page-btn.active { background: #1a62bf; border-color: #1a62bf; color: #fff; font-weight: 600; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 20px; }
    .modal-content { background: #fff; border-radius: 6px; width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .modal-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
    .modal-header.warning { background: #fff3cd; color: #856404; border-bottom-color: #ffeeba; border-radius: 6px 6px 0 0; }
    .modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .close-btn { background: none; border: none; font-size: 18px; color: inherit; cursor: pointer; opacity: 0.7; }
    .close-btn:hover { opacity: 1; }
    .modal-body { padding: 20px; overflow-y: auto; }
    .warning-text { margin: 0 0 15px; color: #856404; font-weight: 500; font-size: 14px; }
    .summary-stats { display: flex; gap: 15px; margin-bottom: 20px; }
    .stat-box { flex: 1; background: #f8f9fc; border: 1px solid #e0e6f0; border-radius: 4px; padding: 12px; display: flex; align-items: center; gap: 10px; font-weight: 600; color: #333; font-size: 13px; }
    .stat-box i { color: #1a62bf; font-size: 16px; }
    .list-section { margin-bottom: 20px; }
    .list-section h4 { margin: 0 0 10px; font-size: 14px; color: #444; }
    .table-wrap { max-height: 200px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px; }
    .dep-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .dep-table th { background: #f8f9fc; padding: 8px; text-align: left; border-bottom: 1px solid #eee; position: sticky; top: 0; }
    .dep-table td { padding: 8px; border-bottom: 1px solid #eee; }
    .modal-footer { padding: 15px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px; background: #f8f9fc; border-radius: 0 0 6px 6px; }
    .btn-secondary { background: #6c757d; color: white; border: none; padding: 8px 16px; font-size: 13px; border-radius: 3px; cursor: pointer; text-decoration: none; display: flex; align-items: center; }
    .btn-secondary:hover { background: #5a6268; }
    .btn-danger { background: #dc3545; color: white; border: none; padding: 8px 16px; font-size: 13px; border-radius: 3px; cursor: pointer; font-weight: 600; }
    .btn-danger:hover { background: #c82333; }
    `]
})
export class AdminTaxmaster implements OnInit {
    slabs = signal<any[]>([]);
    saving = signal(false);
    Math = Math;

    // Pagination & Search
    currentPage = 1;
    pageSize = 10;
    totalItems = 0;
    searchQuery = '';
    pageSizeOptions = [5, 10, 25, 50, 100];

    // Add new form signals
    cgstNew = signal<number | null>(null);
    sgstNew = signal<number | null>(null);
    cessNew = signal<number | null>(null);
    computedGST = computed(() => {
        return Number(((Number(this.cgstNew()) || 0) + (Number(this.sgstNew()) || 0)).toFixed(2));
    });

    // Edit form signals
    editingId = signal<number | null>(null);
    editCGST = signal<number | null>(null);
    editSGST = signal<number | null>(null);
    editCESS = signal<number | null>(null);
    editComputedGST = computed(() => {
        return Number(((Number(this.editCGST()) || 0) + (Number(this.editSGST()) || 0)).toFixed(2));
    });

    // Modal State
    showDependencyModal = signal(false);
    pendingAction = signal<'edit' | 'delete' | null>(null);
    pendingSlab = signal<any>(null);
    affectedLabourCodes = signal<any[]>([]);
    affectedVehicles = signal<any[]>([]);

    constructor(private api: ApiService) {}

    ngOnInit(): void {
        this.loadSlabs();
    }

    loadSlabs() {
        this.api.getTaxSlabs(this.currentPage, this.pageSize, this.searchQuery).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.slabs.set(res.data || []);
                    this.totalItems = res.total || 0;
                }
            },
            error: () => alert('Failed to load tax slabs.')
        });
    }

    onSearch() {
        this.currentPage = 1;
        this.loadSlabs();
    }

    onPageChange(page: number) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadSlabs();
    }

    onPageSizeChange() {
        this.currentPage = 1;
        this.loadSlabs();
    }

    get totalPages(): number {
        return Math.ceil(this.totalItems / this.pageSize);
    }

    get pagesArray(): number[] {
        const total = this.totalPages;
        if (total <= 1) return total === 1 ? [1] : [];
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    autoCalcNew() { /* Auto-computed via signal */ }
    autoCalcEdit() { /* Auto-computed via signal */ }

    addSlab() {
        const cgst = Number(this.cgstNew()) || 0;
        const sgst = Number(this.sgstNew()) || 0;
        const cess = Number(this.cessNew()) || 0;
        if (cgst <= 0 && sgst <= 0) {
            alert('At least CGST or SGST must be greater than 0.');
            return;
        }
        const gst = cgst + sgst;
        this.saving.set(true);
        this.api.addTaxSlab({ GST: gst, CGST: cgst, SGST: sgst, IGST: gst, CESS: cess }).subscribe({
            next: (res: any) => {
                this.saving.set(false);
                if (res.success) {
                    this.cgstNew.set(null);
                    this.sgstNew.set(null);
                    this.cessNew.set(null);
                    this.currentPage = 1;
                    this.loadSlabs();
                } else {
                    alert('❌ ' + res.message);
                }
            },
            error: (err: any) => {
                this.saving.set(false);
                alert('❌ ' + (err.error?.message || 'Failed to add slab'));
            }
        });
    }

    startEdit(slab: any) {
        this.api.checkTaxSlabDependencies(slab.id_tax_slab).subscribe({
            next: (res: any) => {
                if (res.success && (res.labourCodes?.length > 0 || res.vehicles?.length > 0)) {
                    this.pendingAction.set('edit');
                    this.pendingSlab.set(slab);
                    this.affectedLabourCodes.set(res.labourCodes || []);
                    this.affectedVehicles.set(res.vehicles || []);
                    this.showDependencyModal.set(true);
                } else {
                    this.enterEditMode(slab);
                }
            },
            error: () => this.enterEditMode(slab)
        });
    }

    private enterEditMode(slab: any) {
        this.editingId.set(slab.id_tax_slab);
        this.editCGST.set(Number(slab.CGST));
        this.editSGST.set(Number(slab.SGST));
        this.editCESS.set(Number(slab.CESS));
    }

    cancelEdit() {
        this.editingId.set(null);
        this.editCGST.set(null);
        this.editSGST.set(null);
        this.editCESS.set(null);
    }

    saveEdit() {
        if (!confirm('Are you sure you want to update this tax slab? This will affect all associated products.')) {
            return;
        }
        const cgst = Number(this.editCGST()) || 0;
        const sgst = Number(this.editSGST()) || 0;
        const cess = Number(this.editCESS()) || 0;
        const gst = cgst + sgst;
        this.saving.set(true);
        this.api.updateTaxSlab(this.editingId()!, { GST: gst, CGST: cgst, SGST: sgst, IGST: gst, CESS: cess }).subscribe({
            next: (res: any) => {
                this.saving.set(false);
                if (res.success) {
                    this.cancelEdit();
                    this.loadSlabs();
                } else {
                    alert('❌ ' + res.message);
                }
            },
            error: (err: any) => {
                this.saving.set(false);
                alert('❌ ' + (err.error?.message || 'Failed to update slab'));
            }
        });
    }

    deleteSlab(slab: any) {
        this.api.checkTaxSlabDependencies(slab.id_tax_slab).subscribe({
            next: (res: any) => {
                if (res.success && (res.labourCodes?.length > 0 || res.vehicles?.length > 0)) {
                    this.pendingAction.set('delete');
                    this.pendingSlab.set(slab);
                    this.affectedLabourCodes.set(res.labourCodes || []);
                    this.affectedVehicles.set(res.vehicles || []);
                    this.showDependencyModal.set(true);
                } else {
                    if (confirm('Are you sure you want to delete this tax slab?')) {
                        this.executeDelete(slab.id_tax_slab, false);
                    }
                }
            },
            error: () => {
                if (confirm('Are you sure you want to delete this tax slab?')) {
                    this.executeDelete(slab.id_tax_slab, false);
                }
            }
        });
    }

    executeDelete(id: number, force: boolean) {
        this.api.deleteTaxSlab(id, force).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.loadSlabs();
                } else {
                    alert('❌ ' + res.message);
                }
            },
            error: (err: any) => alert('❌ ' + (err.error?.message || 'Failed to delete slab'))
        });
    }

    confirmForceAction() {
        if (this.pendingAction() === 'edit') {
            this.enterEditMode(this.pendingSlab());
            this.closeDependencyModal();
        } else if (this.pendingAction() === 'delete') {
            const slab = this.pendingSlab();
            if (confirm('Are you sure you want to delete this tax slab? This action cannot be undone.')) {
                this.executeDelete(slab.id_tax_slab, true);
                this.closeDependencyModal();
            }
        }
    }

    closeDependencyModal() {
        this.showDependencyModal.set(false);
        this.pendingAction.set(null);
        this.pendingSlab.set(null);
        this.affectedLabourCodes.set([]);
        this.affectedVehicles.set([]);
    }
}
