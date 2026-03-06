import { Component, OnInit, ElementRef, ViewChild, HostListener, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-sales-invoice',
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
        <span>Transaction</span>
        <span> > </span>
        <span class="active">Sales Invoice</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Sales Invoice</h2>
          </div>
          <div class="header-actions">
             <button class="btn-view" (click)="navigate('/previous-sales-invoice')">View</button>
             <button class="btn-save" (click)="saveInvoice($event)" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save & Print' }}</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="ledger-form">
            <div class="form-cols-wrapper">
                
                <!-- Column 1 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Branch Name:</label>
                        <input type="text" class="form-control readonly" [value]="branchName()" readonly>
                    </div>
                    <div class="form-group">
                        <label>Invoice No :</label>
                        <input type="text" class="form-control readonly" [value]="invoiceNo()" readonly>
                    </div>
                    <div class="form-group">
                        <label>Invoice Date :</label>
                        <input type="text" class="form-control" [ngModel]="invoiceDate()" (ngModelChange)="invoiceDate.set($event)" name="invoiceDate">
                    </div>
                    <div class="form-group">
                        <label>Issue Type :</label>
                        <select class="form-control" [ngModel]="issueType()" (ngModelChange)="issueType.set($event); onIssueTypeChange()" name="issueType">
                            <option value="">--Select--</option>
                            <option value="01">01</option>
                            <option value="02">02</option>
                        </select>
                    </div>
                    <div class="form-group" *ngIf="issueType() === '01'">
                        <label>Customer Name:</label>
                        <input type="text" class="form-control" [ngModel]="customerNameManual()" (ngModelChange)="customerNameManual.set($event)" name="customerNameManual">
                    </div>
                    <div class="form-group" *ngIf="issueType() === '02'">
                        <label>Customer Name:</label>
                        <select class="form-control" [ngModel]="customerBranchId()" (ngModelChange)="customerBranchId.set($event); onCustomerBranchChange()" name="customerBranchId">
                            <option value="">--Select--</option>
                            <option *ngFor="let b of branchOptions()" [value]="b.b_id">
                                {{ b.branch_name }} | {{ b.branch_address }} | {{ b.branch_gstin }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Father/Husband:</label>
                        <input type="text" class="form-control" [ngModel]="guardian()" (ngModelChange)="guardian.set($event)" name="guardian">
                    </div>
                    <div class="form-group" style="align-items: flex-start;">
                        <label style="margin-top: 5px;">Address:</label>
                        <textarea class="form-control" [ngModel]="address()" (ngModelChange)="address.set($event)" name="address" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Pin Code:</label>
                        <input type="text" class="form-control" [ngModel]="pincode()" (ngModelChange)="pincode.set($event)" name="pincode">
                    </div>
                     <div class="form-group">
                        <label>GSTIN:</label>
                        <input type="text" class="form-control" [ngModel]="gstin()" (ngModelChange)="gstin.set($event)" name="gstin">
                    </div>
                </div>

                <!-- Column 2 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Mobile No :</label>
                        <input type="text" class="form-control" [ngModel]="mobileNo()" (ngModelChange)="mobileNo.set($event)" name="mobileNo">
                    </div>
                    <div class="form-group">
                        <label>Age :</label>
                        <input type="text" class="form-control" [ngModel]="age()" (ngModelChange)="age.set($event)" name="age">
                    </div>
                    <div class="form-group">
                        <label>CDMS No:</label>
                        <input type="text" class="form-control" [ngModel]="cdmsNo()" (ngModelChange)="cdmsNo.set($event)" name="cdmsNo">
                    </div>
                    <div class="form-group">
                        <label>Area:</label>
                        <input type="text" class="form-control" [ngModel]="area()" (ngModelChange)="area.set($event)" name="area">
                    </div>
                    <div class="form-group">
                        <label>Hypothication:</label>
                        <select class="form-control" [ngModel]="hypothication()" (ngModelChange)="hypothication.set($event); onHypothecationChange()" name="hypothication">
                            <option value="">--Select--</option>
                            <option *ngFor="let h of currentHypothecationOptions()" [value]="h.value">{{ h.label }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Place:</label>
                        <input type="text" class="form-control" [ngModel]="place()" (ngModelChange)="place.set($event)" name="place">
                    </div>
                    <div class="form-group">
                        <label>Receipt No:</label>
                        <input type="text" class="form-control" [ngModel]="receiptNo()" (ngModelChange)="receiptNo.set($event)" name="receiptNo">
                    </div>
                    <div class="form-group">
                        <label>Registration:</label>
                        <input type="text" class="form-control" [ngModel]="registration()" (ngModelChange)="registration.set($event)" name="registration">
                    </div>
                     <div class="form-group">
                        <label>Finance Dues:</label>
                        <input type="text" class="form-control" [ngModel]="financeDues()" (ngModelChange)="financeDues.set($event)" name="financeDues">
                    </div>
                     <div class="form-group">
                        <label>Executive Name:</label>
                         <select class="form-control" [ngModel]="executive()" (ngModelChange)="executive.set($event); onExecutiveChange()" name="executive">
                            <option value="">--select--</option>
                            <option *ngFor="let ex of currentExecutiveOptions()" [value]="ex.value">{{ ex.label }}</option>
                        </select>
                    </div>
                </div>

                <!-- Column 3 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Chassis No:</label>
                        <div class="custom-dropdown" #dropdownRef>
                            <div class="dropdown-toggle" (click)="toggleDropdown()">
                                {{ chassisNo() || '--Select--' }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isDropdownOpen()">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search..." [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" name="searchTerm" #searchInputRef (click)="$event.stopPropagation()">
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option" (click)="selectChassis('')">--Select--</div>
                                    <div class="dropdown-option" *ngFor="let row of searchableChassisList()" (click)="selectChassis(row)">
                                        {{ row.inv_chassis }}
                                    </div>
                                    <div class="dropdown-option no-results" *ngIf="searchableChassisList().length === 0">No results found</div>
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
                    <div class="form-group">
                        <label>HSN.Code:</label>
                        <input type="text" class="form-control readonly" [ngModel]="hsnCode()" name="hsnCode" readonly>
                    </div>
                    <div class="form-group">
                        <label>Basic Amount:</label>
                        <input type="number" class="form-control readonly" [ngModel]="basicAmount()" name="basicAmount" value="00.00" readonly>
                    </div>
                    <div class="form-group">
                        <label>Discount Amount:</label>
                        <input type="number" class="form-control" [ngModel]="discountAmount()" (ngModelChange)="discountAmount.set($event); recalculateTotalAmount()" name="discountAmount" value="00.00">
                    </div>
                    <div class="form-group">
                        <label>Taxable Amount:</label>
                        <input type="number" class="form-control readonly" [ngModel]="taxableAmount()" name="taxableAmount" value="00.00" readonly>
                    </div>
                    <div class="form-group">
                        <label>SGST(9%):</label>
                        <input type="number" class="form-control readonly" [ngModel]="sgst()" name="sgst" value="00.00" readonly>
                    </div>
                    <div class="form-group">
                        <label>CGST(9%):</label>
                        <input type="number" class="form-control readonly" [ngModel]="cgst()" name="cgst" value="00.00" readonly>
                    </div>
                    <div class="form-group">
                        <label>CESS:</label>
                        <input type="number" class="form-control readonly" [ngModel]="cess()" name="cess" value="00.00" readonly>
                    </div>
                </div>

            </div>

             <!-- Total Payable Section -->
             <div class="total-payable-section">
                <span>Total Amount : Rs <span class="amount-val">{{ totalAmountDisplay() }}</span></span>
             </div>

             <!-- Save & Print Button Row (Right Aligned) -->
             <div class="action-row-right">
                <button class="btn-save" (click)="saveInvoice($event)" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save & Print' }}</button>
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
        background-color: #d32f2f; /* Red for View in this specific screenshot */
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
        gap: 30px; /* Space between the layout columns */
        align-items: start;
    }

    .form-column {
        display: flex;
        flex-direction: column;
        gap: 12px; /* Space between fields vertical */
    }

    .form-group {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .form-group label {
        font-size: 11px;
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

    /* Total Payable Display */
    .total-payable-section {
        background: #fff; /* White background in this design */
        padding: 10px;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-top: 10px;
        text-align: center; /* Centered based on screenshot look */
    }
    .amount-val {
        color: #666; 
    }

    .action-row-right {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 20px;
        margin-right: 20px;
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

    /* Responsive */
    @media (max-width: 1200px) {
        .form-cols-wrapper {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 768px) {
        .form-cols-wrapper {
            grid-template-columns: 1fr;
        }
        .form-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
        }
        .form-group label {
            text-align: left;
        }
    }
  `]
})
export class SalesInvoiceComponent implements OnInit {
    @ViewChild('dropdownRef') dropdownRef!: ElementRef;
    @ViewChild('searchInputRef') searchInputRef!: ElementRef;

    isDropdownOpen = signal(false);
    searchTerm = signal('');

    searchableChassisList = computed(() => {
        const term = this.searchTerm().toLowerCase();
        return this.filteredChassisOptions().filter((c: any) =>
            (c.inv_chassis || '').toString().toLowerCase().includes(term)
        );
    });

    toggleDropdown() {
        this.isDropdownOpen.update(v => !v);
        if (this.isDropdownOpen()) {
            this.searchTerm.set('');
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
            this.isDropdownOpen.set(false);
        }
    }

    selectChassis(row: any) {
        if (!row) {
            this.chassisNo.set('');
        } else {
            this.chassisNo.set(row.inv_chassis);
        }
        this.isDropdownOpen.set(false);
        this.onChassisChange();
    }

    branchName = signal('');
    invoiceNo = signal('');
    invoiceDate = signal('');

    issueType = signal('');
    customerNameManual = signal('');
    customerBranchId = signal('');
    branchOptions = signal<any[]>([]);
    guardian = signal('');
    address = signal('');
    pincode = signal('');
    gstin = signal('');

    mobileNo = signal('');
    age = signal('');
    cdmsNo = signal('');
    area = signal('');
    hypothication = signal('');
    place = signal('');
    receiptNo = signal('');
    registration = signal('');
    financeDues = signal('');
    executive = signal('');
    executiveOptions = signal<Array<{ value: string; label: string }>>([]);
    hypothecationOptions = signal<Array<{ value: string; label: string }>>([]);
    issueType02ExecutiveOptions = signal<Array<{ value: string; label: string }>>([]);
    issueType02HypothecationOptions = signal<Array<{ value: string; label: string }>>([]);

    chassisNo = signal('');
    engineNo = signal('');
    vehicle = signal('');
    color = signal('');
    pCode = signal('');
    hsnCode = signal('');
    basicAmount = signal(0);
    discountAmount = signal(0);
    taxableAmount = signal(0);
    sgst = signal(0);
    cgst = signal(0);
    cess = signal(0);
    selectedInvTotal = signal(0);
    chassisOptions = signal<any[]>([]);
    filteredChassisOptions = signal<any[]>([]);
    isSaving = signal(false);
    defaultBranchId = signal('');
    private chassisIndex = new Map<string, any>();

    totalAmountDisplay = computed(() => {
        if (this.selectedInvTotal() > 0) {
            return this.selectedInvTotal().toFixed(2);
        }
        const basic = this.toAmount(this.basicAmount());
        const disc = this.toAmount(this.discountAmount());
        const taxable = this.toAmount(this.taxableAmount());
        const sgst = this.toAmount(this.sgst());
        const cgst = this.toAmount(this.cgst());
        const cess = this.toAmount(this.cess());

        const taxableBase = taxable > 0 ? taxable : Math.max(0, basic - disc);
        const total = taxableBase + sgst + cgst + cess;
        return Math.max(0, total).toFixed(2);
    });

    constructor(private router: Router, private api: ApiService) { }

    ngOnInit(): void {
        this.invoiceDate.set(this.formatTodayDate());
        this.loadHypothecationOptions();
        const user = this.api.getCurrentUser();
        const loginBranchId = (user?.branch_id ?? '').toString().trim();
        if (user?.branch_name) {
            this.branchName.set(user.branch_name);
        }

        this.api.getBranches().subscribe({
            next: (res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    const mapped = res.data.map((b: any) => ({
                        b_id: parseInt(b.b_id, 10) || 0,
                        branch_id: (b.branch_id || '').toString().trim(),
                        branch_name: (b.branch_name || '').toString().trim(),
                        branch_address: (b.branch_address || '').toString(),
                        branch_ph: (b.branch_ph || '').toString().trim(),
                        branch_pin: (b.branch_pin || '').toString().trim(),
                        branch_gstin: (b.branch_gstin || '').toString().trim(),
                        branch_email: (b.branch_email || '').toString().trim(),
                        branch_location: (b.branch_location || '').toString().trim(),
                        branch_prefix: (b.branch_prefix || '').toString().trim()
                    }));
                    this.branchOptions.set(mapped);

                    const ownBranch = mapped.find(
                        (b: any) => String(b.b_id) === loginBranchId || (b.branch_name || '').toLowerCase().trim() === (this.branchName() || '').toLowerCase().trim()
                    );
                    const bid = String(ownBranch?.b_id || mapped[0]?.b_id || '');
                    this.defaultBranchId.set(bid);
                    this.loadNextInvoiceNo(bid);
                    this.refreshIssueType02Filters();
                }
            }
        });

        this.api.getSalesInvoiceExecutives(this.branchName()).subscribe({
            next: (res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    const mapped = res.data.map((ex: any) => {
                        const firstName = (ex.e_first_name || '').toString().trim();
                        const code = (ex.e_code || ex.emp_id || '').toString().trim();
                        return {
                            value: code,
                            label: `${firstName}[${code}]`
                        };
                    }).filter((x: any) => x.value && x.label && !x.label.startsWith('['));
                    this.executiveOptions.set(mapped);
                } else {
                    this.executiveOptions.set([]);
                }
                this.refreshIssueType02Filters();
            },
            error: () => {
                this.executiveOptions.set([]);
                this.refreshIssueType02Filters();
            }
        });

        this.api.getProformaChassisRecords(loginBranchId || undefined).subscribe({
            next: (res: any) => {
                const data = res?.success && Array.isArray(res.data) ? res.data : [];
                this.chassisOptions.set(data);
                this.buildChassisIndex();
                this.refreshIssueType02Filters();
            },
            error: () => {
                this.chassisOptions.set([]);
                this.chassisIndex.clear();
                this.refreshIssueType02Filters();
            }
        });
    }

    private loadNextInvoiceNo(branchId?: string): void {
        const bid = (branchId || this.defaultBranchId() || '').toString();
        if (!bid) return;
        this.api.getSalesInvoiceNextNo(bid).subscribe({
            next: (res: any) => {
                const nextNo = (res?.invoiceNo || '').toString().trim();
                if (nextNo) this.invoiceNo.set(nextNo);
            }
        });
    }

    private loadHypothecationOptions(): void {
        this.api.getSalesInvoiceHypothecationOptions().subscribe({
            next: (res: any) => {
                const rows = Array.isArray(res?.data) ? res.data : [];
                const mapped = rows
                    .map((r: any) => (r?.icompany_name || '').toString().trim())
                    .filter((v: string) => !!v)
                    .map((v: string) => ({ value: v, label: v }));
                this.hypothecationOptions.set(mapped);
                this.refreshIssueType02Filters();
            },
            error: () => {
                this.hypothecationOptions.set([]);
                this.refreshIssueType02Filters();
            }
        });
    }

    onIssueTypeChange(): void {
        if (this.issueType() !== '02') {
            this.customerBranchId.set('');
        }
        if (this.issueType() !== '01') {
            this.customerNameManual.set('');
        }
        this.refreshIssueType02Filters();
    }

    onCustomerBranchChange(): void {
        const id = parseInt((this.customerBranchId() || '').toString(), 10) || 0;
        const selected = this.branchOptions().find(b => b.b_id === id);
        this.address.set(selected?.branch_address || '');
        this.mobileNo.set(selected?.branch_ph || this.mobileNo());
        this.pincode.set(selected?.branch_pin || this.pincode());
        this.gstin.set(selected?.branch_gstin || '');
        this.place.set(selected?.branch_location || this.place());
        this.refreshIssueType02Filters();
    }

    onHypothecationChange(): void {
        this.refreshIssueType02Filters();
    }

    onExecutiveChange(): void {
        this.refreshIssueType02Filters();
    }

    currentHypothecationOptions = computed(() => {
        if (this.issueType() === '02') {
            return this.issueType02HypothecationOptions().length ? this.issueType02HypothecationOptions() : this.hypothecationOptions();
        }
        return this.hypothecationOptions();
    });

    currentExecutiveOptions = computed(() => {
        if (this.issueType() === '02') {
            return this.issueType02ExecutiveOptions().length ? this.issueType02ExecutiveOptions() : this.executiveOptions();
        }
        return this.executiveOptions();
    });

    private refreshIssueType02Filters(): void {
        if (this.issueType() !== '02') {
            this.filteredChassisOptions.set([...this.chassisOptions()]);
            this.issueType02HypothecationOptions.set([]);
            this.issueType02ExecutiveOptions.set([]);
            return;
        }

        const text = (v: any) => (v ?? '').toString().trim();
        const normalize = (v: any) => text(v).toLowerCase().replace(/\s+/g, ' ');
        const customerName = text(this.branchOptions().find(b => String(b.b_id) === String(this.customerBranchId()))?.branch_name);

        const rowsAll = [...this.chassisOptions()];

        let rows = [...rowsAll];

        if (customerName) {
            const customerNameN = normalize(customerName);
            const byCustomer = rows.filter((r: any) => {
                const invCusN = normalize(r.inv_cus);
                return invCusN === customerNameN || invCusN.includes(customerNameN) || customerNameN.includes(invCusN);
            });
            // fallback: keep full 02 rows if strict customer mapping does not match
            if (byCustomer.length > 0) rows = byCustomer;
        }

        // Removed hypothecation options overriding so it retains all values

        this.issueType02ExecutiveOptions.set([...this.executiveOptions()]);
        const execValues = this.issueType02ExecutiveOptions().map(x => text(x.value));
        if (this.executive() && !execValues.includes(text(this.executive()))) {
            this.executive.set('');
        }

        if (this.executive()) {
            const selectedExec = this.issueType02ExecutiveOptions().find(x => text(x.value) === text(this.executive()));
            const selectedCode = normalize(this.executive());
            const selectedName = normalize(((selectedExec?.label || '').toString().split('[')[0] || ''));
            const byExecutive = rows.filter((r: any) => {
                const adv = normalize(r.inv_advisername);
                return adv === selectedCode || (!!selectedName && adv === selectedName);
            });
            if (byExecutive.length > 0) rows = byExecutive;
        }

        this.filteredChassisOptions.set(rows);
        if (this.chassisNo() && !rows.some((r: any) => (r.inv_chassis || '').toString().trim() === (this.chassisNo() || '').toString().trim())) {
            this.chassisNo.set('');
        }
    }

    onChassisChange(): void {
        const key = (this.chassisNo() || '').toString().trim().toLowerCase();
        const selected = this.chassisIndex.get(key);
        if (!selected) {
            this.hypothication.set('');
            this.selectedInvTotal.set(0);
            this.engineNo.set('');
            this.vehicle.set('');
            this.pCode.set('');
            this.color.set('');
            this.hsnCode.set('');
            this.basicAmount.set(0);
            this.discountAmount.set(0);
            this.taxableAmount.set(0);
            this.sgst.set(0);
            this.cgst.set(0);
            this.cess.set(0);
            return;
        }

        if (selected.inv_hypothication) {
            this.hypothication.set(selected.inv_hypothication.toString());
        }
        this.engineNo.set((selected.in_engine || selected.inv_engine_no || '').toString());
        this.vehicle.set((selected.inv_vehicle || selected.vehicle || '').toString());
        this.pCode.set((selected.inv_vehicle_code || selected.inv_product_id || '').toString());
        this.color.set((selected.inv_color || selected.color_name || '').toString());
        this.hsnCode.set((selected.inv_hsncode || selected.hsn_code || '').toString());

        this.basicAmount.set(this.toAmount(selected.basic_amount ?? selected.inv_basic_amt ?? 0));
        this.discountAmount.set(this.toAmount(selected.discount_amount ?? selected.inv_discount_amt ?? 0));

        // Reset selectedInvTotal to force local calculation for 'Available' stock
        this.selectedInvTotal.set(0);
        this.recalculateTotalAmount();
    }

    private buildChassisIndex(): void {
        this.chassisIndex.clear();
        for (const row of this.chassisOptions()) {
            const key = (row?.inv_chassis || '').toString().trim().toLowerCase();
            if (!key) continue;
            const existing = this.chassisIndex.get(key);
            if (!existing) {
                this.chassisIndex.set(key, row);
                continue;
            }
            const exTotal = this.resolveInvoiceTotal(existing);
            const rwTotal = this.resolveInvoiceTotal(row);
            const exId = Number(existing.inv_id) || 0;
            const rwId = Number(row.inv_id) || 0;
            const rowBetter = (rwTotal > 0 && exTotal <= 0) || (rwTotal === exTotal && rwId > exId) || (rwTotal > exTotal);
            if (rowBetter) this.chassisIndex.set(key, row);
        }
    }

    saveInvoice(event?: Event): void {
        event?.preventDefault();
        if (this.isSaving()) return;

        const customerName = this.issueType() === '02'
            ? (this.branchOptions().find(b => String(b.b_id) === String(this.customerBranchId()))?.branch_name || '').toString().trim()
            : (this.customerNameManual() || '').toString().trim();

        if (!customerName) {
            alert('Customer Name is required');
            return;
        }

        const selectedChassis = this.chassisOptions().find((r: any) => (r.inv_chassis || '').toString() === (this.chassisNo() || '').toString());
        const branchIdForSave = selectedChassis?.inv_branch || this.defaultBranchId();

        if (!this.invoiceNo()) { alert('Invoice number missing'); return; }
        if (!this.chassisNo()) { alert('Please select Chassis'); return; }

        this.isSaving.set(true);

        const doSave = (currentInvoiceNo: string) => {
            const payload = {
                invoiceNo: currentInvoiceNo,
                invoiceDate: this.toMysqlDate(this.invoiceDate()),
                branchId: this.defaultBranchId(),
                issueType: this.issueType(),
                customerName: this.issueType() === '02' ? '' : this.customerNameManual(),
                customerBranchId: this.issueType() === '02' ? this.customerBranchId() : null,
                guardian: this.guardian(),
                address: this.address(),
                pincode: this.pincode(),
                gstin: this.gstin(),
                mobileNo: this.mobileNo(),
                age: this.age(),
                cdmsNo: this.cdmsNo(),
                area: this.area(),
                hypothication: this.hypothication(),
                place: this.place(),
                receiptNo: this.receiptNo(),
                registration: this.registration(),
                financeDues: this.financeDues(),
                executive: this.executive(),
                chassisNo: this.chassisNo(),
                engineNo: this.engineNo(),
                vehicle: this.vehicle(),
                color: this.color(),
                pCode: this.pCode(),
                hsnCode: this.hsnCode(),
                basicAmount: this.basicAmount(),
                discountAmount: this.discountAmount(),
                taxableAmount: this.taxableAmount(),
                sgst: this.sgst(),
                cgst: this.cgst(),
                cess: this.cess(),
                totalAmount: Number(this.totalAmountDisplay())
            };

            this.api.saveSalesInvoice(payload).subscribe({
                next: (res: any) => {
                    this.isSaving.set(false);
                    if (res?.success) {
                        alert('Invoice Saved Successfully');
                        if (res.data?.id || res.id) {
                            const id = res.data?.id || res.id;
                            const url = this.api.getSalesPdfUrl(id);
                            window.open(url, '_blank');
                        }
                        this.router.navigate(['/previous-sales-invoice']);
                    } else {
                        alert(res?.message || 'Failed to save invoice');
                    }
                },
                error: (err: any) => {
                    this.isSaving.set(false);
                    alert('Error saving invoice');
                }
            });
        };

        this.api.getSalesInvoiceNextNo(branchIdForSave).subscribe({
            next: (res: any) => {
                const nextNo = (res?.invoiceNo || '').toString().trim();
                if (!nextNo) {
                    this.isSaving.set(false);
                    alert('Failed to generate invoice number');
                    return;
                }
                this.invoiceNo.set(nextNo);
                doSave(nextNo);
            },
            error: () => {
                this.isSaving.set(false);
                alert('Failed to generate invoice number');
            }
        });
    }



    navigate(path: string) { this.router.navigate([path]); }

    private formatTodayDate(): string {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    }

    private toMysqlDate(value: string): string {
        const v = (value || '').toString().trim();
        if (!v) return '';
        const parts = v.split('-');
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return v;
    }

    recalculateTotalAmount(): void {
        const basic = this.toAmount(this.basicAmount());
        const disc = this.toAmount(this.discountAmount());

        const taxable = Math.max(0, basic - disc);
        this.taxableAmount.set(taxable);

        // sgst = taxable amt * 9 / 100
        // cgst = taxable amt * 9 / 100
        // cess = 0
        this.sgst.set(Number((taxable * 0.09).toFixed(2)));
        this.cgst.set(Number((taxable * 0.09).toFixed(2)));
        this.cess.set(0);
    }

    private toAmount(value: any): number {
        if (value === null || value === undefined) return 0;
        const cleaned = value.toString().replace(/,/g, '').trim();
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : 0;
    }

    private resolveInvoiceTotal(row: any): number {
        const totalAmount = this.toAmount(row?.inv_total_amount);
        if (totalAmount > 0) return totalAmount;
        const total = this.toAmount(row?.inv_total);
        if (total > 0) return total;
        return 0;
    }
}
