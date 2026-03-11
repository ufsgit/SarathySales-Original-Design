import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNav } from '../admin-nav/admin-nav';
import { ApiService } from '../services/api.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-productmasterlist',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, RouterLink],
  template: `
<div class="app-container" (click)="closeAllDropdowns()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home"><i class="fas fa-home"></i> Home</a>
        <span> > </span>
        <span class="active">List Product Master</span>
      </div>

      <div class="theme-card">
        <header class="blue-header-strip">
          <div class="header-left">
            <i class="fas fa-bars menu-icon"></i>
            <h2>Product Master List</h2>
          </div>
          <div class="header-actions">
            <button class="btn-add" routerLink="/admin-productmaster">Add Product Master</button>
            <button class="btn-update" (click)="openUploadModal()">Update Product Price</button>
          </div>
        </header>

        <div class="page-card-content">
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>SI No</th>
                  <th>Product Code</th>
                  <th>Name</th>
                  <th>Vehicle Class</th>
                  <th>Fuel</th>
                  <th>Description</th>
                  <th>Basic Price</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>Total Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="products().length === 0">
                  <td colspan="11" class="no-data">No data available</td>
                </tr>
                <tr *ngFor="let product of products(); let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ product.labour_code }}</td>
                  <td>{{ product.labour_title }}</td>
                  <td>{{ product.repair_type }}</td>
                  <td>{{ product.fuel }}</td>
                  <td class="desc-cell">{{ product.discription }}</td>
                  <td>{{ product.sale_price | number:'1.2-2' }}</td>
                  <td>{{ product.cgst }}%</td>
                  <td>{{ product.sgst }}%</td>
                  <td>{{ product.total_price | number:'1.2-2' }}</td>
                  <td class="action-cell">
                    <div class="action-wrapper" (click)="$event.stopPropagation()">
                      <button class="btn-action" (click)="toggleDropdown(i)">
                        Action <i class="fas fa-caret-down"></i>
                      </button>
                      <div class="action-dropdown" *ngIf="openDropdownIndex === i">
                        <div class="dropdown-item edit" (click)="openEditModal(product)">
                          <i class="fas fa-edit"></i> Edit
                        </div>
                        <div class="dropdown-item delete" (click)="confirmDelete(product)">
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
</div>

<!-- ===== Upload Price Modal ===== -->
<div class="modal-overlay" *ngIf="showUploadModal" (click)="closeModalOverlay($event, 'upload')">
  <div class="modal-box">
    <div class="modal-header">Update Price Details</div>
    <div class="modal-body">
      <div class="upload-hint">Upload your excel file.</div>
      <div class="file-row">
        <label class="file-label">Select Excel File :</label>
        <input type="file" id="excelFile" accept=".xlsx,.xls,.csv" (change)="onFileSelected($event)">
      </div>
      <div class="upload-status success" *ngIf="uploadStatus && uploadSuccess">{{ uploadStatus }}</div>
      <div class="upload-status error" *ngIf="uploadStatus && !uploadSuccess">{{ uploadStatus }}</div>
    </div>
    <div class="modal-footer">
      <button class="btn-modal-primary" (click)="uploadFile()" [disabled]="!selectedFile || uploading">
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
      <button class="btn-modal-cancel" (click)="showUploadModal = false">No</button>
    </div>
  </div>
</div>

<!-- ===== Edit Product Modal ===== -->
<div class="modal-overlay" *ngIf="showEditModal" (click)="closeModalOverlay($event, 'edit')">
  <div class="modal-box modal-wide">
    <div class="modal-header">Edit Product Master</div>
    <div class="modal-body edit-form-body">
      <div class="edit-grid">
        <div class="edit-row"><label>Product Code</label><input class="edit-input" [(ngModel)]="editData.code"></div>
        <div class="edit-row"><label>Product Name</label><input class="edit-input" [(ngModel)]="editData.name"></div>
        <div class="edit-row"><label>Class</label><input class="edit-input" [(ngModel)]="editData.class"></div>
        <div class="edit-row"><label>F.A Weight</label><input class="edit-input" [(ngModel)]="editData.faWeight"></div>
        <div class="edit-row"><label>R.A Weight</label><input class="edit-input" [(ngModel)]="editData.raWeight"></div>
        <div class="edit-row"><label>O.A Weight</label><input class="edit-input" [(ngModel)]="editData.oaWeight"></div>
        <div class="edit-row"><label>HSN Code</label><input class="edit-input" [(ngModel)]="editData.hsnCode"></div>
        <div class="edit-row"><label>T.A Weight</label><input class="edit-input" [(ngModel)]="editData.taWeight"></div>
        <div class="edit-row"><label>U.L Weight</label><input class="edit-input" [(ngModel)]="editData.ulWeight"></div>
        <div class="edit-row"><label>R Weight</label><input class="edit-input" [(ngModel)]="editData.rWeight"></div>
        <div class="edit-row"><label>H.P</label><input class="edit-input" [(ngModel)]="editData.hp"></div>
        <div class="edit-row"><label>Description</label><input class="edit-input" [(ngModel)]="editData.description"></div>
        <div class="edit-row"><label>C.C</label><input class="edit-input" [(ngModel)]="editData.cc"></div>
        <div class="edit-row"><label>Type Of Body</label><input class="edit-input" [(ngModel)]="editData.typeOfBody"></div>
        <div class="edit-row"><label>No of Cylinders</label><input class="edit-input" [(ngModel)]="editData.noOfCylinders"></div>
        <div class="edit-row"><label>Fuel</label><input class="edit-input" [(ngModel)]="editData.fuel"></div>
        <div class="edit-row"><label>Wheel Base</label><input class="edit-input" [(ngModel)]="editData.wheelBase"></div>
        <div class="edit-row"><label>Booking Code</label><input class="edit-input" [(ngModel)]="editData.bookingCode"></div>
        <div class="edit-row"><label>Seat Capacity</label><input class="edit-input" [(ngModel)]="editData.seatCapacity"></div>
        <div class="edit-row"><label>Basic Price</label><input class="edit-input" type="number" [(ngModel)]="editData.basicPrice" (ngModelChange)="calcEditTotal()"></div>
        <div class="edit-row"><label>CGST</label><input class="edit-input" type="number" [(ngModel)]="editData.cgst" (ngModelChange)="calcEditTotal()"></div>
        <div class="edit-row"><label>SGST</label><input class="edit-input" type="number" [(ngModel)]="editData.sgst" (ngModelChange)="calcEditTotal()"></div>
        <div class="edit-row"><label>CESS</label><input class="edit-input" type="number" [(ngModel)]="editData.cess" (ngModelChange)="calcEditTotal()"></div>
        <div class="edit-row"><label>Total</label><input class="edit-input" type="number" [(ngModel)]="editData.totalPrice"></div>
        <div class="edit-row"><label>Purchase Cost</label><input class="edit-input" type="number" [(ngModel)]="editData.purchaseCost"></div>
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
    .app-container { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 2px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    .breadcrumb-bar { font-size: 13px; color: #555; padding: 10px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-bar a { color: #555; text-decoration: none; cursor: pointer; }
    .breadcrumb-bar .active { font-weight: 500; color: #333; }

    .theme-card { background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
    .blue-header-strip { background: #0b5ed7; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .blue-header-strip h2 { margin: 0; font-size: 16px; font-weight: 600; }
    .header-actions { display: flex; gap: 0; }
    .btn-add { background: #c92127; color: white; border: none; padding: 8px 15px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-update { background: #28a745; color: white; border: none; padding: 8px 15px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .page-card-content { padding: 0; background: #fff; }
    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .report-table th { background: #f1f1f1; color: #333; font-weight: 600; padding: 10px; text-align: left; border: 1px solid #ddd; white-space: nowrap; }
    .report-table td { padding: 8px 10px; border: 1px solid #ddd; color: #444; vertical-align: middle; }
    .desc-cell { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .report-table tr:nth-child(even) { background: #fafafa; }
    .no-data { text-align: center; padding: 40px !important; font-style: italic; color: #999; }

    /* Action Dropdown */
    .action-cell { position: relative; }
    .action-wrapper { position: relative; display: inline-block; }
    .btn-action { background: #c92127; color: white; border: none; padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    .action-dropdown { position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 4px; min-width: 130px; z-index: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .dropdown-item { padding: 10px 16px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .dropdown-item:hover { background: #f5f5f5; }
    .dropdown-item.edit { color: #0b5ed7; }
    .dropdown-item.delete { color: #c92127; border-top: 1px solid #f0f0f0; }

    /* Modals */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 9000; display: flex; align-items: center; justify-content: center; }
    .modal-box { background: #fff; border-radius: 4px; width: 420px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); overflow: hidden; max-height: 90vh; display: flex; flex-direction: column; }
    .modal-wide { width: 780px; }
    .modal-header { background: #1a62bf; color: white; padding: 12px 20px; font-size: 15px; font-weight: 600; flex-shrink: 0; }
    .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 12px 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #eee; flex-shrink: 0; }
    .btn-modal-primary { background: #0b5ed7; color: white; border: none; padding: 8px 28px; font-size: 14px; font-weight: 600; border-radius: 4px; cursor: pointer; }
    .btn-modal-primary:disabled { background: #a0b8e0; cursor: not-allowed; }
    .btn-modal-cancel { background: #fff; color: #333; border: 1px solid #ccc; padding: 8px 28px; font-size: 14px; border-radius: 4px; cursor: pointer; }

    /* Upload Modal */
    .upload-hint { background: #fffbe6; border: 1px solid #ffe58f; color: #8a6d00; padding: 8px 14px; border-radius: 3px; font-size: 13px; margin-bottom: 16px; }
    .file-row { display: flex; align-items: center; gap: 12px; }
    .file-label { font-size: 13px; white-space: nowrap; min-width: 120px; }
    .upload-status { margin-top: 12px; padding: 8px 12px; border-radius: 3px; font-size: 13px; }
    .upload-status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .upload-status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

    /* Edit Form */
    .edit-form-body { padding: 15px 20px; }
    .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
    .edit-row { display: flex; flex-direction: column; gap: 4px; }
    .edit-row label { font-size: 12px; color: #555; font-weight: 500; }
    .edit-input { padding: 6px 10px; font-size: 13px; border: 1px solid #ccc; border-radius: 3px; outline: none; }
    .edit-input:focus { border-color: #0b5ed7; }
  `]
})
export class AdminProductmasterlist implements OnInit {
  products = signal<any[]>([]);
  openDropdownIndex: number | null = null;

