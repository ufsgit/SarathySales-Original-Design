import { Component, OnInit, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';
import { UppercaseDirective } from '../uppercase.directive';


@Component({
    selector: 'app-purchase-upload',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter, UppercaseDirective],
    template: `
<div class="app-container">
  <app-user-nav></app-user-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a (click)="navigate(isAdmin() ? '/admin-home' : '/user-home')"><i class="fas fa-home"></i> Home</a>
        <span> > </span>
        <span>INVOICE</span>
        <span> > </span>
        <span class="active">Purchase</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
           <div class="header-left">
             <h2>INVOICE (Purchase)</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" type="button" (click)="navigate('/previous-purchase-invoice')">List Purchase Invoice</button>
          </div>
        </header>

        <div class="page-card-content">
          <div *ngIf="uploadMessage()" style="margin-bottom:10px;color:#2e7d32;font-size:12px;">{{ uploadMessage() }}</div>
          <div *ngIf="uploadError()" style="margin-bottom:10px;color:#d32f2f;font-size:12px;">{{ uploadError() }}</div>
          <form class="ledger-form">
            
            <!-- Row 1 -->
            <div class="form-grid-row">
                <div class="form-col vertical">
                    <label>Branch Name:</label>
                    <ng-container *ngIf="isAdmin(); else staffBranch">
                        <div class="custom-dropdown" #branchDropdownRef>
                            <div class="dropdown-toggle" [class.placeholder]="branchName() === 'Select Branch'" (click)="toggleBranchDropdown()">
                                {{ branchName() }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isBranchDropdownOpen()">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search branch..."
                                        [ngModel]="branchSearchTerm()"
                                        (ngModelChange)="branchSearchTerm.set($event)"
                                        name="branchSearch" #branchSearchInput
                                        (click)="$event.stopPropagation()">
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option"
                                        *ngFor="let b of searchableBranchOptionsList()"
                                        (click)="onBranchSelect(b)">
                                        {{ b.branch_name }}
                                    </div>
                                    <div class="dropdown-option no-results"
                                        *ngIf="searchableBranchOptionsList().length === 0">
                                        No branches found
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ng-container>
                    <ng-template #staffBranch>
                        <input type="text" class="form-control readonly" [value]="branchName()" readonly>
                    </ng-template>
                </div>
                <div class="form-col">
                    <label>Inv No:</label>
                    <input type="text" class="form-control" [(ngModel)]="invNo" name="invNo">
                </div>
                <div class="form-col">
                    <label>Institution:</label>
                    <select class="form-control" [ngModel]="institutionId()" (ngModelChange)="institutionId.set($event); onInstitutionChange()" name="institutionId">
                        <option value="">--Select--</option>
                        <option *ngFor="let b of institutionOptions()" [value]="b.b_id">{{ b.branch_name }}</option>
                    </select>
                </div>
                <div class="form-col">
                    <label>RC No(supplier):</label>
                    <input type="text" class="form-control" [ngModel]="rcNo()" (ngModelChange)="rcNo.set($event)" name="rcNo">
                </div>
            </div>

            <!-- Row 2 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>HSN Code:</label>
                    <input type="text" class="form-control" [(ngModel)]="hsnCode" name="hsnCode">
                </div>
                <div class="form-col">
                    <label>RC Date:</label>
                    <div class="date-input-wrapper">
                         <input type="date" class="form-control" [ngModel]="rcDate()" (ngModelChange)="rcDate.set($event)" name="rcDate">
                    </div>
                </div>
                <div class="form-col">
                    <label>Address:</label>
                     <textarea class="form-control readonly" [(ngModel)]="address" name="address" rows="1" readonly></textarea>
                </div>
                <div class="form-col">
                    <label>Invoice Date:</label>
                    <div class="date-input-wrapper">
                         <input type="date" class="form-control" [ngModel]="invoiceDate()" (ngModelChange)="invoiceDate.set($event)" name="invoiceDate">
                    </div>
                </div>
             </div>

             <!-- Row 3 -->
             <div class="form-grid-row">
                <div class="form-col"></div> <!-- Spacer -->
                <div class="form-col"></div> <!-- Spacer -->
                <div class="form-col">
                    <label>GSTIN:</label>
                   <input type="text" class="form-control" [(ngModel)]="gstin" name="gstin">
                </div>
                <div class="form-col">
                    <label>Basic Total:</label>
                    <input type="number" class="form-control" [ngModel]="basicTotal()" (ngModelChange)="basicTotal.set($event)" name="basicTotal">
                </div>
                
                <div class="form-col"></div>
                <div class="form-col"></div>
                <div class="form-col"></div>
                <div class="form-col">
                    <label>Tax Total:</label>
                    <input type="number" class="form-control" [ngModel]="taxTotal()" (ngModelChange)="taxTotal.set($event)" name="taxTotal">
                </div>
                
                <div class="form-col"></div>
                <div class="form-col"></div>
                <div class="form-col"></div>
                <div class="form-col">
                    <label>Grand Total:</label>
                    <input type="number" class="form-control" [ngModel]="grandTotal()" (ngModelChange)="grandTotal.set($event)" name="grandTotal">
                </div>
             </div>

             <!-- Row 4 -->
              <div class="form-grid-row">
                <div class="col-instructions">
                     <!-- Select Excel File Layout -->
                     <div class="file-upload-row">
                        <label>Select Excel File :</label>
                        <div class="file-action-group">
                           <input #fileInput type="file" style="display:none" accept=".xlsx,.xls" (change)="onFileSelected($event)">
                           <button type="button" class="btn-choose" (click)="fileInput.click()">Choose File</button>
                           <span class="file-status">{{ selectedFileName() || 'No file chosen' }}</span>
                        </div>
                     </div>
                     <button type="button" class="btn-import" (click)="onImport()" [disabled]="isUploading()">{{ isUploading() ? 'Importing...' : 'Import' }}</button>

                     <!-- Instructions Block -->
                    <div class="instructions-block">
                        <p>Instructions for uploading Excel File:</p>
                        <ol>
                            <li>1. Please remove all blank rows in the excel sheet that has to be uploaded.</li>
                            <li>2. Make sure the first row of the excel sheet is the title of each columns.</li>
                            <li>3. No blank rows should be left above the Title row.</li>
                            <li>4. Please ensure all columns for each row are filled with correct data (No fields should be left blank).</li>
                        </ol>
                    </div>
                </div>

                <div class="form-col"></div> <!-- Spacer Col 2 -->
                <div class="form-col"></div> <!-- Spacer Col 3 -->
                
                
             </div>

          </form>
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

    .btn-list {
        background-color: #d32f2f; /* Red */
        color: white;
        border: none;
        padding: 6px 15px;
        font-size: 12px;
        cursor: pointer;
        border-radius: 3px;
        font-weight: 600;
    }

    /* Form Grid */
    .page-card-content {
        padding: 30px 20px;
        background: #fff;
        min-height: 600px;
    }

    .ledger-form {
        display: flex;
        flex-direction: column;
        gap: 15px; /* Space between rows */
    }

    .form-grid-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        align-items: flex-start;
    }

    .form-col {
        display: flex;
        align-items: center; /* Label and Input side-by-side */
        gap: 10px;
        justify-content: flex-end; /* Align right to push content */
    }

    .form-col label {
        font-size: 12px;
        color: #333;
        white-space: nowrap;
        text-align: right;
        min-width: 80px; 
        font-weight: 500;
    }

    .form-control {
        flex: 1; /* Input takes remaining space */
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 100%;
        max-width: 180px; /* Limit input width to look like screenshot */
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        height: 28px;
    }
    
    textarea.form-control {
        resize: none;
        height: 30px; 
    }

    .form-control.readonly {
        background-color: #f7f7f7;
        color: #555;
    }

    .form-control:focus {
        border-color: #f36f21;
        outline: none;
    }

    .date-input-wrapper {
        position: relative;
        flex: 1;
        max-width: 180px;
    }
    .date-input-wrapper .form-control {
        max-width: 100%;
    }
    .calendar-icon {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
        pointer-events: none;
        font-size: 12px;
    }

    /* Instructions & Upload Area Layout */
    .col-instructions {
        grid-column: span 2;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding-left: 50px; /* Push in slightly */
    }

    .file-upload-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }
    .file-upload-row label {
        font-size: 12px;
        font-weight: bold;
        color: #333;
    }
    .file-action-group {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .btn-choose {
        background: #efefef;
        border: 1px solid #ccc;
        padding: 3px 8px;
        font-size: 11px;
        cursor: pointer;
        border-radius: 2px;
    }
    .file-status {
        font-size: 11px;
        color: #555;
    }
    .btn-import {
        background: #5bc0de;
        color: white;
        border: none;
        padding: 6px 15px;
        font-size: 12px;
        font-weight: bold;
        border-radius: 3px;
        cursor: pointer;
        margin-bottom: 20px;
    }

    .instructions-block {
        margin-top: 20px;
    }
    .instructions-block p {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 8px;
        color: #333;
    }
    .instructions-block ol {
        padding-left: 0;
        list-style: none;
        margin: 0;
    }
    .instructions-block li {
        font-size: 11px;
        color: #333;
        margin-bottom: 4px;
    }

    /* Totals Column Alignment */
    .form-col-totals {
        display: flex;
        flex-direction: column;
        gap: 15px;
        align-items: flex-end;
    }
    .total-row-item {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: flex-end;
        width: 100%;
    }
    .total-row-item label {
        font-size: 12px;
        color: #333;
        white-space: nowrap;
        text-align: right;
        min-width: 80px; 
        font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 1200px) {
        .form-grid-row {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 768px) {
        .form-grid-row {
            grid-template-columns: 1fr;
        }
        .form-col, .col-instructions, .form-col-totals {
            grid-column: span 1;
            align-items: flex-start;
        }
        .form-control {
            max-width: 100%;
        }
        .col-instructions {
            padding-left: 0;
        }
    }
    /* Custom Dropdown Styles */
    .custom-dropdown {
        position: relative;
        width: 100%;
        max-width: 180px;
    }

    .form-col.vertical {
    }

    .form-col.vertical label {
        text-align: left;
        min-width: unset;
    }

    .form-col.vertical .form-control,
    .form-col.vertical .custom-dropdown {
        max-width: 250px;
    }

    .dropdown-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background-color: #fff;
        cursor: pointer;
        min-height: 32px;
        width: 100%;
    }

    .dropdown-toggle.placeholder {
        color: red !important;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: white;
        border: 1px solid #ddd;
        border-radius: 2px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        margin-top: 1px;
    }

    .dropdown-search {
        padding: 5px;
        border-bottom: 1px solid #eee;
    }

    .dropdown-search input {
        width: 100%;
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #eee;
        border-radius: 2px;
        outline: none;
    }

    .dropdown-options-list {
        max-height: 200px;
        overflow-y: auto;
    }

    .dropdown-option {
        padding: 6px 10px;
        font-size: 12px;
        color: #333;
        cursor: pointer;
        text-align: left;
    }

    .dropdown-option:hover {
        background-color: #f36f21;
        color: white;
    }

    .no-results {
        color: #999;
        text-align: center;
        font-style: italic;
    }
  `]
})
export class PurchaseUploadComponent implements OnInit {
    branchId = signal('');
    branchName = signal('SARATHY KOLLAM KTM');
    isAdmin = signal(false);
    branches = signal<any[]>([]);
    isBranchDropdownOpen = signal(false);
    branchSearchTerm = signal('');

