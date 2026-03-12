import { Component, OnInit, ChangeDetectorRef, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-edit-proforma-invoice',
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
        <span>INVOICE</span>
        <span> > </span>
        <span class="active">Edit Proforma</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
           <div class="header-left">
             <h2>EDIT INVOICE (Proforma)</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="navigate('/previous-proforma-invoice')">List Proforma Invoice</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="ledger-form">
            
            <!-- Row 1 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Branch Name:</label>

                    <!-- <div *ngIf="isAdmin()" class="custom-dropdown" #branchDropdownRef style="width: 180px;">
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
                <div class="form-col">
                    <label>Customer Name:</label>
                    <input type="text" class="form-control" [(ngModel)]="customerName" name="customerName">
                </div>
                <div class="form-col" style="grid-column: span 1;">
                    <label>Customer Address:</label>
                    <textarea class="form-control" style="height: 90px;" [(ngModel)]="customerAddress" name="customerAddress" rows="3"></textarea>
                </div>
                <div class="form-col">
                    <label>Date:</label>
                    <div class="date-input-wrapper">
                        <input type="date" class="form-control" [(ngModel)]="date" name="date">
                    </div>
                </div>
            </div>

            <!-- Row 2 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Quotation No:</label>
                    <input type="text" class="form-control readonly" [value]="quotationNo" disabled>
                </div>
                <div class="form-col">
                    <label>Contact No:</label>
                    <input type="text" class="form-control" [(ngModel)]="contactNo" name="contactNo">
                </div>
                <div class="form-col"></div> 
                <div class="form-col">
                    <label>Reference:</label>
                    <input type="text" class="form-control" [(ngModel)]="reference" name="reference">
                </div>
             </div>

             <!-- Row 3 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Payment Mode:</label>
                    <select class="form-control" [(ngModel)]="paymentMode" name="paymentMode">
                        <option value="">--Select--</option>
                        <option value="Cash">Cash</option>
                        <option value="Finance">Finance</option>
                    </select>
                </div>
                <div class="form-col">
                    <label>Executive:</label>
                    <select class="form-control" [(ngModel)]="executive" name="executive">
                        <option value="">--Select--</option>
                        <option *ngFor="let ex of executiveOptions" [value]="ex">{{ ex }}</option>
                    </select>
                </div>
                <div class="form-col"></div>
                <div class="form-col"></div>
             </div>

             <!-- Total Payable Section -->
             <div class="total-payable-section">
                <span>Total Payable Amount : Rs <span class="amount-val">{{ grandTotal.toFixed(2) }}</span></span>
             </div>

             <!-- Save & Print Button Row (Right Aligned) -->
             <div class="action-row-right">
                <button class="btn-save" type="button" (click)="onUpdate()" [disabled]="isSaving">{{ isSaving ? 'Updating...' : 'Update' }}</button>
             </div>

             <!-- Line Item Row 1 -->
          <table class="invoice-table">
    <thead>
        <tr>
            <th>Product Code</th>
            <th>Product Description</th>
            <th>Basic Price</th>
            <th>Qty</th>
            <th>Taxable Amt</th>
            <th>SGST</th>
            <th>CGST</th>
            <th>CESS</th>
            <th>Amount</th>
            <th>
                <button type="button" (click)="addRow()" class="btn-add">+</button>
            </th>
        </tr>
    </thead>
    <datalist id="productCodeOptions">
        <option *ngFor="let p of productOptions" [value]="p.code">{{ p.code }} | {{ p.description }}</option>
    </datalist>
    <tbody id="invoice-body">
        <tr *ngFor="let item of items; let i = index">
            <td>
                <input
                    type="text"
                    class="in-box"
                    style="background-color: #fff;"
                    [(ngModel)]="item.productCode"
                    name="code{{i}}"
                    [attr.list]="'productCodeOptions'"
                    placeholder="Search product code"
                    (ngModelChange)="onCodeChange(i)">
            </td>
            <td><input type="text" class="in-box" [(ngModel)]="item.description" name="desc{{i}}" readonly></td>
            <td><input type="number" class="in-box basic-price" [(ngModel)]="item.basicPrice" name="basicPrice{{i}}" (ngModelChange)="recalculateRow(item)" readonly disabled></td>
            <td><input type="number" style="background-color: #fff;" class="in-box qty" [(ngModel)]="item.qty" name="qty{{i}}" (ngModelChange)="recalculateRow(item)"></td>
            <td><input type="text" class="in-box gray" [value]="item.taxable.toFixed(2)" name="taxable{{i}}" readonly></td>
            <td><input type="text" class="in-box gray" [value]="item.sgst.toFixed(2)" name="sgst{{i}}" readonly></td>
            <td><input type="text" class="in-box gray" [value]="item.cgst.toFixed(2)" name="cgst{{i}}" readonly></td>
            <td><input type="text" class="in-box gray" [value]="item.cess.toFixed(2)" name="cess{{i}}" readonly></td>
            <td><input type="text" class="in-box gray" [value]="item.amount.toFixed(2)" name="amount{{i}}" readonly></td>
            <td>
                <button type="button" (click)="removeRow(i)" class="btn-del">-</button>
            </td>
        </tr>
    </tbody>
    <tbody class="summary-section">
        <tr>
            <td colspan="3"></td>
            <td class="lbl">Total</td>
            <td><input type="text" class="in-box gray" [value]="totals.taxable.toFixed(2)" readonly></td>
            <td><input type="text" class="in-box gray" [value]="totals.sgst.toFixed(2)" readonly></td>
            <td><input type="text" class="in-box gray" [value]="totals.cgst.toFixed(2)" readonly></td>
            <td><input type="text" class="in-box gray" [value]="totals.cess.toFixed(2)" readonly></td>
            <td><input type="text" class="in-box gray" [value]="totals.amount.toFixed(2)" readonly></td>
            <td></td>
            <tr class="summary-row">
                <td colspan="5"></td>
                <td colspan="3" class="label">Missell-1 &nbsp; <input type="text" class="form-input mini-box" style="background-color: #fff;" [(ngModel)]="missell1" name="missell1"></td>
                <td><input type="number" class="form-input" style="background-color: #fff;" [(ngModel)]="missell1Amount" name="missell1Amount"></td>
                <td></td>
            </tr>
            <tr class="summary-row">
                <td colspan="5"></td>
                <td colspan="3" class="label">Missell-2 &nbsp; <input type="text" class="form-input mini-box" style="background-color: #fff;" [(ngModel)]="missell2" name="missell2"></td>
                <td><input type="number" class="form-input" style="background-color: #fff;" [(ngModel)]="missell2Amount" name="missell2Amount"></td>
                <td></td>
            </tr>
            <tr class="summary-row">
                <td colspan="8" class="label">Less</td>
                <td><input type="number" class="form-input" style="background-color: #fff;" [(ngModel)]="lessAmount" name="lessAmount"></td>
                <td></td>
            </tr>
            <tr class="summary-row">
                <td colspan="8" class="label"><strong>Grand Total</strong></td>
                <td><input type="text" class="form-input gray-box" [value]="grandTotal.toFixed(2)" readonly></td>
                <td></td>
            </tr>
       
        </tbody>
</table>
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
        gap: 15px; /* Space between rows */
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
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 100%;
        max-width: 180px; /* Limit input width to look like screenshot */
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        height: 28px;
        background-color: #fff;
    }
    
    textarea.form-control {
        resize: none;
        height: 30px; 
        background-color: #fff;
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

    /* Total Payable Display */
    .total-payable-section {
        background: #fcfcfc;
        padding: 10px;
        font-size: 16px;
        font-weight: 600;
        color: #333;
    }
    .amount-val {
        color: #666; 
    }

    .action-row-right {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 10px;
    }

    /* Table Styles */
    .items-table-header {
        display: flex;
        gap: 10px;
        margin-bottom: 5px;
    }
    .items-table-header .th {
        font-size: 11px;
        font-weight: 600;
        color: #333;
    }
    .action-th {
        text-align: center;
        font-weight: bold;
    }

    .items-table-row {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 5px;
    }
    .table-input {
        max-width: 100%; /* Fill flex space */
        height: 26px;
    }
    
    .btn-remove {
        background: white;
        border: 1px solid #ccc;
        color: black;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 3px;
        font-weight: bold;
    }

    /* Totals Grid */
    .totals-grid-wrapper {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }
    .totals-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 300px;
    }
    .total-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }
    .total-row label {
        font-size: 12px;
        color: #333;
        font-weight: 500;
        flex: 1;
        text-align: right;
    }
    .total-row .form-control {
        flex: 1;
        text-align: right;
    }
    
    .grand-total label {
        font-weight: bold;
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
        .items-table-header, .items-table-row {
            display: none; /* Hide complex table on mobile or implement card view */
        }
    }
