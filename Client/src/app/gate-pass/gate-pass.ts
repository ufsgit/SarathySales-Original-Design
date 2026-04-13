import { Component, OnInit, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';
import { UppercaseDirective } from '../uppercase.directive';


@Component({
  selector: 'app-gate-pass',
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
        <span>Transactions</span>
        <span> > </span>
        <span class="active">Gate Pass</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
          <div class="header-left">
             <h2>{{ gatePassId() ? 'Edit Vehicle Selection Slip' : 'Vehicle Selection Slip' }}</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="navigate('/previous-gate-pass')">List Gate Pass</button>
             <button class="btn-save" (click)="onSave()" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : (gatePassId() ? 'Update' : 'Save & Print') }}</button>
          </div>
        </header>

        <div class="page-card-content">
          <div *ngIf="successMessage()" style="margin-bottom:10px;color:#2e7d32;font-size:12px;">{{ successMessage() }}</div>
          <div *ngIf="errorMessage()" style="margin-bottom:10px;color:#d32f2f;font-size:12px;">{{ errorMessage() }}</div>
          <form class="ledger-form">
            
            <!-- Row 1 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Branch Name: <span *ngIf="gatePassId()" style="color:red">*</span></label>
                    <!-- Admin searchable dropdown (create mode) -->
                    <ng-container *ngIf="!gatePassId(); else editBranch">
                        <div class="custom-dropdown" *ngIf="isAdmin(); else staffBranch" #dropdownRef>
                            <div class="dropdown-toggle" [class.placeholder]="branchName() === 'Select Branch'" (click)="toggleDropdown()">
                                {{ branchName() }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isBranchDropdownOpen()">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search..." [ngModel]="branchSearchTerm()" (ngModelChange)="branchSearchTerm.set($event)" name="branchSearchTerm" #searchInputRef (click)="$event.stopPropagation()">
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option" *ngFor="let b of searchableBranchList()" (click)="onBranchSelect(b)">
                                        {{ b.branch_name }}
                                    </div>
                                    <div class="dropdown-option no-results" *ngIf="searchableBranchList().length === 0">No results found</div>
                                </div>
                            </div>
                        </div>
                        <ng-template #staffBranch>
                            <input type="text" class="form-control readonly" [value]="branchName()" readonly>
                        </ng-template>
                    </ng-container>
                    <ng-template #editBranch>
                        <input type="text" class="form-control readonly" [value]="branchName()" readonly>
                    </ng-template>
                </div>
                <div class="form-col">
                    <label>Invoice No <span style="color:red">*</span>:</label>
                    <!-- In edit mode show as readonly text -->
                    <ng-container *ngIf="!gatePassId(); else editInvoice">
                        <div class="custom-dropdown" #invoiceDropdownRef>
                            <div class="dropdown-toggle" [class.placeholder]="!branchId() || invoiceNo() === ''" (click)="toggleInvoiceDropdown()">
                                {{ !branchId() ? 'Select Branch' : (invoiceNo() || '--Select--') }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isInvoiceDropdownOpen()">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search invoice..." [ngModel]="invoiceSearchTerm()" (ngModelChange)="invoiceSearchTerm.set($event)" name="invoiceSearchTerm" #invoiceSearchInputRef (click)="$event.stopPropagation()">
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option" *ngFor="let inv of searchableInvoiceList()" (click)="onInvoiceSelect(inv)">
                                        {{ inv.inv_no }}
                                    </div>
                                    <div class="dropdown-option no-results" *ngIf="searchableInvoiceList().length === 0">No results found</div>
                                </div>
                            </div>
                        </div>
                    </ng-container>
                    <ng-template #editInvoice>
                        <input type="text" class="form-control readonly" [value]="invoiceNo()" readonly>
                    </ng-template>
                </div>
                <div class="form-col">
                    <label>Chassis No:</label>
                    <input type="text" class="form-control readonly" [value]="chassisNo()" readonly>
                </div>
                <div class="form-col">
                    <label>Color:</label>
                    <input type="text" class="form-control readonly" [value]="color()" readonly>
                </div>
            </div>

            <!-- Row 2 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Gate Pass No: <span *ngIf="gatePassId()" style="color:red">*</span></label>
                    <input type="text" class="form-control readonly" [value]="gatePassNo()" readonly>
                </div>
                <div class="form-col">
                    <label>Customer Name: <span *ngIf="gatePassId()" style="color:red">*</span></label>
                    <input type="text" class="form-control readonly" [value]="customerName()" readonly>
                </div>
                <div class="form-col">
                     <label>Engine No:</label>
                     <input type="text" class="form-control readonly" [value]="engineNo()" readonly>
                </div>
                 <div class="form-col">
                     <label>Product Code:</label>
                     <input type="text" class="form-control readonly" [value]="productCode()" readonly>
                </div>
            </div>

             <!-- Row 3 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Gate Pass Date: <span *ngIf="gatePassId()" style="color:red">*</span></label>
                    <div class="date-input-wrapper">
                        <input type="date" class="form-control" [class.readonly]="!!gatePassId()" [ngModel]="passDate()" (ngModelChange)="passDate.set($event)" name="passDate" [readonly]="!!gatePassId()">
                    </div>
                </div>
                <div class="form-col">
                    <label>Address: <span *ngIf="gatePassId()" style="color:red">*</span></label>
                    <textarea class="form-control readonly" [ngModel]="address()" (ngModelChange)="address.set($event)" name="address" rows="1" readonly></textarea>
                </div>
                <div class="form-col">
                    <label>Vehicle:</label>
                    <input type="text" class="form-control readonly" [value]="vehicleModel()" readonly>
                </div>
                <div class="form-col">
                    <label>Selection Date:</label>
                    <div class="date-input-wrapper">
                         <input type="date" class="form-control" [ngModel]="selectionDate()" (ngModelChange)="selectionDate.set($event)" name="selectionDate">
                    </div>
                </div>
            </div>

            <!-- Row 4 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Issue Type:</label>
                    <input type="text" class="form-control" [ngModel]="issueType()" (ngModelChange)="issueType.set($event)" name="issueType">
                </div>
                <div class="form-col">
                      <!-- Empty -->
                </div>
                <div class="form-col">
                      <!-- Empty -->
                </div>
                <div class="form-col">
                      <!-- Empty -->
                </div>
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
        flex: 1;
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
        border-radius: 4px; /* Slight radius */
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

    .btn-save {
        background-color: #4caf50; /* Green */
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
    }

    .ledger-form {
        display: flex;
        flex-direction: column;
        gap: 20px; /* Space between rows */
    }

    .form-grid-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        align-items: start;
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
        padding: 6px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 100%;
        max-width: 180px; /* Limit input width to look like screenshot */
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
    }
    
    textarea.form-control {
        resize: none;
        height: 30px; 
    }

    .form-control.readonly {
        background-color: #e9ecef;
        color: #495057;
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

    /* Custom Dropdown Styles */
    .custom-dropdown {
        position: relative;
        width: 100%;
        max-width: 180px;
    }

    .dropdown-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background-color: #fff;
        cursor: pointer;
        min-height: 28px;
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
export class GatePassComponent implements OnInit {
  @ViewChild('dropdownRef') dropdownRef!: ElementRef;
  @ViewChild('searchInputRef') searchInputRef!: ElementRef;
  @ViewChild('invoiceDropdownRef') invoiceDropdownRef!: ElementRef;
  @ViewChild('invoiceSearchInputRef') invoiceSearchInputRef!: ElementRef;

  branchName = signal('SARATHY KOLLAM KTM');
  branchId = signal('');
  isAdmin = signal(false);
  branches = signal<any[]>([]);
  isBranchDropdownOpen = signal(false);
  branchSearchTerm = signal('');

  searchableBranchList = computed(() => {
    const term = this.branchSearchTerm().toLowerCase();
    return this.branches().filter(b =>
      (b.branch_name || '').toLowerCase().includes(term)
    );
  });

  isInvoiceDropdownOpen = signal(false);
  invoiceSearchTerm = signal('');
  searchableInvoiceList = computed(() => {
    const term = this.invoiceSearchTerm().toLowerCase();
    return this.invoiceOptions().filter(i =>
      (i.inv_no || '').toLowerCase().includes(term)
    );
  });

  gatePassNo = signal('');
  passDate = signal('');
  issueType = signal('');
  invoiceNo = signal('');
  gateInvoiceId = signal(0);
  invoiceOptions = signal<Array<{ inv_id: number; inv_no: string }>>([]);
  customerName = signal('');
  selectionDate = signal('');
  address = signal('');
  vehicleModel = signal('');
  chassisNo = signal('');
  engineNo = signal('');
  color = signal('');
  productCode = signal('');
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  gatePassId = signal<number | null>(null);

  constructor(private router: Router, private route: ActivatedRoute, private api: ApiService) { }

  toggleDropdown() {
    this.isBranchDropdownOpen.update(v => !v);
    if (this.isBranchDropdownOpen()) {
      this.branchSearchTerm.set('');
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.isBranchDropdownOpen.set(false);
    }
    if (this.invoiceDropdownRef && !this.invoiceDropdownRef.nativeElement.contains(event.target)) {
      this.isInvoiceDropdownOpen.set(false);
    }
  }

  onBranchSelect(branch: any) {
    this.branchId.set(branch.b_id.toString());
    this.branchName.set(branch.branch_name);
    this.isBranchDropdownOpen.set(false);
    this.loadNextGatePassNo();
    this.loadInvoiceOptions();
  }

  toggleInvoiceDropdown() {
    if (!this.branchId()) return;
    this.isInvoiceDropdownOpen.update(v => !v);
    if (this.isInvoiceDropdownOpen()) {
      this.invoiceSearchTerm.set('');
      setTimeout(() => this.invoiceSearchInputRef?.nativeElement.focus(), 0);
    }
  }

  onInvoiceSelect(inv: any) {
    this.invoiceNo.set(inv.inv_no);
    this.isInvoiceDropdownOpen.set(false);
    this.onInvoiceChange();
  }

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
    this.passDate.set(this.today());
    this.selectionDate.set(this.today());

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const passId = Number(idStr);
        this.gatePassId.set(passId);
        this.loadGatePassForEdit(passId);
      } else {
        this.loadNextGatePassNo();
        this.loadInvoiceOptions();
      }
    });
  }

  private loadGatePassForEdit(id: number) {
    this.api.getGatePass(id).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const d = res.data;
          const toLocalDate = (val: string) => {
            const dt = new Date(val);
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          };
          this.gatePassNo.set(d.gate_pass_no);
          if (d.gate_pass_date) this.passDate.set(toLocalDate(d.gate_pass_date));
          if (d.selection_date) this.selectionDate.set(toLocalDate(d.selection_date));
          
          this.branchId.set(d.gate_branch_id ? d.gate_branch_id.toString() : '');
          this.branchName.set(d.branch_name || '');
          this.gateInvoiceId.set(d.gate_invoice_id || 0);
          this.issueType.set(d.pass_issue_type || '');
          this.customerName.set(d.pass_cus_name || '');
          this.invoiceNo.set(d.pass_invoic_no || '');
          this.address.set(d.pass_cus_addrs || '');
          this.chassisNo.set(d.pass_chassis_no || '');
          this.engineNo.set(d.pass_engine_no || '');
          this.vehicleModel.set(d.pass_vehicle || '');
          this.color.set(d.pass_vehicle_color || '');
          this.productCode.set(d.pass_vehicle_code || '');

          this.loadInvoiceOptions();
        }
      }
    });
  }

  private loadBranches(): void {
    this.api.getBranches().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.branches.set(res.data);
        }
      }
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private loadNextGatePassNo(): void {
    if (!this.branchId()) return;
    this.gatePassNo.set('Fetching...');
    console.log(`[GatePass] Loading next gate pass number for branch: ${this.branchId()} (${this.branchName()})`);

    this.api.getGatePassNextNo(this.branchId(), this.branchName()).subscribe({
      next: (res: any) => {
        console.log('[GatePass] Next gate pass number response:', res);
        if (res?.success && res.gatePassNo) {
          this.gatePassNo.set(res.gatePassNo);
        } else {
          this.gatePassNo.set('Error');
        }
      },
      error: (err) => {
        console.error('[GatePass] Error loading next gate pass number:', err);
        this.gatePassNo.set('Error');
        this.errorMessage.set('Failed to load gate pass number');
      }
    });
  }

  private loadInvoiceOptions(): void {
    if (!this.branchId()) return;
    this.api.getGatePassInvoices(this.branchId()).subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.invoiceOptions.set(res.data);
        }
      },
      error: () => {
        this.invoiceOptions.set([]);
      }
    });
  }

  onInvoiceChange(): void {
    const no = this.invoiceNo().trim();
    const selected = this.invoiceOptions().find(i => i.inv_no === no);
    this.gateInvoiceId.set(selected?.inv_id || 0);

    if (!no) {
      this.customerName.set('');
      this.address.set('');
      this.chassisNo.set('');
      this.engineNo.set('');
      this.vehicleModel.set('');
      this.color.set('');
      this.productCode.set('');
      return;
    }

    this.api.getGatePassInvoiceDetails(no, this.branchId()).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const d = res.data;
          this.gateInvoiceId.set(d.inv_id || this.gateInvoiceId());
          this.customerName.set(d.customerName || '');
          this.address.set(d.address || '');
          this.chassisNo.set(d.chassisNo || '');
          this.engineNo.set(d.engineNo || '');
          this.vehicleModel.set(d.vehicleModel || '');
          this.color.set(d.color || '');
          this.productCode.set(d.productCode || '');
          if (d.selectionDate) {
            this.selectionDate.set(new Date(d.selectionDate).toISOString().slice(0, 10));
          }
        }
      },
      error: () => {
        this.errorMessage.set('Failed to load invoice details');
      }
    });
  }

  onSave(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    if (!this.gatePassNo()) {
      this.errorMessage.set('Gate pass number required');
      return;
    }

    if (!this.invoiceNo() || this.invoiceNo() === '--Select--') {
      alert('Invoice No. is a required field');
      this.errorMessage.set('Invoice No. is required');
      return;
    }

    const payload = {
      gatePassNo: this.gatePassNo(),
      branchId: this.branchId(),
      branchName: this.branchName(),
      gate_invoice_id: this.gateInvoiceId() || 0,
      gatePassDate: this.passDate() || this.today(),
      issueType: this.issueType(),
      customerName: this.customerName(),
      invoiceNo: this.invoiceNo(),
      address: this.address(),
      selectionDate: this.selectionDate() || this.passDate() || this.today(),
      chassisNo: this.chassisNo(),
      engineNo: this.engineNo(),
      vehicleModel: this.vehicleModel(),
      color: this.color(),
      productCode: this.productCode(),
      status: 1
    };

    const id = this.gatePassId();
    const action = id 
      ? this.api.updateGatePass(id, payload) 
      : this.api.saveGatePass(payload);

    this.isSaving.set(true);
    action.subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        if (res.success) {
          this.successMessage.set(id ? 'Gate pass updated' : 'Gate pass saved');
          if (!id) {
            this.loadNextGatePassNo();
          }
        } else {
          this.errorMessage.set(res.message || 'Save failed');
        }
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Server error');
      }
    });
  }

  navigate(path: string) { this.router.navigate([path]); }
}