    searchableBranchOptionsList = computed(() => {
        const term = this.branchSearchTerm().toLowerCase();
        return this.branches().filter(b =>
            (b.branch_name || '').toLowerCase().includes(term)
        );
    });

    @ViewChild('branchDropdownRef') branchDropdownRef!: ElementRef;
    @ViewChild('branchSearchInput') branchSearchInput!: ElementRef;

    invNo = signal('');
    institution = signal('');
    institutionId = signal('');
    rcNo = signal('');
    hsnCode = signal('');
    rcDate = signal('');
    address = signal('');
    invoiceDate = signal('');
    gstin = signal('');
    institutionOptions = signal<Array<{ b_id: number; branch_name: string; branch_address: string; branch_gstin?: string }>>([]);

    basicTotal = signal(0.00);
    taxTotal = signal(0.00);
    grandTotal = signal(0.00);
    selectedFile: File | null = null;
    selectedFileName = signal('');
    isUploading = signal(false);
    uploadMessage = signal('');
    uploadError = signal('');

    constructor(private router: Router, private api: ApiService) { }

    ngOnInit(): void {
        const user = this.api.getCurrentUser();
        if (user) {
            const admin = user.role == 1 || user.role_des === 'admin';
            this.isAdmin.set(admin);

            let bName = (user.branch_name || '').toString().trim();
            if (bName === 'No Branch' || !bName) {
                if (admin) {
                    bName = 'Select Branch';
                    this.branchId.set('');
                } else {
                    bName = 'SARATHY KOLLAM KTM';
                    this.branchId.set((user.branch_id || '').toString().trim());
                }
            } else {
                this.branchId.set((user.branch_id || '').toString().trim());
            }
            this.branchName.set(bName);
            if (admin) this.loadBranches();
        }
        this.loadInstitutionOptions();
    }