  // Upload modal
  showUploadModal = false;
  selectedFile: File | null = null;
  uploading = false;
  uploadStatus = '';
  uploadSuccess = false;

  // Edit modal
  showEditModal = false;
  saving = false;
  editProductId: number | null = null;
  editData: any = {};

  constructor(private apiService: ApiService, private http: HttpClient) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.apiService.listProducts().subscribe({
      next: (res: any) => { if (res.success) this.products.set(res.data); },
      error: (err: any) => console.error('Error loading products', err)
    });
  }

  // ---- Action Dropdown ----
  toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  closeAllDropdowns() {
    this.openDropdownIndex = null;
  }

  // ---- Upload Modal ----
  openUploadModal() {
    this.showUploadModal = true;
    this.selectedFile = null;
    this.uploadStatus = '';
    this.uploading = false;
  }

  closeModalOverlay(event: MouseEvent, type: string) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (type === 'upload') this.showUploadModal = false;
      if (type === 'edit') this.showEditModal = false;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadStatus = '';
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post<any>('http://localhost:5000/api/admin/products/upload-price', formData).subscribe({
      next: (res) => {
        this.uploading = false;
        this.uploadSuccess = res.success;
        this.uploadStatus = res.success ? `✅ ${res.message}` : `❌ ${res.message}`;
        if (res.success) { this.loadProducts(); setTimeout(() => { this.showUploadModal = false; }, 1500); }
      },
      error: (err) => {
        this.uploading = false;
        this.uploadSuccess = false;
        this.uploadStatus = '❌ ' + (err.error?.message || 'Upload failed');
      }
    });
  }

  // ---- Edit Modal ----
  openEditModal(product: any) {
    this.openDropdownIndex = null;
    this.editProductId = product.labour_id;
    this.editData = {
      code: product.labour_code,
      name: product.labour_title,
      class: product.repair_type,
      faWeight: product.fa_weight,
      raWeight: product.ra_weight,
      oaWeight: product.oa_weight,
      hsnCode: product.hsn_code,
      taWeight: product.ta_weight,
      ulWeight: product.ul_weight,
      rWeight: product.r_weight,
      hp: product.hp,
      description: product.discription,
      cc: product.cc,
      typeOfBody: product.tbody,
      noOfCylinders: product.no_of_cylider,
      fuel: product.fuel,
      wheelBase: product.wheel_base,
      bookingCode: product.booking_code,
      seatCapacity: product.seat_capacity,
      basicPrice: product.sale_price,
      cgst: product.cgst,
      sgst: product.sgst,
      cess: product.cess,
      totalPrice: product.total_price,
      purchaseCost: product.purchase_cost
    };
    this.showEditModal = true;
  }

  calcEditTotal() {
    const b = Number(this.editData.basicPrice) || 0;
    const c = Number(this.editData.cgst) || 0;
    const s = Number(this.editData.sgst) || 0;
    const ce = Number(this.editData.cess) || 0;
    this.editData.totalPrice = b + c + s + ce;
  }

  saveEdit() {
    if (!this.editProductId) return;
    this.saving = true;

    this.http.put<any>(`http://localhost:5000/api/admin/products/edit/${this.editProductId}`, this.editData).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          alert('✅ Product updated successfully!');
          this.showEditModal = false;
          this.loadProducts();
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
  confirmDelete(product: any) {
    this.openDropdownIndex = null;
    const confirm = window.confirm(`Are you sure you want to delete:\n"${product.labour_title}" (${product.labour_code})?`);
    if (!confirm) return;

    this.http.delete<any>(`http://localhost:5000/api/admin/products/delete/${product.labour_id}`).subscribe({
      next: (res) => {
        if (res.success) {
          alert('✅ Product deleted successfully!');
          this.loadProducts();
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