.billing-container {
    font-family: Arial, sans-serif;
    padding: 20px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th {
    text-align: left;
    font-size: 12px;
    padding-bottom: 10px;
}

input {
    width: 150px;
    padding: 2px 4px;        
    border: 1px solid #ccc;
    background-color: #f0f0f0;
    text-align: left;
}

.label {
    text-align: right;
    padding-right: 15px;
    font-size: 13px;
}

.summary-row td {
    padding-top: 5px;
}

.action-icons {
    font-size: 20px;
    cursor: pointer;
    vertical-align: middle;
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
    padding: 6px 12px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    color: #333;
    min-height: 38px;
}
.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-top: 4px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1001;
    max-height: 300px;
    display: flex;
    flex-direction: column;
}
.dropdown-search {
    padding: 8px;
    border-bottom: 1px solid #eee;
    background: #f9f9f9;
}
.dropdown-search input {
    width: 100% !important;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    max-width: none !important;
}
.dropdown-options-list {
    overflow-y: auto;
    max-height: 240px;
}
.dropdown-option {
    padding: 10px 12px;
    cursor: pointer;
    font-size: 13px;
    color: #333;
    transition: background 0.2s;
}
.dropdown-option:hover {
    background: #f36f21;
    color: white;
}
.dropdown-option.no-results {
    color: #999;
    font-style: italic;
    cursor: default;
}

  `]
})
export class EditProformaInvoiceComponent implements OnInit {
    isAdmin = signal(false);
    @ViewChild('branchDropdownRef') branchDropdownRef!: ElementRef;
    id: number = 0;
    branchId = '';
    branchName = 'SARATHY KOLLAM KTM';
    date = '';
    quotationNo = '';

    customerName = '';
    customerAddress = '';
    contactNo = '';
    reference = '';
    paymentMode = 'Cash';
    executive = '';
    executiveOptions: string[] = [];
    branchOptions: any[] = [];
    selectedBranchId = '';
    isBranchDropdownOpen = false;
    branchSearchTerm = '';
    isSaving = false;

    missell1 = '';
    missell1Amount = 0;
    missell2 = '';
    missell2Amount = 0;
    lessAmount = 0;

    productOptions: Array<{
        productId: number;
        code: string;
        description: string;
        salePrice: number;
        sgstValue: number;
        cgstValue: number;
        cessValue: number;
    }> = [];

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
            this.branchName = '';
        } else {
            this.selectedBranchId = String(b.b_id);
            this.branchName = b.branch_name || '';
        }
        this.isBranchDropdownOpen = false;
        this.loadExecutiveOptions();
        this.cdr.detectChanges();
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (this.branchDropdownRef && !this.branchDropdownRef.nativeElement.contains(event.target)) {
            this.isBranchDropdownOpen = false;
        }
    }

    items: Array<{
        productId: number;
        productCode: string;
        codeSearch: string;
        description: string;
        basicPrice: number;
        qty: number;
        taxable: number;
        sgst: number;
        cgst: number;
        cess: number;
        amount: number;
    }> = [this.createEmptyItem()];

    constructor(private router: Router, private route: ActivatedRoute, private api: ApiService, private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.id = +params['id'];
            }
        });

        const user = this.api.getCurrentUser();
        if (user) {
            this.isAdmin.set(user.role == 1 || user.role_des === 'admin');
            this.branchName = user.branch_name || this.branchName;
            this.branchId = (user.branch_id || '').toString();
        }
        this.date = new Date().toISOString().slice(0, 10);
        this.loadProductOptions();

        this.api.getBranches().subscribe({
            next: (res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    this.branchOptions = res.data;
                    if (this.id) {
                        this.loadProformaData();
                    }
                }
            }
        });

        if (!this.id) {
            this.loadExecutiveOptions();
        }
    }

    get totals() {
        return this.items.reduce((acc, item) => {
            acc.taxable += this.toNumber(item.taxable);
            acc.sgst += this.toNumber(item.sgst);
            acc.cgst += this.toNumber(item.cgst);
            acc.cess += this.toNumber(item.cess);
            acc.amount += this.toNumber(item.amount);
            return acc;
        }, { taxable: 0, sgst: 0, cgst: 0, cess: 0, amount: 0 });
    }

    get grandTotal(): number {
        return this.toNumber(this.totals.amount) + this.toNumber(this.missell1Amount) + this.toNumber(this.missell2Amount) - this.toNumber(this.lessAmount);
    }

    private toNumber(v: any): number {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
    }

    private round2(v: number): number {
        return Math.round((this.toNumber(v) + Number.EPSILON) * 100) / 100;
    }

    private createEmptyItem() {
        return {
            productId: 0,
            productCode: '',
            codeSearch: '',
            description: '',
            basicPrice: 0,
            qty: 1,
            taxable: 0,
            sgst: 0,
            cgst: 0,
            cess: 0,
            amount: 0
        };
    }

    private loadProformaData(): void {
        this.api.getProforma(this.id).subscribe({
            next: (res: any) => {
                if (res && res.success && res.proforma) {
                    const p = res.proforma;
                    this.quotationNo = p.pro_quot_no || '';
                    if (p.pro_date) {
                        const d = new Date(p.pro_date);
                        if (!isNaN(d.getTime())) {
                            this.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        }
                    }
                    this.customerName = p.pro_cus_name || '';
                    this.customerAddress = p.pro_cus_address || '';
                    this.contactNo = p.pro_contact || p.pro_cus_phone || '';
                    this.reference = p.pro_ref || '';
                    this.paymentMode = p.pro_type_loan || 'Cash';
                    this.executive = p.pro_executive || '';

                    if (p.pro_branch) {
                        this.selectedBranchId = String(p.pro_branch);
                        const b = this.branchOptions.find(opt => String(opt.b_id) === this.selectedBranchId);
                        if (b) {
                            this.branchName = b.branch_name || '';
                        }
                        this.loadExecutiveOptions();
                    }

                    this.missell1Amount = this.toNumber(p.pro_missal1_amt);
                    this.missell2Amount = this.toNumber(p.pro_missal2_amt);
                    this.lessAmount = this.toNumber(p.pro_less);

                    if (res.items && res.items.length > 0) {
                        this.items = res.items.map((i: any) => ({
                            productId: Number(i.pro_product_id) || 0,
                            productCode: i.pro_product_code || '',
                            codeSearch: i.pro_product_code || '',
                            description: i.pro_product_descr || '',
                            basicPrice: this.toNumber(i.pro_prduct_bas_amt),
                            qty: Math.max(1, this.toNumber(i.pro_product_qty)),
                            taxable: this.toNumber(i.product_taxable_amt),
                            sgst: this.toNumber(i.pro_product_sgst),
                            cgst: this.toNumber(i.pro_product_cgst),
                            cess: this.toNumber(i.product_cess_amt),
                            amount: this.toNumber(i.pro_total)
                        }));
                    } else {
                        this.items = [this.createEmptyItem()];
                    }
                    this.cdr.detectChanges();
                }
            }
        });
    }

    private loadProductOptions(): void {
        this.api.getAllLabourCodes().subscribe({
            next: (res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    this.productOptions = res.data.map((r: any) => ({
                        productId: this.toNumber(r.labour_id),
                        code: (r.labour_code || '').toString().trim(),
                        description: (r.labour_title || '').toString().trim(),
                        salePrice: this.toNumber(r.sale_price),
                        sgstValue: this.toNumber(r.sgst),
                        cgstValue: this.toNumber(r.cgst),
                        cessValue: this.toNumber(r.cess)
                    })).filter((x: any) => x.code);
                    this.cdr.detectChanges();
                }
            }
        });
    }

    private taxRateFromDbValue(dbValue: number, salePrice: number): number {
        const v = this.toNumber(dbValue);
        const p = this.toNumber(salePrice);
        if (v <= 0 || p <= 0) return 0;
        // Legacy DB stores either percent (e.g. 9,14) or tax amount (e.g. 13734.63 for one unit).
        return v <= 100 ? (v / 100) : (v / p);
    }

    filteredProductOptions(searchText: string): Array<any> {
        const q = (searchText || '').toString().trim().toLowerCase();
        if (!q) return this.productOptions;
        return this.productOptions.filter(p =>
            p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
    }

    private loadExecutiveOptions(): void {
        this.api.getProformaExecutives(this.branchName).subscribe({
            next: (res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    this.executiveOptions = res.data
                        .map((x: any) => (x.name || x.e_first_name || '').toString().trim())
                        .filter((x: string) => !!x);
                    this.cdr.detectChanges();
                }
            }
        });
    }

    onCodeChange(index: number): void {
        const row = this.items[index];
        const code = (row.productCode || '').toString().trim();
        const selected = this.productOptions.find(p => p.code === code);
        if (!selected) {
            if (!code) {
                row.productId = 0;
                row.description = '';
                row.basicPrice = 0;
                this.recalculateRow(row);
            }
            return;
        }
        row.productCode = selected.code;
        row.productId = selected.productId || 0;
        row.description = selected.description || '';
        row.basicPrice = selected.salePrice || row.basicPrice || 0;
        this.recalculateRow(row);
    }

    recalculateRow(item: any): void {
        const qty = Math.max(1, this.toNumber(item.qty));
        const basic = this.toNumber(item.basicPrice);
        const taxable = this.round2(basic * qty);
        item.qty = qty;
        item.taxable = taxable;
        const selected = this.productOptions.find(p => p.code === item.productCode);
        const sgstRate = selected ? this.taxRateFromDbValue(selected.sgstValue, selected.salePrice) : 0;
        const cgstRate = selected ? this.taxRateFromDbValue(selected.cgstValue, selected.salePrice) : 0;
        const cessRate = selected ? this.taxRateFromDbValue(selected.cessValue, selected.salePrice) : 0;
        item.sgst = this.round2(taxable * sgstRate);
        item.cgst = this.round2(taxable * cgstRate);
        item.cess = this.round2(taxable * cessRate);
        item.amount = this.round2(item.taxable + item.sgst + item.cgst + item.cess);
    }

    addRow(): void {
        this.items.push(this.createEmptyItem());
    }

    removeRow(index: number): void {
        if (this.items.length <= 1) {
            Object.assign(this.items[0], this.createEmptyItem());
            return;
        }
        this.items.splice(index, 1);
    }

    onUpdate(): void {
        if (!this.quotationNo || !this.customerName) return;

        for (const item of this.items) this.recalculateRow(item);

        const payload = {
            proformaNo: this.quotationNo,
            proformaDate: this.date,
            customerName: this.customerName,
            address: this.customerAddress,
            phone: this.contactNo,
            paymentMode: this.paymentMode,
            reference: this.reference,
            executive: this.executive,
            branchId: this.selectedBranchId,
            missell1: this.missell1,
            missell1Amount: this.toNumber(this.missell1Amount),
            missell2: this.missell2,
            missell2Amount: this.toNumber(this.missell2Amount),
            lessAmount: this.toNumber(this.lessAmount),
            totalAmount: this.grandTotal,
            totals: {
                taxable: this.totals.taxable,
                sgst: this.totals.sgst,
                cgst: this.totals.cgst,
                cess: this.totals.cess,
                amount: this.totals.amount,
                grandTotal: this.grandTotal
            },
            items: this.items
                .filter(i => i.productCode || i.description || this.toNumber(i.basicPrice) > 0)
                .map(i => ({
                    productId: i.productId || 0,
                    productCode: i.productCode || '',
                    productDesc: i.description || '',
                    baseAmount: this.toNumber(i.basicPrice),
                    qty: Math.max(1, this.toNumber(i.qty)),
                    taxableAmount: this.toNumber(i.taxable),
                    sgst: this.toNumber(i.sgst),
                    cgst: this.toNumber(i.cgst),
                    cess: this.toNumber(i.cess),
                    total: this.toNumber(i.amount)
                }))
        };

        this.isSaving = true;
        this.api.updateProforma(this.id, payload).subscribe({
            next: (res: any) => {
                this.isSaving = false;
                if (res?.success) {
                    this.navigate('/previous-proforma-invoice');
                } else {
                    alert(res.message || 'Failed to update');
                }
            },
            error: () => {
                this.isSaving = false;
                alert('Error during update');
            }
        });
    }

    navigate(path: string): void {
        this.router.navigate([path]);
    }
}
