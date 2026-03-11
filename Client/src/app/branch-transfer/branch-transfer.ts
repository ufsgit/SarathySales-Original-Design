import { Component, OnInit, signal, computed, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-branch-transfer',
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
        <span>Transactions</span>
        <span> > </span>
        <span class="active">Branch Transfer</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Branch Transfer</h2>
          </div>
          <div class="header-actions">
             <button class="btn-view" (click)="navigate('/previous-branch-transfer')">View</button>
             <button class="btn-save" (click)="onSave($event)" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save & Print' }}</button>
          </div>
        </header>

        <div class="page-card-content">
          <div *ngIf="successMessage()" style="margin-bottom:10px;color:#2e7d32;font-size:12px;">{{ successMessage() }}</div>
          <div *ngIf="errorMessage()" style="margin-bottom:10px;color:#d32f2f;font-size:12px;">{{ errorMessage() }}</div>
          <form class="ledger-form">
            <div class="form-cols-wrapper">
                
                <!-- Column 1 -->
                <div class="form-column">
                    <div class="form-group">
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
                                            *ngFor="let b of searchableBranchList()"
                                            (click)="onBranchSelect(b)">
                                            {{ b.branch_name }}
                                        </div>
                                        <div class="dropdown-option no-results"
                                            *ngIf="searchableBranchList().length === 0">
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
                    <div class="form-group">
                        <label>Debit Note No :</label>
                        <input type="text" class="form-control readonly" [value]="debitNoteNo()" readonly>
                    </div>
                    <div class="form-group">
                        <label>Debit Note Date :</label>
                        <div class="date-input-wrapper">
                          <input type="date" class="form-control" [ngModel]="transferDate()" (ngModelChange)="transferDate.set($event)" name="transferDate" [max]="todayIso">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Issue Type :</label>
                        <input type="text" class="form-control" [ngModel]="issueType()" (ngModelChange)="issueType.set($event)" name="issueType">
                    </div>
                </div>

                <!-- Column 2 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Institution:</label>
                        <div class="custom-dropdown" #institutionDropdownRef>
                            <div class="dropdown-toggle" [class.placeholder]="!institution()" (click)="toggleInstitutionDropdown()">
                                {{ getSelectedInstitutionName() || '--Select--' }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isInstitutionDropdownOpen()">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search institution..."
                                        [ngModel]="institutionSearchTerm()"
                                        (ngModelChange)="institutionSearchTerm.set($event)"
                                        name="institutionSearch" #institutionSearchInput
                                        (click)="$event.stopPropagation()">
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option"
                                        *ngFor="let b of searchableInstitutionList()"
                                        (click)="onInstitutionSelect(b)">
                                        {{ b.branch_name }} | {{ b.branch_address }}
                                    </div>
                                    <div class="dropdown-option no-results"
                                        *ngIf="searchableInstitutionList().length === 0">
                                        No institutions found
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Customer Name:</label>
                        <input type="text" class="form-control" [ngModel]="customerName()" (ngModelChange)="customerName.set($event)" name="customerName">
                    </div>
                     <div class="form-group" style="align-items: flex-start;">
                        <label style="margin-top: 5px;">Address:</label>
                        <textarea class="form-control" [ngModel]="address()" (ngModelChange)="address.set($event)" name="address" rows="3"></textarea>
                    </div>
                </div>

                <!-- Column 3 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Chassis No:</label>
                        <div class="custom-dropdown" #chassisDropdownRef>
                            <div class="dropdown-toggle" [class.placeholder]="!chassisNo()" (click)="toggleChassisDropdown()">
                                {{ chassisNo() || '--Select--' }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isChassisDropdownOpen()">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search chassis..."
                                        [ngModel]="chassisSearchTerm()"
                                        (ngModelChange)="chassisSearchTerm.set($event)"
                                        name="chassisSearch" #chassisSearchInput
                                        (click)="$event.stopPropagation()">
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option"
                                        *ngFor="let s of searchableChassisList()"
                                        (click)="onChassisSelect(s)">
                                        {{ s.chassis_no }}
                                    </div>
                                    <div class="dropdown-option no-results"
                                        *ngIf="searchableChassisList().length === 0">
                                        No chassis found
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Engine No:</label>
                        <input type="text" class="form-control readonly" [ngModel]="engineNo()" name="engineNo" readonly>
                    </div>
                    <div class="form-group">
                        <label>Vehicle:</label>
                        <input type="text" class="form-control readonly" [ngModel]="vehicle()" name="vehicle" readonly>
                    </div>
                    <div class="form-group">
                        <label>Color:</label>
                        <input type="text" class="form-control readonly" [ngModel]="color()" name="color" readonly>
                    </div>
                    <div class="form-group">
                        <label>P.Code:</label>
                        <input type="text" class="form-control readonly" [ngModel]="pCode()" name="pCode" readonly>
                    </div>
                </div>

            </div>

             <!-- Total Amount Section -->
             <div class="total-payable-section">
                <span>Total Amount : Rs <span class="amount-val">{{ totalAmountDisplay() }}</span></span>
             </div>

             <!-- Save & Print Button Row (Right Aligned) -->
             <div class="action-row-right">
                <button class="btn-save" (click)="onSave($event)" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save & Print' }}</button>
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

    .btn-view {
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
        gap: 15px;
    }
    
    .form-cols-wrapper {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px; 
        align-items: start;
    }

    .form-column {
        display: flex;
        flex-direction: column;
        gap: 12px; 
    }

    .form-group {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .form-group label {
        font-size: 12px;
        color: #333;
        white-space: nowrap;
        text-align: right;
        min-width: 90px; 
        font-weight: 400;
    }

    .form-control {
        flex: 1; /* Input takes remaining space */
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 100%;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        height: 28px;
    }
    
    textarea.form-control {
        resize: none;
        height: auto; 
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
        width: 100%;
    }
    .date-input-wrapper .form-control {
        width: 100%;
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


    /* Total Payable Display */
    .total-payable-section {
        background: #fff;
        padding: 10px;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-top: 20px;
        text-align: center;
    }
    .amount-val {
        color: #666; 
    }

    .action-row-right {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
        background: #fcfcfc;
        padding: 10px;
    }


    /* Custom Dropdown Styles */
    .custom-dropdown {
        position: relative;
        width: 100%;
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
export class BranchTransferComponent implements OnInit, AfterViewInit {
  branchName = signal('SARATHY KOLLAM KTM');
  branchId = signal('');
  isAdmin = signal(false);
  branches = signal<any[]>([]);
  isBranchDropdownOpen = signal(false);
  branchSearchTerm = signal('');

  isInstitutionDropdownOpen = signal(false);
  institutionSearchTerm = signal('');

  isChassisDropdownOpen = signal(false);
  chassisSearchTerm = signal('');

  searchableBranchList = computed(() => {
    const term = this.branchSearchTerm().toLowerCase();
    const instId = this.institution().toString().trim();
    return this.branches().filter(b => {
      const match = (b.branch_name || '').toLowerCase().includes(term);
      const isSelectedInOther = instId && String(b.b_id) === instId;
      return match && !isSelectedInOther;
    });
  });

  searchableInstitutionList = computed(() => {
    const term = this.institutionSearchTerm().toLowerCase();
    const brId = this.branchId().toString().trim();
    return this.institutionOptions().filter(b => {
      const match = (b.branch_name || '').toLowerCase().includes(term) ||
        (b.branch_address || '').toLowerCase().includes(term);
      const isSelectedInOther = brId && String(b.b_id) === brId;
      return match && !isSelectedInOther;
    });
  }, { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) });

  searchableChassisList = computed(() => {
    const term = this.chassisSearchTerm().toLowerCase();
    return this.chassisOptions().filter(s =>
      (s.chassis_no || '').toLowerCase().includes(term)
    );
  });

  debitNoteNo = signal('');
  transferDate = signal('');
  issueType = signal('');
  institution = signal('');
  customerName = signal('');
  address = signal('');
  chassisNo = signal('');
  engineNo = signal('');
  vehicle = signal('');
  color = signal('');
  pCode = signal('');

  institutionOptions = signal<Array<{ b_id: number; branch_name: string; branch_address: string }>>([]);
  chassisOptions = signal<Array<{ chassis_no: string; engine_no: string; vehicle: string; color: string; p_code: string; amount: number }>>([]);

  totalAmountDisplay = signal('00.00');
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  private quoteNoRetryDone = false;
  readonly todayIso = new Date().toISOString().slice(0, 10);

  @ViewChild('branchDropdownRef') branchDropdownRef!: ElementRef;
  @ViewChild('branchSearchInput') branchSearchInput!: ElementRef;
  @ViewChild('institutionDropdownRef') institutionDropdownRef!: ElementRef;
  @ViewChild('institutionSearchInput') institutionSearchInput!: ElementRef;
  @ViewChild('chassisDropdownRef') chassisDropdownRef!: ElementRef;
  @ViewChild('chassisSearchInput') chassisSearchInput!: ElementRef;

  constructor(private router: Router, private api: ApiService) { }

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

  toggleInstitutionDropdown() {
    this.isInstitutionDropdownOpen.update(v => !v);
    if (this.isInstitutionDropdownOpen()) {
      this.institutionSearchTerm.set('');
      setTimeout(() => this.institutionSearchInput?.nativeElement.focus(), 0);
    }
  }

  toggleChassisDropdown() {
    this.isChassisDropdownOpen.update(v => !v);
    if (this.isChassisDropdownOpen()) {
      this.chassisSearchTerm.set('');
      setTimeout(() => this.chassisSearchInput?.nativeElement.focus(), 0);
    }
  }

  onInstitutionSelect(branch: any) {
    this.onInstitutionChange(branch.b_id);
    this.isInstitutionDropdownOpen.set(false);
  }

  onChassisSelect(chassis: any) {
    this.onChassisChange(chassis.chassis_no);
    this.isChassisDropdownOpen.set(false);
  }

  getSelectedInstitutionName(): string {
    const id = parseInt((this.institution() || '').toString(), 10) || 0;
    const selected = this.institutionOptions().find(b => b.b_id === id);
    return selected ? selected.branch_name : '';
  }

  onBranchSelect(branch: any) {
    this.branchId.set(branch.b_id.toString());
    this.branchName.set(branch.branch_name);
    this.isBranchDropdownOpen.set(false);
    this.loadNextTransferNo();
    this.loadChassisOptions();
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
    this.transferDate.set(this.todayIso);
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    this.enforceMaxDate();
    setTimeout(() => this.enforceMaxDate(), 500);
  }

  private enforceMaxDate(): void {
    const dateInput = document.querySelector('input[name="transferDate"]') as HTMLInputElement | null;
    if (dateInput) {
      dateInput.max = this.todayIso;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.branchDropdownRef && !this.branchDropdownRef.nativeElement.contains(event.target)) {
      this.isBranchDropdownOpen.set(false);
    }
    if (this.institutionDropdownRef && !this.institutionDropdownRef.nativeElement.contains(event.target)) {
      this.isInstitutionDropdownOpen.set(false);
    }
    if (this.chassisDropdownRef && !this.chassisDropdownRef.nativeElement.contains(event.target)) {
      this.isChassisDropdownOpen.set(false);
    }
  }

  private loadInitialData(): void {
    this.loadNextTransferNo();
    this.api.getBranches().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          const mapped = res.data.map((b: any) => ({
            b_id: parseInt(b.b_id, 10) || 0,
            branch_name: (b.branch_name || '').toString().trim(),
            branch_address: (b.branch_address || '').toString().trim()
          }));
          this.institutionOptions.set(mapped);

          if (!this.isAdmin() && !this.branchId()) {
            const own = mapped.find(
              (b: any) => (b.branch_name || '').toLowerCase() === (this.branchName() || '').toLowerCase()
            );
            const fallback = own || mapped[0];
            this.branchId.set(String(fallback?.b_id || ''));
            if (fallback?.branch_name) this.branchName.set(fallback.branch_name);
          }
          this.loadNextTransferNo();
          this.loadChassisOptions();
        }
      }
    });
  }

  onInstitutionChange(idValue: any): void {
    const id = parseInt((idValue || '').toString(), 10) || 0;
    this.institution.set(idValue);
    const selected = this.institutionOptions().find(b => b.b_id === id);
    this.address.set(selected?.branch_address || '');
    if (!id) {
      this.customerName.set('');
      return;
    }
    this.api.getBranchTransferInstitutionName(id, this.branchId() || undefined).subscribe({
      next: (res: any) => {
        const name = (res?.name || '').toString().trim();
        this.customerName.set(name || selected?.branch_name || '');
      },
      error: () => {
        this.customerName.set(selected?.branch_name || '');
      }
    });
  }

  onChassisChange(no: any): void {
    this.chassisNo.set(no);
    const selected = this.chassisOptions().find(s => s.chassis_no === (no || '').toString());
    this.engineNo.set(selected?.engine_no || '');
    this.vehicle.set(selected?.vehicle || '');
    this.color.set(selected?.color || '');
    this.pCode.set(selected?.p_code || '');
    this.totalAmountDisplay.set((selected?.amount || 0).toFixed(2));
  }

  private loadChassisOptions(): void {
    const bid = (this.branchId() || '').trim();
    if (!bid || bid === 'Select Branch') {
      this.chassisOptions.set([]);
      return;
    }

    this.api.getAvailableStockForTransfer(bid).subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.chassisOptions.set(res.data.map((r: any) => ({
            chassis_no: (r.stock_chassis_no || r.chassis_no || '').toString().trim(),
            engine_no: (r.stock_engine_no || r.engine_no || '').toString().trim(),
            vehicle: (r.sr_model || r.stock_model || r.materialName || r.vehicle || '').toString().trim(),
            color: (r.stock_colour || r.stock_color || r.color_name || r.color || '').toString().trim(),
            p_code: (r.stock_type || r.stock_prd_code || r.materialsId || r.p_code || r.stock_product_code || '').toString().trim(),
            amount: Number((r.lc_rate ?? r.total_bill_amount ?? r.purc_grand_total ?? r.rate ?? r.amount ?? 0).toString().replace(/,/g, '')) || 0
          })).filter((x: any) => x.chassis_no));
        } else {
          this.chassisOptions.set([]);
        }
      },
      error: () => this.chassisOptions.set([])
    });
  }

  private loadNextTransferNo(): void {
    if (!this.branchId()) return;
    this.api.getBranchTransferNextNo(this.branchId()).subscribe({
      next: (res: any) => {
        const no = (res?.transferNo || res?.data?.transferNo || '').toString().trim();
        if (no) {
          this.debitNoteNo.set(no);
          this.quoteNoRetryDone = false;
        } else {
          this.loadNextTransferNoFromList();
          if (!this.quoteNoRetryDone) {
            this.quoteNoRetryDone = true;
            setTimeout(() => this.loadNextTransferNo(), 300);
          }
        }
      },
      error: () => {
        this.loadNextTransferNoFromList();
        if (!this.quoteNoRetryDone) {
          this.quoteNoRetryDone = true;
          setTimeout(() => this.loadNextTransferNo(), 300);
        }
      }
    });
  }

  private padSerial(n: number): string {
    return String(Math.max(1, n)).padStart(5, '0');
  }

  private buildLocalNextTransferNo(rows: any[] = []): string {
    const bId = (this.branchId() || '').toString().trim();
    if (!bId) return '';
    const year = new Date().getFullYear().toString();
    const prefix = `BT${year}${bId}`;
    let maxSerial = 0;

    for (const r of rows) {
      const no = (r?.debit_note_no || r?.transferNo || '').toString().trim();
      if (!no.startsWith(prefix)) continue;
      const serial = parseInt(no.slice(-5), 10);
      if (Number.isFinite(serial) && serial > maxSerial) maxSerial = serial;
    }
    return `${prefix}${this.padSerial(maxSerial + 1)}`;
  }

  private loadNextTransferNoFromList(): void {
    if (!this.branchId()) return;
    this.api.listBranchTransfers(1, 5000, '', this.branchId()).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        const local = this.buildLocalNextTransferNo(rows);
        if (local) this.debitNoteNo.set(local);
      }
    });
  }

  onSave(event?: Event): void {
    event?.preventDefault();
    this.errorMessage.set('');
    this.successMessage.set('');
    if (this.isSaving()) return;

    if (!this.branchId()) {
      this.errorMessage.set('Branch missing. Please login again.');
      alert(this.errorMessage());
      return;
    }
    if (!this.debitNoteNo()) {
      this.errorMessage.set('Debit Note No not generated.');
      alert(this.errorMessage());
      return;
    }
    if (!this.institution()) {
      this.errorMessage.set('Please select Institution.');
      alert(this.errorMessage());
      return;
    }
    if (!this.chassisNo()) {
      this.errorMessage.set('Please select Chassis No.');
      alert(this.errorMessage());
      return;
    }

    if (this.transferDate() > this.todayIso) {
      this.errorMessage.set('Future dates are not allowed.');
      alert(this.errorMessage());
      return;
    }

    const toBranchId = parseInt((this.institution() || '').toString(), 10);
    const toBranch = this.institutionOptions().find(b => b.b_id === toBranchId);

    const payload = {
      transferNo: (this.debitNoteNo() || '').toString().trim(),
      fromBranchId: this.branchId(),
      toBranchId,
      transferDate: this.transferDate(),
      issueType: (this.issueType() || '').toString().trim(),
      institutionName: (toBranch?.branch_name || this.customerName() || '').toString().trim(),
      institutionAddress: (this.address() || toBranch?.branch_address || '').toString().trim(),
      items: [{
        chassisNo: (this.chassisNo() || '').toString().trim(),
        engineNo: (this.engineNo() || '').toString().trim(),
        model: (this.vehicle() || '').toString().trim(),
        colour: (this.color() || '').toString().trim(),
        pCode: (this.pCode() || '').toString().trim(),
        amount: Number(this.totalAmountDisplay() || 0) || 0
      }]
    };

    this.isSaving.set(true);
    this.api.saveBranchTransfer(payload).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        if (res?.success) {
          this.successMessage.set('Branch transfer saved');
          alert(this.successMessage());
          this.resetFormAfterSave();
          this.loadNextTransferNo();
          this.loadChassisOptions();
        } else {
          this.errorMessage.set(res?.message || 'Save failed');
          alert(this.errorMessage());
        }
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message || 'Server error');
        alert(this.errorMessage());
      }
    });
  }

  private resetFormAfterSave(): void {
    this.chassisNo.set('');
    this.engineNo.set('');
    this.vehicle.set('');
    this.color.set('');
    this.pCode.set('');
    this.totalAmountDisplay.set('00.00');
    this.issueType.set('');
    this.customerName.set('');
    this.address.set('');
    this.institution.set('');
  }

  navigate(path: string) { this.router.navigate([path]); }
}