    loadBranches() {
        this.api.getBranches().subscribe({
            next: (res: any) => {
                if (res.success && Array.isArray(res.data)) {
                    this.branches.set(res.data);
                }
            }
        });
    }

    toggleBranchDropdown() {
        this.isBranchDropdownOpen.update(v => !v);
        if (this.isBranchDropdownOpen()) {
            this.branchSearchTerm.set('');
            setTimeout(() => this.branchSearchInput?.nativeElement.focus(), 0);
        }
    }

    onBranchSelect(branch: any) {
        this.branchId.set(branch.b_id.toString());
        this.branchName.set(branch.branch_name);
        this.isBranchDropdownOpen.set(false);
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (this.branchDropdownRef && !this.branchDropdownRef.nativeElement.contains(event.target)) {
            this.isBranchDropdownOpen.set(false);
        }
    }

    private loadInstitutionOptions(): void {
        this.api.getBranches().subscribe({
            next: (res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    const mapped = res.data.map((b: any) => ({
                        b_id: parseInt(b.b_id, 10) || 0,
                        branch_name: (b.branch_name || '').toString().trim(),
                        branch_address: (b.branch_address || '').toString(),
                        branch_gstin: (b.branch_gstin || '').toString().trim()
                    })).filter((b: any) => !!b.branch_name);
                    this.institutionOptions.set(mapped);
                }
            }
        });
    }

    onInstitutionChange(): void {
        const id = parseInt((this.institutionId() || '').toString(), 10) || 0;
        const selected = this.institutionOptions().find(b => b.b_id === id);
        this.institution.set(selected?.branch_name || '');
        this.address.set(selected?.branch_address || '');
        this.gstin.set(selected?.branch_gstin || '');
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input?.files && input.files.length ? input.files[0] : null;
        this.selectedFile = file;
        this.selectedFileName.set(file?.name || '');
        this.uploadMessage.set('');
        this.uploadError.set('');
    }

    onImport(): void {
        this.uploadMessage.set('');
        this.uploadError.set('');
        if (!this.branchId()) {
            this.uploadError.set(this.isAdmin() ? 'Please select a branch.' : 'Branch missing. Please login again.');
            return;
        }
        if (!this.selectedFile) {
            this.uploadError.set('Please choose an Excel file.');
            return;
        }

        this.isUploading.set(true);
        const uiFields = {
            invNo: this.invNo(),
            invoiceDate: this.invoiceDate(),
            vendorName: this.institution(),
            address: this.address(),
            hsnCode: this.hsnCode(),
            gstin: this.gstin(),
            rcDate: this.rcDate(),
            rcNo: this.rcNo()
        };
        this.api.uploadPurchaseExcel(this.selectedFile, this.branchId(), uiFields).subscribe({
            next: (res: any) => {
                this.isUploading.set(false);
                if (res?.success) {
                    const successCount = Number(res?.successCount || 0);
                    const errorCount = Number(res?.errorCount || 0);
                    this.uploadMessage.set(`Import complete. Success: ${successCount}, Errors: ${errorCount}`);
                } else {
                    if (res?.action === 'alert') {
                        alert(res.message);
                    } else if (res?.action === 'redirect_chassis') {
                        alert(res.message);
                        // Extract chassis number from the message or use a dedicated field
                        const chassisNo = res.chassisNo || '';
                        this.router.navigate(['/purchase-invoice'], chassisNo ? { queryParams: { chassisNo } } : {});
                        return;
                    } else if (res?.action === 'redirect_color') {
                        alert(res.message);
                        this.router.navigate(['/admin-color']);
                        return;
                    }
                    this.uploadError.set(res?.message || 'Import failed');
                }
            },
            error: (err: any) => {
                this.isUploading.set(false);
                this.uploadError.set(err?.error?.message || 'Upload failed');
            }
        });
    }

    navigate(path: string) { this.router.navigate([path]); }
}
