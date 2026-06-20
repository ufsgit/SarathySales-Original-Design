import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminNav } from '../admin-nav/admin-nav';
import { LogoService } from '../services/logo.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-logomaster',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminNav, RouterLink],
  template: `
<div class="app-container">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">

      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <span>Logo Master</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
          <div class="header-left">
            <i class="fas fa-image menu-icon"></i>
            <h2>Logo Master</h2>
          </div>
          <div class="header-actions">
            <button class="btn-list" (click)="openAddModal()">+ Add Logo</button>
          </div>
        </header>

        <div class="page-card-content">

          <!-- Top controls: Show entries + Search -->
          <div class="dt-top-bar">
            <div class="dt-show-entries">
              <label>Show
                <select (change)="onPageSizeChange($event)">
                  <option value="5"  [selected]="pageLimit()===5">5</option>
                  <option value="10" [selected]="pageLimit()===10">10</option>
                  <option value="25" [selected]="pageLimit()===25">25</option>
                  <option value="50" [selected]="pageLimit()===50">50</option>
                </select>
                entries
              </label>
            </div>
            <div class="dt-search">
              <input type="text" class="dt-search-input" placeholder="Search Logo Title..." (input)="onSearch($event)" [value]="searchTerm()">
            </div>
          </div>

          <div class="table-responsive">
            <table class="sarathy-table">
              <thead>
                <tr>
                  <th style="width:50px">S.No</th>
                  <th>Logo Image</th>
                  <th>Logo Title</th>
                  <th>Assigned Branch</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="loading()">
                  <td colspan="5" style="text-align:center;padding:20px">Loading...</td>
                </tr>
                <tr *ngIf="!loading() && logos().length === 0">
                  <td colspan="5" style="text-align:center;padding:20px">No logos found.</td>
                </tr>
                <tr *ngFor="let logo of logos(); let i = index">
                  <td>{{ (currentPage() - 1) * pageLimit() + i + 1 }}</td>
                  <td>
                    <ng-container *ngIf="!logo.imgError; else notFoundTpl">
                      <img [src]="env.FilePath + logo.logo_url" alt="Logo" class="logo-thumbnail"
                           (error)="logo.imgError = true">
                    </ng-container>
                    <ng-template #notFoundTpl>
                      <span style="color: red; font-weight: bold;">Not Found</span>
                    </ng-template>
                  </td>
                  <td>{{ logo.logo_title }}</td>

                  <!-- Assigned Branch column -->
                  <td>
                    <div *ngIf="logo.assigned_branches; else noBranchTpl" class="branch-popup-wrapper">
                      <button class="btn-show-branch" (click)="toggleBranchPopup(logo.logo_id, $event)">
                        <i class="fas fa-eye"></i> Show
                      </button>
                    </div>
                    <ng-template #noBranchTpl>
                      <span class="badge-no-branch" style="color: red;">No Branch</span>
                    </ng-template>
                  </td>

                  <!-- Actions -->
                  <td>
                    <div class="action-buttons">
                      <button class="btn-edit" (click)="openEditModal(logo)">
                        <i class="fas fa-edit"></i> Edit
                      </button>
                      <button class="btn-delete" (click)="deleteLogo(logo.logo_id)">
                        <i class="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom: Showing info + Previous/Page/Next -->
          <div class="dt-bottom-bar">
            <div class="dt-info">
              Showing {{ totalRecords() === 0 ? 0 : (currentPage()-1)*pageLimit()+1 }} to {{ pageEnd() }} of {{ totalRecords() }} entries
            </div>
            <div class="dt-pagination">
              <button class="dt-pg-btn" (click)="goToPage(currentPage()-1)" [disabled]="currentPage() === 1">Previous</button>
              <button *ngFor="let p of pageNumbers()" class="dt-pg-num" [class.active]="p === currentPage()" (click)="goToPage(p)">{{ p }}</button>
              <button class="dt-pg-btn" (click)="goToPage(currentPage()+1)" [disabled]="currentPage() === totalPages()">Next</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </main>

  <div style="height:50px"></div>
</div>

<!-- Global branch popup (fixed, floats over everything) -->
<div class="branch-popup-fixed" *ngIf="activeBranchPopup() !== null && popupPosition()"
     [style.top.px]="popupPosition()!.top"
     [style.left.px]="popupPosition()!.left">
  <div class="popup-header">Assigned Branches</div>
  <div *ngFor="let logo of logos()">
    <ng-container *ngIf="logo.logo_id === activeBranchPopup() && logo.assigned_branches">
      <div class="popup-item" *ngFor="let b of logo.assigned_branches.split(', ')">
        <i class="fas fa-building"></i> {{ b }}
      </div>
    </ng-container>
  </div>
</div>
<!-- Backdrop to close popup on outside click -->
<div class="popup-backdrop" *ngIf="activeBranchPopup() !== null" (click)="closePopup()"></div>

<!-- ── Add Logo Modal ── -->
<div class="modal-overlay" *ngIf="showModal()">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Add Logo</h3>
      <button class="close-btn" (click)="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <form [formGroup]="logoForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label>Logo Title <span class="text-danger">*</span></label>
          <input type="text" class="form-control" formControlName="title" placeholder="Enter Logo Title">
          <div *ngIf="logoForm.get('title')?.invalid && logoForm.get('title')?.touched" class="error-msg">
            Logo title is required.
          </div>
        </div>

        <div class="form-group mt-3">
          <label>Logo Image <span class="text-danger">*</span></label>
          <input type="file" class="form-control" (change)="onFileSelected($event)" accept=".png,.jpg,.jpeg,.webp">
          <div *ngIf="fileError()" class="error-msg">{{ fileError() }}</div>
        </div>

        <div class="preview-container mt-3" *ngIf="imagePreview()">
          <p>Preview:</p>
          <img [src]="imagePreview()" alt="Preview" class="preview-image">
        </div>

        <div class="modal-footer mt-4">
          <button type="submit" class="btn-submit" [disabled]="logoForm.invalid || !selectedFile() || saving()">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" class="btn-cancel" (click)="closeModal()">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- ── Edit Logo Modal ── -->
<div class="modal-overlay" *ngIf="showEditModal()">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Edit Logo</h3>
      <button class="close-btn" (click)="closeEditModal()">&times;</button>
    </div>
    <div class="modal-body">
      <form [formGroup]="editLogoForm" (ngSubmit)="onEditSubmit()">

        <!-- Current / new image preview -->
        <div class="edit-preview-row">
          <div class="edit-preview-box">
            <p class="preview-label">Current Image</p>
            <ng-container *ngIf="!editCurrentPreviewError(); else currentNotFoundTpl">
              <img [src]="editCurrentPreview()" alt="Current Logo" class="preview-image" (error)="editCurrentPreviewError.set(true)">
            </ng-container>
            <ng-template #currentNotFoundTpl>
              <span style="color: red; font-weight: bold; display: block; margin-top: 10px;">Not Found</span>
            </ng-template>
          </div>
          <div class="edit-preview-box" *ngIf="editImagePreview()">
            <p class="preview-label">New Image</p>
            <img [src]="editImagePreview()" alt="New Logo" class="preview-image">
          </div>
        </div>

        <div class="form-group mt-3">
          <label>Logo Title <span class="text-danger">*</span></label>
          <input type="text" class="form-control" formControlName="title" placeholder="Enter Logo Title">
          <div *ngIf="editLogoForm.get('title')?.invalid && editLogoForm.get('title')?.touched" class="error-msg">
            Logo title is required.
          </div>
        </div>

        <div class="form-group mt-3">
          <label>Change Image <span class="optional-label">(optional — leave blank to keep current)</span></label>
          <input type="file" class="form-control" (change)="onEditFileSelected($event)" accept=".png,.jpg,.jpeg,.webp" #editFileInput>
          <div *ngIf="editFileError()" class="error-msg">{{ editFileError() }}</div>
        </div>

        <div class="modal-footer mt-4">
          <button type="submit" class="btn-submit" [disabled]="editLogoForm.invalid || saving()">
            {{ saving() ? 'Saving...' : 'Update' }}
          </button>
          <button type="button" class="btn-cancel" (click)="closeEditModal()">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</div>
  `,
  styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 5px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }

    .breadcrumb-bar { font-size: 13px; color: #555; padding: 15px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-item { color: #555; text-decoration: none; display: flex; align-items: center; gap: 5px; }
    .separator { color: #999; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,.05); overflow: visible; max-width: 1000px; margin: 20px auto 0; }

    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: #fff; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .menu-icon { font-size: 14px; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; }

    .btn-list { background-color: #c92127; color: #fff; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    .btn-list:hover { background-color: #a71b21; }

    .page-card-content { padding: 20px; }

    /* Table */
    .table-responsive { overflow-x: auto; }
    .sarathy-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .sarathy-table th { background: #f8f9fa; border-bottom: 2px solid #ddd; padding: 10px; text-align: left; font-weight: 600; color: #333; }
    .sarathy-table td { padding: 10px; border-bottom: 1px solid #eee; vertical-align: middle; }
    .sarathy-table tr:hover { background: #f5f5f5; }

    .logo-thumbnail { max-width: 80px; max-height: 50px; border-radius: 4px; object-fit: contain; }

    /* Branch Show button & popup */
    .branch-popup-wrapper { position: relative; display: inline-block; }

    .btn-show-branch { background-color: #1e8e3e; color: #fff; border: none; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background .2s; }
    .btn-show-branch:hover { background-color: #166d2f; }

    /* Fixed global popup */
    .branch-popup-fixed { position: fixed; background: #fff; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 18px rgba(0,0,0,.18); min-width: 220px; z-index: 9999; padding: 6px 0; animation: fadePop .15s ease; }
    @keyframes fadePop { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
    .popup-backdrop { position: fixed; inset: 0; z-index: 9998; }
    .popup-header { padding: 5px 12px; font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #eee; margin-bottom: 3px; }
    .popup-item { padding: 5px 12px; font-size: 13px; color: #333; display: flex; align-items: center; gap: 8px; }
    .popup-item i { color: #1a62bf; font-size: 11px; }

    /* DataTables-style top bar */
    .dt-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
    .dt-show-entries label { font-size: 13px; color: #333; display: flex; align-items: center; gap: 6px; }
    .dt-show-entries select { padding: 3px 6px; border: 1px solid #ccc; border-radius: 3px; font-size: 13px; }
    .dt-search-input { padding: 5px 10px; border: 1px solid #ccc; border-radius: 3px; font-size: 13px; outline: none; min-width: 200px; }
    .dt-search-input:focus { border-color: #1a62bf; }

    /* DataTables-style bottom bar */
    .dt-bottom-bar { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #eee; margin-top: 6px; flex-wrap: wrap; gap: 8px; }
    .dt-info { font-size: 13px; color: #555; }
    .dt-pagination { display: flex; align-items: center; gap: 3px; }
    .dt-pg-btn { background: #fff; border: 1px solid #ddd; padding: 4px 10px; border-radius: 3px; font-size: 12px; cursor: pointer; color: #333; }
    .dt-pg-btn:hover:not(:disabled) { background: #f0f0f0; }
    .dt-pg-btn:disabled { opacity: .45; cursor: default; }
    .dt-pg-num { background: #fff; border: 1px solid #ddd; padding: 4px 9px; border-radius: 3px; font-size: 12px; cursor: pointer; min-width: 30px; text-align: center; color: #333; }
    .dt-pg-num.active { background: #1a62bf; color: #fff; border-color: #1a62bf; font-weight: 700; }
    .dt-pg-num:hover:not(.active) { background: #f0f0f0; }

    /* Edit modal preview */
    .edit-preview-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 4px; }
    .edit-preview-box { flex: 1; min-width: 120px; border: 1px dashed #ccc; border-radius: 4px; padding: 8px; text-align: center; background: #fafafa; }
    .preview-label { margin: 0 0 6px; font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
    .optional-label { font-size: 11px; color: #888; font-weight: 400; }
    .action-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn-edit { background-color: #1a62bf; color: #fff; border: none; padding: 5px 10px; border-radius: 3px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
    .btn-edit:hover { background-color: #15509c; }
    .btn-delete { background-color: #dc3545; color: #fff; border: none; padding: 5px 10px; border-radius: 3px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
    .btn-delete:hover { background-color: #c82333; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; justify-content: center; align-items: center; z-index: 1100; }
    .modal-content { background: #fff; border-radius: 8px; width: 100%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,.15); animation: slideDown .3s ease-out; }
    @keyframes slideDown { from { transform:translateY(-20px); opacity:0; } to { transform:translateY(0); opacity:1; } }

    .modal-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; border-radius: 8px 8px 0 0; }
    .modal-header h3 { margin: 0; font-size: 16px; color: #333; font-weight: 600; }
    .close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; line-height: 1; padding: 0; }
    .close-btn:hover { color: #333; }

    .modal-body { padding: 20px; }

    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #555; }
    .text-danger { color: #dc3545; }
    .mt-3 { margin-top: 15px; }
    .mt-4 { margin-top: 25px; }

    .form-control { padding: 8px 12px; font-size: 13px; border: 1px solid #ddd; border-radius: 4px; width: 100%; box-sizing: border-box; }
    .form-control:focus { border-color: #1a62bf; outline: none; }

    .error-msg { color: #dc3545; font-size: 12px; }

    .preview-container { border: 1px dashed #ccc; padding: 10px; border-radius: 4px; text-align: center; background: #fafafa; }
    .preview-container p { margin: 0 0 10px; font-size: 12px; color: #666; }
    .preview-image { max-width: 100%; max-height: 150px; object-fit: contain; }

    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
    .btn-submit { background-color: #1a62bf; color: #fff; border: none; padding: 8px 20px; font-size: 13px; font-weight: 600; border-radius: 4px; cursor: pointer; }
    .btn-submit:hover:not(:disabled) { background-color: #15509c; }
    .btn-submit:disabled { background-color: #a0c0e8; cursor: not-allowed; }
    .btn-cancel { background-color: #e0e0e0; color: #333; border: none; padding: 8px 20px; font-size: 13px; border-radius: 4px; cursor: pointer; }
    .btn-cancel:hover { background-color: #d0d0d0; }
  `]
})
export class AdminLogomaster implements OnInit {
  env = environment;
  logos         = signal<any[]>([]);
  loading       = signal<boolean>(true);
  searchTerm    = signal<string>('');
  currentPage   = signal<number>(1);
  pageLimit     = signal<number>(10);
  totalRecords  = signal<number>(0);
  totalPages    = signal<number>(1);
  pageNumbers   = signal<number[]>([]);

  showModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  saving = signal<boolean>(false);

  activeBranchPopup = signal<number | null>(null);
  popupPosition = signal<{ top: number; left: number } | null>(null);
  editingLogoId = signal<number | null>(null);

  logoForm: FormGroup;
  editLogoForm: FormGroup;
  selectedFile      = signal<File | null>(null);
  imagePreview      = signal<string | null>(null);
  fileError         = signal<string | null>(null);
  // Edit-specific
  editSelectedFile  = signal<File | null>(null);
  editImagePreview  = signal<string | null>(null);
  editCurrentPreview = signal<string>('');
  editCurrentPreviewError = signal<boolean>(false);
  editFileError     = signal<string | null>(null);

  private logoService = inject(LogoService);
  private fb = inject(FormBuilder);

  constructor() {
    this.logoForm = this.fb.group({
      title: ['', [Validators.required, Validators.pattern(/.*\S.*/)]]
    });
    this.editLogoForm = this.fb.group({
      title: ['', [Validators.required, Validators.pattern(/.*\S.*/)]]
    });
  }

  ngOnInit(): void {
    this.loadLogos();
  }

  pageEnd(): number {
    return Math.min(this.currentPage() * this.pageLimit(), this.totalRecords());
  }

  loadLogos(): void {
    this.loading.set(true);
    this.logos.set([]);   // clear stale rows immediately
    this.logoService.listLogos(this.currentPage(), this.pageLimit(), this.searchTerm()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.logos.set(res.data || []);
          this.totalRecords.set(res.total || 0);
          this.totalPages.set(res.totalPages || 1);
          this.buildPageNumbers();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  buildPageNumbers(): void {
    const total = this.totalPages();
    const cur   = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, cur - 2);
    const end   = Math.min(total, cur + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    this.pageNumbers.set(pages);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadLogos();
  }

  onSearch(event: any): void {
    this.searchTerm.set(event.target.value);
    this.currentPage.set(1);
    this.loadLogos();
  }

  onPageSizeChange(event: any): void {
    this.pageLimit.set(+event.target.value);
    this.currentPage.set(1);
    this.loadLogos();
  }

  toggleBranchPopup(logoId: number, event: MouseEvent): void {
    if (this.activeBranchPopup() === logoId) {
      this.activeBranchPopup.set(null);
      this.popupPosition.set(null);
      return;
    }
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.popupPosition.set({ top: rect.bottom + 6, left: rect.left });
    this.activeBranchPopup.set(logoId);
  }

  closePopup(): void {
    this.activeBranchPopup.set(null);
    this.popupPosition.set(null);
  }

  /* ── Add modal ── */
  openAddModal(): void {
    this.logoForm.reset();
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.fileError.set(null);
    this.activeBranchPopup.set(null);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  /* ── Edit modal ── */
  openEditModal(logo: any): void {
    this.editingLogoId.set(logo.logo_id);
    this.editLogoForm.patchValue({ title: logo.logo_title });
    this.editCurrentPreview.set(this.env.FilePath + logo.logo_url);
    this.editCurrentPreviewError.set(false);
    this.editSelectedFile.set(null);
    this.editImagePreview.set(null);
    this.editFileError.set(null);
    this.activeBranchPopup.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingLogoId.set(null);
    this.editSelectedFile.set(null);
    this.editImagePreview.set(null);
    this.editCurrentPreview.set('');
    this.editCurrentPreviewError.set(false);
    this.editFileError.set(null);
  }

  /* ── File selection ── */
  onFileSelected(event: any): void {
    const file = event.target.files[0] as File;
    this.fileError.set(null);
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.fileError.set('Only JPG, PNG and WEBP are allowed.');
      this.selectedFile.set(null);
      this.imagePreview.set(null);
      return;
    }

    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  /* ── Submit new logo ── */
  onSubmit(): void {
    if (this.logoForm.invalid || !this.selectedFile()) return;

    this.saving.set(true);
    const formData = new FormData();
    formData.append('title', this.logoForm.get('title')?.value?.trim());
    formData.append('logo_image', this.selectedFile() as Blob);

    this.logoService.createLogo(formData).subscribe({
      next: (res: any) => {
        if (res.success) { this.closeModal(); this.loadLogos(); }
        else alert(res.message || 'Failed to save logo');
        this.saving.set(false);
      },
      error: (err: any) => {
        alert(err?.error?.message || 'Server error');
        this.saving.set(false);
      }
    });
  }

  /* ── Edit file selection ── */
  onEditFileSelected(event: any): void {
    const file = event.target.files[0] as File;
    this.editFileError.set(null);
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.editFileError.set('Only JPG, PNG and WEBP are allowed.');
      this.editSelectedFile.set(null);
      this.editImagePreview.set(null);
      return;
    }

    this.editSelectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.editImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  /* ── Submit edit ── */
  onEditSubmit(): void {
    if (this.editLogoForm.invalid || !this.editingLogoId()) return;

    this.saving.set(true);
    const id    = this.editingLogoId()!;
    const title = this.editLogoForm.get('title')?.value?.trim();

    if (this.editSelectedFile()) {
      // New image selected — send as multipart FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('logo_image', this.editSelectedFile() as Blob);
      this.logoService.updateLogoWithImage(id, formData).subscribe({
        next: (res: any) => {
          if (res.success) { this.closeEditModal(); this.loadLogos(); }
          else alert(res.message || 'Failed to update logo');
          this.saving.set(false);
        },
        error: (err: any) => { alert(err?.error?.message || 'Server error'); this.saving.set(false); }
      });
    } else {
      // Title only — plain JSON
      this.logoService.updateLogo(id, { title, is_active: 1 }).subscribe({
        next: (res: any) => {
          if (res.success) { this.closeEditModal(); this.loadLogos(); }
          else alert(res.message || 'Failed to update logo');
          this.saving.set(false);
        },
        error: (err: any) => { alert(err?.error?.message || 'Server error'); this.saving.set(false); }
      });
    }
  }

  /* ── Delete ── */
  deleteLogo(id: number): void {
    if (!confirm('Are you sure you want to delete this logo?')) return;

    this.logoService.deleteLogo(id).subscribe({
      next: (res: any) => {
        if (res.success) this.loadLogos();
        else alert(res.message || 'Failed to delete logo');
      },
      error: () => alert('Error deleting logo')
    });
  }
}
