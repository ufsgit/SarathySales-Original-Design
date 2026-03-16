import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, HostListener, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-invoice-from-proforma',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter],
    template: `
<div class="app-container">
  <app-user-nav></app-user-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a (click)="navigate(isAdmin() ? '/admin-home' : '/user-home')"><i class="fas fa-home"></i> Home</a>
        <span> > </span>
        <span>Transaction</span>
        <span> > </span>
        <span class="active">Sales Invoice</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
           <div class="header-left">
             <h2>Sales Invoice</h2>
          </div>
          <div class="header-actions">
             <button class="btn-view" (click)="navigate('/previous-sales-invoice')">View</button>
             <button class="btn-save" (click)="saveInvoice($event)" [disabled]="isSaving || isSaved">{{ isSaving ? 'Saving...' : (isSaved ? 'Saved' : 'Save & Print') }}</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="ledger-form">
            <div class="form-cols-wrapper">
                
                <!-- Column 1 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Branch Name:</label>
                        <!-- <div *ngIf="isAdmin()" class="custom-dropdown" #branchDropdownRef>
                            <div class="dropdown-toggle" (click)="toggleBranchDropdown()">
                                {{ branchName || '--Select Branch--' }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isBranchDropdownOpen">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search..." [(ngModel)]="branchSearchTerm" name="branchSearchTerm" (click)="$event.stopPropagation()">
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option" (click)="selectBranch(null)">--Select Branch--</div>
                                    <div class="dropdown-option" *ngFor="let b of searchableBranchOptions" (click)="selectBranch(b)">
                                        {{ b.branch_name }}
                                    </div>
                                    <div class="dropdown-option no-results" *ngIf="searchableBranchOptions.length === 0">No results found</div>
                                </div>
                            </div>
                        </div>
                        <input *ngIf="!isAdmin()" type="text" class="form-control readonly" [value]="branchName" disabled> -->
                        <input type="text" class="form-control readonly" [value]="branchName" disabled>
                    </div>
                    <div class="form-group">
                        <label>Invoice No :</label>
                        <input type="text" class="form-control readonly" [(ngModel)]="invoiceNo" name="invoiceNo" disabled>
                    </div>
                    <div class="form-group">
                        <label>Invoice Date :</label>
                        <input type="text" class="form-control" [(ngModel)]="invoiceDate" name="invoiceDate" disabled>
                    </div>
                    <div class="form-group">
                        <label>Issue Type :</label>
                        <select class="form-control" [(ngModel)]="issueType" name="issueType" (change)="onIssueTypeChange()">
                            <option value="">--Select--</option>
                            <option value="01">01</option>
                            <option value="02">02</option>
                        </select>
                    </div>
                    <div class="form-group" *ngIf="issueType === '01'">
                        <label>Customer Name:</label>
                        <input type="text" class="form-control" [(ngModel)]="customerNameManual" name="customerNameManual">
                    </div>
                    <div class="form-group" *ngIf="issueType === '02'">
                        <label>Customer Name:</label>
                        <select class="form-control" [(ngModel)]="customerBranchId" name="customerBranchId" (change)="onCustomerBranchChange()">
                            <option value="">--Select--</option>
                            <option *ngFor="let b of branchOptions" [value]="b.b_id">
                                {{ b.branch_name }} | {{ b.branch_address }} | {{ b.branch_gstin }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Father/Husband:</label>
                        <input type="text" class="form-control" [(ngModel)]="guardian" name="guardian">
                    </div>
                    <div class="form-group" style="align-items: flex-start;">
                        <label style="margin-top: 5px;">Address:</label>
                        <textarea class="form-control" [(ngModel)]="address" name="address" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Pin Code:</label>
                        <input type="text" class="form-control" [(ngModel)]="pincode" name="pincode">
                    </div>
                     <div class="form-group">
                        <label>GSTIN:</label>
                        <input type="text" class="form-control" [(ngModel)]="gstin" name="gstin">
                    </div>
                </div>

                <!-- Column 2 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Mobile No :</label>
                        <input type="text" class="form-control" [(ngModel)]="mobileNo" name="mobileNo">
                    </div>
                    <div class="form-group">
                        <label>Age :</label>
                        <input type="text" class="form-control" [(ngModel)]="age" name="age">
                    </div>
                    <div class="form-group">
                        <label>CDMS No:</label>
                        <input type="text" class="form-control" [(ngModel)]="cdmsNo" name="cdmsNo">
                    </div>
                    <div class="form-group">
                        <label>Area:</label>
                        <input type="text" class="form-control" [(ngModel)]="area" name="area">
                    </div>
                    <div class="form-group">
                        <label>Hypothication:</label>
                        <select class="form-control" [(ngModel)]="hypothication" name="hypothication" (change)="onHypothecationChange()">
                            <option value="">--Select--</option>
                            <option *ngFor="let h of currentHypothecationOptions" [value]="h.value">{{ h.label }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Place:</label>
                        <input type="text" class="form-control" [(ngModel)]="place" name="place">
                    </div>
                    <div class="form-group">
                        <label>Receipt No:</label>
                        <input type="text" class="form-control" [(ngModel)]="receiptNo" name="receiptNo">
                    </div>
                    <div class="form-group">
                        <label>Registration:</label>
                        <input type="text" class="form-control" [(ngModel)]="registration" name="registration">
                    </div>
                     <div class="form-group">
                        <label>Finance Dues:</label>
                        <input type="text" class="form-control" [(ngModel)]="financeDues" name="financeDues">
                    </div>
                     <div class="form-group">
                        <label>Executive Name:</label>
                         <select class="form-control" [(ngModel)]="executive" name="executive" (change)="onExecutiveChange()">
                            <option value="">--select--</option>
                            <option *ngFor="let ex of currentExecutiveOptions" [value]="ex.value">{{ ex.label }}</option>
                        </select>
                    </div>
                </div>

                <!-- Column 3 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Chassis No <span style="color:red">*</span>:</label>
                        <div class="custom-dropdown" #dropdownRef>
                            <div class="dropdown-toggle" (click)="toggleDropdown()">
                                {{ chassisNo || '--Select--' }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isDropdownOpen">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search..." [(ngModel)]="searchTerm" name="searchTerm" #searchInputRef (click)="$event.stopPropagation()">
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option" (click)="selectChassis('')">--Select--</div>
                                    <div class="dropdown-option" *ngFor="let row of searchableChassisList" (click)="selectChassis(row)">
                                        {{ row.inv_chassis }}
                                    </div>
                                    <div class="dropdown-option no-results" *ngIf="searchableChassisList.length === 0">No results found</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Engine No:</label>
                        <input type="text" class="form-control readonly" [(ngModel)]="engineNo" name="engineNo" readonly>
                    </div>
                    <div class="form-group">
                        <label>Vehicle:</label>
                        <input type="text" class="form-control readonly" [(ngModel)]="vehicle" name="vehicle" readonly>
                    </div>
                    <div class="form-group">
                        <label>Color:</label>
                        <input type="text" class="form-control readonly" [(ngModel)]="color" name="color" readonly>
                    </div>
                    <div class="form-group">
                        <label>P.Code:</label>
                        <input type="text" class="form-control readonly" [(ngModel)]="pCode" name="pCode" readonly>
                    </div>
                    <div class="form-group">
                        <label>HSN.Code:</label>
                        <input type="text" class="form-control readonly" [(ngModel)]="hsnCode" name="hsnCode" readonly>
                    </div>
                    <div class="form-group">
                        <label>Basic Amount:</label>
                        <input type="number" class="form-control readonly" [(ngModel)]="basicAmount" name="basicAmount" value="00.00" readonly>
                    </div>
                    <div class="form-group">
                        <label>Discount Amount:</label>
                        <input type="number" class="form-control" [(ngModel)]="discountAmount" name="discountAmount" value="00.00" (ngModelChange)="recalculateTotalAmount()">
                    </div>
                    <div class="form-group">
                        <label>Taxable Amount:</label>
                        <input type="number" class="form-control readonly" [(ngModel)]="taxableAmount" name="taxableAmount" value="00.00" readonly>
                    </div>
                    <div class="form-group">
                        <label>SGST(9%):</label>
                        <input type="number" class="form-control readonly" [(ngModel)]="sgst" name="sgst" value="00.00" readonly>
                    </div>
                    <div class="form-group">
                        <label>CGST(9%):</label>
                        <input type="number" class="form-control readonly" [(ngModel)]="cgst" name="cgst" value="00.00" readonly>
                    </div>
                    <div class="form-group">
                        <label>CESS:</label>
                        <input type="number" class="form-control readonly" [(ngModel)]="cess" name="cess" value="00.00" readonly>
                    </div>
                </div>

            </div>

             <!-- Total Payable Section -->
             <div class="total-payable-section">
                <span>Total Amount : Rs <span class="amount-val">{{ totalAmountDisplay }}</span></span>
             </div>

             <!-- Save & Print Button Row (Right Aligned) -->
             <div class="action-row-right">
                <button class="btn-save" (click)="saveInvoice($event)" [disabled]="isSaving || isSaved">{{ isSaving ? 'Saving...' : (isSaved ? 'Saved' : 'Save & Print') }}</button>
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

    /* Custom Dropdown */
    .custom-dropdown {
        flex: 1;
        position: relative;
        cursor: pointer;
    }

    .dropdown-toggle {
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        background: #fff;
        border-radius: 3px;
        height: 28px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #333;
    }

    .dropdown-toggle.readonly {
        background-color: #e9ecef;
        color: #495057;
        pointer-events: none;
    }

    .dropdown-toggle i {
        font-size: 10px;
        color: #666;
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
export class InvoiceFromProformaComponent implements OnInit {
    isAdmin = signal(false);
    @ViewChild('dropdownRef') dropdownRef!: ElementRef;
    @ViewChild('branchDropdownRef') branchDropdownRef!: ElementRef;
    @ViewChild('searchInputRef') searchInputRef!: ElementRef;

    isDropdownOpen = false;
    isBranchDropdownOpen = false;
    searchTerm = '';
    branchSearchTerm = '';

    get searchableChassisList() {
        const term = this.searchTerm.toLowerCase();
        return this.filteredChassisOptions.filter((c: any) =>
            (c.inv_chassis || '').toString().toLowerCase().includes(term)
        );
    }

    get searchableBranchOptions() {
        const term = this.branchSearchTerm.toLowerCase().trim();
        if (!term) return this.branchOptions;
        return this.branchOptions.filter(b =>
            (b.branch_name || '').toLowerCase().includes(term)
        );
    }

    toggleBranchDropdown() {
        this.isBranchDropdownOpen = !this.isBranchDropdownOpen;
        if (this.isBranchDropdownOpen) {
            this.branchSearchTerm = '';
        }
    }

    selectBranch(b: any) {
        if (!b) {
            this.selectedBranchId = '';
        } else {
            this.selectedBranchId = String(b.b_id);
        }
        this.isBranchDropdownOpen = false;
        this.onBranchChange();
    }

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        if (this.isDropdownOpen) {
            this.searchTerm = '';
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
            this.isDropdownOpen = false;
        }
        if (this.branchDropdownRef && !this.branchDropdownRef.nativeElement.contains(event.target)) {
            this.isBranchDropdownOpen = false;
        }
    }

    selectChassis(row: any) {
        if (!row) {
            this.chassisNo = '';
        } else {
            this.chassisNo = row.inv_chassis;
        }
        this.isDropdownOpen = false;
        this.onChassisChange();
    }

    proformaId: number = 0;
    branchName = '';
    invoiceNo = '';
    invoiceDate = '';

    issueType = '';
    customerNameManual = '';
    customerBranchId = '';
    branchOptions: Array<{
        b_id: number;
        branch_id: string;
        branch_name: string;
        branch_address: string;
        branch_ph: string;
        branch_pin: string;
        branch_gstin: string;
        branch_email: string;
        branch_location: string;
        branch_prefix: string;
    }> = [];
    guardian = '';
    address = '';
    pincode = '';
    gstin = '';

    mobileNo = '';
    age = '';
    cdmsNo = '';
    area = '';
    hypothication = '';
    place = '';
    receiptNo = '';
    registration = '';
    financeDues = '';
    executive = '';
    executiveOptions: Array<{ value: string; label: string }> = [];
    hypothecationOptions: Array<{ value: string; label: string }> = [];
    issueType02ExecutiveOptions: Array<{ value: string; label: string }> = [];
    issueType02HypothecationOptions: Array<{ value: string; label: string }> = [];

    chassisNo = '';
    engineNo = '';
    vehicle = '';
    color = '';
    pCode = '';
    hsnCode = '';
    basicAmount = 0;
    discountAmount = 0;
    taxableAmount = 0;
    sgst = 0;
    cgst = 0;
    cess = 0;
    totalAmountDisplay = '00.00';
    selectedInvTotal = 0;
    chassisOptions: any[] = [];
    filteredChassisOptions: any[] = [];
    isSaving = false;
    isSaved = false;
    defaultBranchId = '';
    selectedBranchId = '';
    private chassisIndex = new Map<string, any>();

    constructor(private router: Router, private route: ActivatedRoute, private api: ApiService, private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.route.params.subscribe((params: any) => {
            if (params['id']) {
                this.proformaId = +params['id'];
            }
        });

        this.invoiceDate = this.formatTodayDate();
        this.loadHypothecationOptions();
        const user = this.api.getCurrentUser();
        this.isAdmin.set(user?.role == 1 || user?.role_des === 'admin');
        const loginBranchName = user?.branch_name || '';
        const loginBranchId = (user?.branch_id ?? '').toString().trim();

        // 1. Fetch Branches first
        this.api.getBranches().subscribe({
            next: (res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    this.branchOptions = res.data.map((b: any) => ({
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

                    const ownBranch = this.branchOptions.find(
                        b => String(b.b_id) === loginBranchId || (b.branch_name || '').toLowerCase().trim() === loginBranchName.toLowerCase().trim()
                    );
                    this.defaultBranchId = String(ownBranch?.b_id || this.branchOptions[0]?.b_id || '');

                    // 2. If proformaId exists, load proforma data first to get the branch
                    if (this.proformaId) {
                        this.loadProformaData();
                    } else {
                        // 3. Normal flow for login branch
                        this.branchName = loginBranchName;
                        this.selectedBranchId = this.defaultBranchId;
                        this.loadNextInvoiceNo(this.selectedBranchId);
                        this.loadExecutivesForBranch(this.branchName);
                        this.loadChassisRecordsForBranch(this.selectedBranchId);
                    }
                }
            }
        });
    }

    private loadExecutivesForBranch(branchName: string): void {
        this.api.getInvoiceFromProformaExecutives(branchName).subscribe({
            next: (res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    this.executiveOptions = res.data.map((ex: any) => {
                        const firstName = (ex.e_first_name || '').toString().trim();
                        const code = (ex.e_code || ex.emp_id || '').toString().trim();
                        return {
                            value: code,
                            label: `${firstName}[${code}]`
                        };
                    }).filter((x: any) => x.value && x.label && !x.label.startsWith('['));
                } else {
                    this.executiveOptions = [];
                }
                this.refreshIssueType02Filters();
                this.cdr.detectChanges();
            },
            error: () => {
                this.executiveOptions = [];
                this.refreshIssueType02Filters();
            }
        });
    }

    private loadChassisRecordsForBranch(bid: string | undefined): void {
        this.api.getProformaChassisRecords(bid || undefined).subscribe({
            next: (res: any) => {
                this.chassisOptions = res?.success && Array.isArray(res.data) ? res.data : [];
                this.buildChassisIndex();
                this.refreshIssueType02Filters();
                this.cdr.detectChanges();
            },
            error: () => {
                this.chassisOptions = [];
                this.chassisIndex.clear();
                this.refreshIssueType02Filters();
            }
        });
    }

    onBranchChange(): void {
        const branch = this.branchOptions.find(b => String(b.b_id) === String(this.selectedBranchId));
        this.branchName = branch?.branch_name || '';
        const bid = branch?.b_id ? String(branch.b_id) : '';

        // Reset fields when branch changes
        this.chassisNo = '';
        this.engineNo = '';
        this.vehicle = '';
        this.color = '';
        this.pCode = '';
        this.hsnCode = '';
        this.basicAmount = 0;
        this.discountAmount = 0;
        this.taxableAmount = 0;
        this.sgst = 0;
        this.cgst = 0;
        this.cess = 0;
        this.totalAmountDisplay = '00.00';
        this.executive = '';

        if (bid) {
            this.loadNextInvoiceNo(bid);
            this.loadExecutivesForBranch(this.branchName);
            this.loadChassisRecordsForBranch(bid);
        } else {
            this.invoiceNo = '';
            this.executiveOptions = [];
            this.chassisOptions = [];
            this.chassisIndex.clear();
            this.refreshIssueType02Filters();
        }
    }

    private loadProformaData(): void {
        this.api.getProforma(this.proformaId).subscribe({
            next: (res: any) => {
                if (res && res.success && res.proforma) {
                    const p = res.proforma;

                    // Set branch from proforma
                    if (p.pro_branch) {
                        this.selectedBranchId = String(p.pro_branch);
                        const branch = this.branchOptions.find(b => String(b.b_id) === this.selectedBranchId);
                        this.branchName = branch?.branch_name || p.branch_name || '';
                    }

                    // Load branch dependent data
                    this.loadNextInvoiceNo(this.selectedBranchId);
                    this.loadExecutivesForBranch(this.branchName);
                    this.loadChassisRecordsForBranch(this.selectedBranchId);

                    this.issueType = '01';
                    this.customerNameManual = p.pro_cus_name || '';
                    this.address = p.pro_cus_address || '';
                    this.mobileNo = p.pro_contact || p.pro_cus_phone || '';
                    if (p.pro_executive) {
                        const storedExec = p.pro_executive.toLowerCase();
                        const match = this.executiveOptions.find(opt =>
                            opt.label.toLowerCase().includes(storedExec) ||
                            opt.value.toLowerCase() === storedExec
                        );
                        if (match) {
                            this.executive = match.value;
                        } else {
                            this.executive = p.pro_executive;
                        }
                    } else {
                        this.executive = '';
                    }

                    this.hypothication = p.pro_type_loan === 'Finance' ? 'HDFCBANK' : ''; // Just a crude mapping, you can refine this

                    if (res.items && res.items.length > 0) {
                        const firstItem = res.items[0];
                        this.vehicle = firstItem.pro_product_descr || '';
                        this.pCode = firstItem.pro_product_code || '';

                        this.basicAmount = this.toAmount(firstItem.pro_prduct_bas_amt);
                        this.taxableAmount = this.toAmount(firstItem.product_taxable_amt);
                        this.sgst = this.toAmount(firstItem.pro_product_sgst);
                        this.cgst = this.toAmount(firstItem.pro_product_cgst);
                        this.cess = this.toAmount(firstItem.product_cess_amt);
                        this.selectedInvTotal = this.toAmount(firstItem.pro_total);

                        this.totalAmountDisplay = this.selectedInvTotal.toFixed(2);
                    }
                    this.cdr.detectChanges();
                }
            }
        });
    }

    private loadHypothecationOptions(): void {
        this.api.getSalesInvoiceHypothecationOptions().subscribe({
            next: (res: any) => {
                const rows = Array.isArray(res?.data) ? res.data : [];
                this.hypothecationOptions = rows
                    .map((r: any) => (r?.icompany_name || '').toString().trim())
                    .filter((v: string) => !!v)
                    .map((v: string) => ({ value: v, label: v }));
                this.refreshIssueType02Filters();
            },
            error: () => {
                this.hypothecationOptions = [];
                this.refreshIssueType02Filters();
            }
        });
    }

    onIssueTypeChange(): void {
        if (this.issueType !== '02') {
            this.customerBranchId = '';
        }
        if (this.issueType !== '01') {
            this.customerNameManual = '';
        }
        this.refreshIssueType02Filters();
    }

    onCustomerBranchChange(): void {
        const id = parseInt((this.customerBranchId || '').toString(), 10) || 0;
        const selected = this.branchOptions.find(b => b.b_id === id);
        this.address = selected?.branch_address || '';
        this.mobileNo = selected?.branch_ph || this.mobileNo;
        this.pincode = selected?.branch_pin || this.pincode;
        this.gstin = selected?.branch_gstin || '';
        this.place = selected?.branch_location || this.place;
        this.refreshIssueType02Filters();
    }

    onHypothecationChange(): void {
        this.refreshIssueType02Filters();
    }

    onExecutiveChange(): void {
        this.refreshIssueType02Filters();
    }

    get currentHypothecationOptions(): Array<{ value: string; label: string }> {
        if (this.issueType === '02') {
            return this.issueType02HypothecationOptions.length ? this.issueType02HypothecationOptions : this.hypothecationOptions;
        }
        return this.hypothecationOptions;
    }

    get currentExecutiveOptions(): Array<{ value: string; label: string }> {
        if (this.issueType === '02') {
            return this.issueType02ExecutiveOptions.length ? this.issueType02ExecutiveOptions : this.executiveOptions;
        }
        return this.executiveOptions;
    }

    private refreshIssueType02Filters(): void {
        if (this.issueType !== '02') {
            this.filteredChassisOptions = [...this.chassisOptions];
            this.issueType02HypothecationOptions = [];
            this.issueType02ExecutiveOptions = [];
            return;
        }

        const text = (v: any) => (v ?? '').toString().trim();
        const normalize = (v: any) => text(v).toLowerCase().replace(/\s+/g, ' ');
        const customerName = text(this.branchOptions.find(b => String(b.b_id) === String(this.customerBranchId))?.branch_name);

        const rowsAll = [...this.chassisOptions];

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

        this.issueType02ExecutiveOptions = [...this.executiveOptions];
        const execValues = this.issueType02ExecutiveOptions.map(x => text(x.value));
        if (this.executive && !execValues.includes(text(this.executive))) {
            this.executive = '';
        }

        if (this.executive) {
            const selectedExec = this.issueType02ExecutiveOptions.find(x => text(x.value) === text(this.executive));
            const selectedCode = normalize(this.executive);
            const selectedName = normalize(((selectedExec?.label || '').toString().split('[')[0] || ''));
            const byExecutive = rows.filter((r: any) => {
                const adv = normalize(r.inv_advisername);
                return adv === selectedCode || (!!selectedName && adv === selectedName);
            });
            if (byExecutive.length > 0) rows = byExecutive;
        }

        this.filteredChassisOptions = rows;
        if (this.chassisNo && !rows.some((r: any) => text(r.inv_chassis) === text(this.chassisNo))) {
            this.chassisNo = '';
        }
    }

    onChassisChange(): void {
        const key = (this.chassisNo || '').toString().trim().toLowerCase();
        const selected = this.chassisIndex.get(key);
        if (!selected) {
            this.hypothication = '';
            this.totalAmountDisplay = '00.00';
            this.selectedInvTotal = 0;
            return;
        }

        if (selected.inv_hypothication) {
            this.hypothication = selected.inv_hypothication.toString();
        }
        this.engineNo = (selected.in_engine || selected.inv_engine_no || '').toString();
        this.vehicle = (selected.inv_vehicle || selected.vehicle || '').toString();
        this.pCode = (selected.inv_vehicle_code || selected.inv_product_id || '').toString();
        this.color = (selected.inv_color || selected.color_name || '').toString();
        this.hsnCode = (selected.inv_hsncode || selected.hsn_code || '').toString();

        this.basicAmount = this.toAmount(selected.basic_amount ?? selected.inv_basic_amt ?? 0);
        this.discountAmount = this.toAmount(selected.discount_amount ?? selected.inv_discount_amt ?? 0);

        // Initial taxable amount calculation
        this.taxableAmount = this.basicAmount - this.discountAmount;

        // Reset totals to force recalculation if selecting from stock (status='Available')
        this.selectedInvTotal = 0;

        this.recalculateTotalAmount();
    }

    private buildChassisIndex(): void {
        this.chassisIndex.clear();
        for (const row of this.chassisOptions) {
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
        if (this.isSaving) return;

        const customerName = this.issueType === '02'
            ? (this.branchOptions.find(b => String(b.b_id) === String(this.customerBranchId))?.branch_name || '').toString().trim()
            : (this.customerNameManual || '').toString().trim();

        if (!customerName) {
            alert('Customer Name is required');
            return;
        }

        if (!this.chassisNo) {
            alert('Chassis No. is a required field');
            return;
        }

        const selectedChassis = this.chassisOptions.find((r: any) => (r.inv_chassis || '').toString() === (this.chassisNo || '').toString());
        const branchId = selectedChassis?.inv_branch || (this.customerBranchId ? parseInt(this.customerBranchId, 10) : null);
        const branchIdForSave = String(branchId || this.defaultBranchId || '');
        const currentInvoiceNo = (this.invoiceNo || '').toString().trim();

        const doSave = (finalInvoiceNo: string) => {
            const payload = {
                invoiceNo: finalInvoiceNo,
                branchId: branchIdForSave || null,
                invoiceDate: this.toMysqlDate(this.invoiceDate),
                customerName,
                chassisNo: (this.chassisNo || '').toString().trim(),
                engineNo: (this.engineNo || '').toString().trim(),
                regNo: (this.registration || '').toString().trim(),
                adviserId: (this.executive || '').toString().trim(),
                totalAmount: parseFloat(this.totalAmountDisplay || '0') || 0,
                mobileNo: (this.mobileNo || '').toString().trim(),
                guardian: (this.guardian || '').toString().trim(),
                address: (this.address || '').toString().trim(),
                issueType: (this.issueType || '').toString().trim(),
                age: (this.age || '').toString().trim(),
                cdmsNo: (this.cdmsNo || '').toString().trim(),
                area: (this.area || '').toString().trim(),
                hypothication: (this.hypothication || '').toString().trim(),
                place: (this.place || '').toString().trim(),
                receiptNo: (this.receiptNo || '').toString().trim(),
                financeDues: (this.financeDues || '').toString().trim(),
                vehicle: (this.vehicle || '').toString().trim(),
                pCode: (this.pCode || '').toString().trim(),
                color: (this.color || '').toString().trim(),
                gstin: (this.gstin || '').toString().trim(),
                basicAmount: this.toAmount(this.basicAmount),
                discountAmount: this.toAmount(this.discountAmount),
                hsnCode: (this.hsnCode || '').toString().trim(),
                taxableAmount: this.toAmount(this.taxableAmount),
                sgst: this.toAmount(this.sgst),
                cgst: this.toAmount(this.cgst),
                cess: this.toAmount(this.cess),
                pincode: (this.pincode || '').toString().trim(),
                proformaId: this.proformaId || null,
                items: []
            };

            this.isSaving = true;
            this.api.saveSalesInvoice(payload).subscribe({
                next: (res: any) => {
                    this.isSaving = false;
                    if (res?.success) {
                        this.isSaved = true;
                        alert('Sales invoice saved successfully');
                        // this.navigate('/previous-sales-invoice');
                    } else {
                        alert(res?.message || 'Failed to save sales invoice');
                    }
                },
                error: (err: any) => {
                    this.isSaving = false;
                    const msg = err?.error?.message || err?.message || 'Failed to save sales invoice';
                    alert(msg);
                }
            });
        };

        const looksStaticOrEmpty = !currentInvoiceNo;
        if (looksStaticOrEmpty) {
            this.api.getSalesInvoiceNextNo(branchIdForSave).subscribe({
                next: (res: any) => {
                    const nextNo = (res?.invoiceNo || '').toString().trim();
                    if (!nextNo) {
                        alert('Failed to generate invoice number');
                        return;
                    }
                    this.invoiceNo = nextNo;
                    doSave(nextNo);
                },
                error: () => { alert('Failed to generate invoice number'); }
            });
            return;
        }

        doSave(currentInvoiceNo);
    }

    private loadNextInvoiceNo(branchId?: string): void {
        const bid = (branchId || this.defaultBranchId || '').toString();
        if (!bid) return;
        this.api.getNextInvoiceFromProformaNumber(bid).subscribe({
            next: (res: any) => {
                const nextNo = (res?.invoiceNo || '').toString().trim();
                if (nextNo) {
                    this.invoiceNo = nextNo;
                    this.cdr.detectChanges();
                }
            },
            error: () => {
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
        const basic = this.toAmount(this.basicAmount);
        const disc = this.toAmount(this.discountAmount);

        this.taxableAmount = Math.max(0, basic - disc);

        // Formula: sgst = taxable amt * 9 / 100
        // Formula: cgst = taxable amt * 9 / 100
        // Formula: cess = 0
        this.sgst = Number((this.taxableAmount * 0.09).toFixed(2));
        this.cgst = Number((this.taxableAmount * 0.09).toFixed(2));
        this.cess = 0;

        const total = this.taxableAmount + this.sgst + this.cgst + this.cess;
        this.totalAmountDisplay = total.toFixed(2);
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
