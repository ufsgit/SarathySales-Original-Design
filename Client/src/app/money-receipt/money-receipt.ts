import { Component, OnInit, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService, ApiResponse } from '../services/api.service';

@Component({
    selector: 'app-money-receipt',
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
        <span>Master Operation</span>
        <span> > </span>
        <span class="active">Money Receipt</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
          <div class="header-left">
             <h2>Money Receipt</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="navigate('/previous-money-receipt')">List Money Receipts</button>
             <button class="btn-save" (click)="onSave()" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save & Print' }}</button>
          </div>
        </header>

        <div class="page-card-content">
          <div *ngIf="successMessage()" style="color:green; padding:8px; margin-bottom:8px; border:1px solid green; border-radius:4px;">{{ successMessage() }}</div>
          <div *ngIf="errorMessage()" style="color:#c0392b; padding:8px; margin-bottom:8px; border:1px solid #c0392b; border-radius:4px;">{{ errorMessage() }}</div>
          <form class="ledger-form">
            
            <!-- Row 1 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Branch Name:</label>
                    <div class="custom-dropdown" *ngIf="isAdmin(); else staffBranch" #dropdownRef>
                        <div class="dropdown-toggle" (click)="toggleDropdown()" [class.placeholder]="branchName() === 'Select Branch'">
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
                </div>
                <div class="form-col">
                    <label>Name:</label>
                    <input type="text" class="form-control" [ngModel]="customerName()" (ngModelChange)="customerName.set($event)" name="customerName">
                </div>
                <div class="form-col">
                    <label>Pay Type:</label>
                    <select class="form-control" [ngModel]="payType()" (ngModelChange)="payType.set($event)" name="payType">
                        <option value="">--Select--</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="DD">DD</option>
                    </select>
                </div>
                <div class="form-col">
                    <label>Cheque/DD Date:</label>
                    <div class="date-input-wrapper">
                        <input type="date" class="form-control" [ngModel]="chequeDate()" (ngModelChange)="chequeDate.set($event)" name="chequeDate">
                    </div>
                </div>
            </div>

            <!-- Row 2 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Receipt No:</label>
                    <input type="text" class="form-control readonly" [value]="receiptNo()" readonly>
                </div>
                <div class="form-col">
                    <label>Customer Address:</label>
                    <textarea class="form-control" [ngModel]="address()" (ngModelChange)="address.set($event)" name="address" rows="1"></textarea>
                </div>
                <div class="form-col">
                    <label>Cheque/DD/P.O No:</label>
                    <input type="text" class="form-control" [ngModel]="chequeNo()" (ngModelChange)="chequeNo.set($event)" name="chequeNo">
                </div>
                <div class="form-col">
                    <label>Refund Y/N:</label>
                    <select class="form-control" [ngModel]="refundYN()" (ngModelChange)="refundYN.set($event)" name="refundYN">
                        <option value="">--Select--</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>
            </div>

             <!-- Row 3 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Receipt Date:</label>
                    <div class="date-input-wrapper">
                        <input type="text" class="form-control" [value]="receiptDate()" readonly>
                        <i class="fas fa-calendar-alt calendar-icon"></i>
                    </div>
                </div>
                <div class="form-col">
                    <label>Reason:</label>
                    <textarea class="form-control" [ngModel]="reason()" (ngModelChange)="reason.set($event)" name="reason" rows="1"></textarea>
                </div>
                <div class="form-col">
                    <label>Bank:</label>
                    <input type="text" class="form-control" [ngModel]="bank()" (ngModelChange)="bank.set($event)" name="bank">
                </div>
                <div class="form-col">
                    <label>Amount:</label>
                    <input type="number" class="form-control" [ngModel]="amount()" (ngModelChange)="amount.set($event)" name="amount">
                </div>
            </div>

            <!-- Row 4 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Reference:</label>
                    <input type="text" class="form-control" [ngModel]="reference()" (ngModelChange)="reference.set($event)" name="reference">
                </div>
                <div class="form-col">
                     <!-- Empty Spacer -->
                </div>
                <div class="form-col">
                    <label>Place:</label>
                    <input type="text" class="form-control" [ngModel]="place()" (ngModelChange)="place.set($event)" name="place">
                </div>
                <div class="form-col">
                     <!-- Empty Spacer -->
                </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  </main>
  
  <div style="height: 50px;"></div> <!-- Spacer before footer -->
  
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

    .orange-header-strip.admin-header {
        background: #1e3a8a;
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
        min-width: 80px; /* Ensure labels align somewhat */
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
        height: 30px; /* Single line height look for textarea */
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
    .calendar-icon {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
        pointer-events: none;
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
        .form-col {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
        }
        .form-col label {
            text-align: left;
        }
        .form-control {
            max-width: 100%;
        }
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
export class MoneyReceiptComponent {
    @ViewChild('dropdownRef') dropdownRef!: ElementRef;
    @ViewChild('searchInputRef') searchInputRef!: ElementRef;

    branchName = signal('SARATHY KOLLAM KTM');
    branchId = signal('');
    receiptNo = signal('');
    receiptDate = signal(new Date().toLocaleDateString('en-GB')); // dd/mm/yyyy

    // Admin Features
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

    toggleDropdown() {
        this.isBranchDropdownOpen.update(v => !v);
        if (this.isBranchDropdownOpen()) {
            this.branchSearchTerm.set('');
            setTimeout(() => {
                if (this.searchInputRef) {
                    this.searchInputRef.nativeElement.focus();
                }
            }, 0);
        }
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
            this.isBranchDropdownOpen.set(false);
        }
    }

    onBranchSelect(branch: any) {
        this.branchId.set(branch.b_id.toString());
        this.branchName.set(branch.branch_name);
        this.isBranchDropdownOpen.set(false);
        this.loadReceiptNo();
    }

    // Form Models
    customerName = signal('');
    payType = signal('');
    chequeDate = signal('');

    address = signal('');
    chequeNo = signal('');
    refundYN = signal('No');

    reason = signal('');
    bank = signal('');
    amount = signal<number | null>(null);

    reference = signal('');
    place = signal('');

    isLoading = signal(false);
    isSaving = signal(false);
    successMessage = signal('');
    errorMessage = signal('');

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
                    this.branchId.set((user.branch_id || '').toString());
                }
            } else {
                this.branchId.set((user.branch_id || '').toString());
            }
            this.branchName.set(bName);

            if (admin) {
                this.loadBranches();
            }
        }
        this.loadReceiptNo();
        // Set today's date
        this.receiptDate.set(new Date().toLocaleDateString('en-GB'));
    }

    loadBranches(): void {
        this.api.getBranches().subscribe({
            next: (res: any) => {
                if (res.success && Array.isArray(res.data)) {
                    this.branches.set(res.data);
                }
            }
        });
    }

    loadReceiptNo(): void {
        if (!this.branchId()) return;
        this.api.getMoneyReceiptNextNo(this.branchId()).subscribe({
            next: (res: any) => { if (res.success) this.receiptNo.set(res.receiptNo); },
            error: () => { this.receiptNo.set('ERROR'); }
        });
    }

    onSave(): void {
        if (!this.customerName() || !this.amount()) {
            this.errorMessage.set('Customer Name and Amount are required.');
            return;
        }
        this.isSaving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const today = new Date();
        const receiptDateISO = today.toISOString().split('T')[0];

        const payload = {
            receiptNo: this.receiptNo(),
            branchId: this.branchId(),
            receiptDate: receiptDateISO,
            reference: this.reference(),
            reason: this.reason(),
            payType: this.payType(),
            chequeDate: this.chequeDate() || null,
            chequeNo: this.chequeNo(),
            customerName: this.customerName(),
            address: this.address(),
            amount: this.amount(),
            bank: this.bank(),
            place: this.place(),
            refundStatus: this.refundYN()
        };

        this.api.saveMoneyReceipt(payload).subscribe({
            next: (res) => {
                this.isSaving.set(false);
                if (res.success) {
                    this.successMessage.set('Money receipt saved successfully!');
                    this.resetForm();
                    this.loadReceiptNo(); // Load next number
                }
            },
            error: (err) => {
                this.isSaving.set(false);
                this.errorMessage = err?.error?.message || 'Failed to save receipt.';
            }
        });
    }

    resetForm(): void {
        this.customerName.set('');
        this.payType.set('');
        this.chequeDate.set('');
        this.address.set('');
        this.chequeNo.set('');
        this.refundYN.set('No');
        this.reason.set('');
        this.bank.set('');
        this.amount.set(null);
        this.reference.set('');
        this.place.set('');
    }

    navigate(path: string) { this.router.navigate([path]); }
}
