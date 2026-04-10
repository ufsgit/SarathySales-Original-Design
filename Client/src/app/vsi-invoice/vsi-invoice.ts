import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';
import { NumericOnlyDirective } from '../numeric-only.directive';

@Component({
    selector: 'app-vsi-invoice',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter, NumericOnlyDirective],
    template: `
<div class="app-container" (click)="closeDropdowns()">
  <app-user-nav></app-user-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a (click)="navigate(isAdmin() ? '/admin-home' : '/user-home')"><i class="fas fa-home"></i> Home</a>
        <span> > </span>
        <span>VSI</span>
        <span> > </span>
        <span class="active">TAX INVOICE</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
           <div class="header-left">
             <h2>VSI TAX INVOICE</h2>
          </div>
          <div class="header-actions">
             <button class="btn-save" (click)="$event.preventDefault()">Save Bill</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="ledger-form">
            
            <!-- Row 1 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Branch Name:</label>
                    <ng-container *ngIf="isAdmin(); else staffBranch">
                        <div class="custom-dropdown" (click)="$event.stopPropagation()">
                            <div class="dropdown-toggle" (click)="toggleBranchDropdown()">
                                {{ branchName() }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isBranchDropdownOpen()">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search branch..."
                                        [ngModel]="branchSearchTerm()"
                                        (ngModelChange)="branchSearchTerm.set($event)"
                                        name="branchSearch"
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
                <div class="form-col">
                    <label>Sales Invoice No:</label>
                    <input type="text" class="form-control" [(ngModel)]="salesInvoiceNo" name="salesInvoiceNo">
                </div>
                <div class="form-col">
                    <label>Customer Name:</label>
                    <input type="text" class="form-control" [(ngModel)]="customerName" name="customerName">
                </div>
                <div class="form-col">
                    <label>Customer Address:</label>
                    <input type="text" class="form-control" [(ngModel)]="address" name="address">
                </div>
            </div>

            <!-- Row 2 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Invoice No:</label>
                    <input type="text" class="form-control readonly" [value]="invoiceNo()" readonly>
                </div>
                <div class="form-col">
                    <label>Customer GSTIN:</label>
                    <input type="text" class="form-control" [(ngModel)]="gstin" name="gstin">
                </div>
                <div class="form-col">
                    <label>Mobile Number:</label>
                    <input type="tel" class="form-control" numericOnly [(ngModel)]="mobile" name="mobile" maxlength="10" pattern="[0-9]*" inputmode="numeric" (input)="mobile = $any($event.target).value.replace(/[^0-9]/g, '').slice(0,10)">
                </div>
                <div class="form-col">
                    <label>Post:</label>
                    <div class="custom-dropdown" (click)="$event.stopPropagation()">
                        <div class="dropdown-toggle" (click)="togglePostDropdown()">
                            {{ post() || '--Select--' }}
                            <i class="fas fa-caret-down"></i>
                        </div>
                        <div class="dropdown-menu" *ngIf="isPostDropdownOpen()">
                            <div class="dropdown-search">
                                <input type="text" placeholder="Search post..."
                                    [ngModel]="postSearchTerm()"
                                    (ngModelChange)="postSearchTerm.set($event)"
                                    name="postSearch"
                                    (click)="$event.stopPropagation()">
                            </div>
                            <div class="dropdown-options-list">
                                <div class="dropdown-option"
                                    *ngFor="let p of searchablePostList()"
                                    (click)="onPostSelect(p)">
                                    {{ p.label }}
                                </div>
                                <div class="dropdown-option no-results"
                                    *ngIf="searchablePostList().length === 0">
                                    No results found
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

            <!-- Row 3 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Invoice Date:</label>
                    <div class="date-input-wrapper">
                         <input type="text" class="form-control" [value]="invoiceDate()" readonly>
                    </div>
                </div>
                 <div class="form-col"></div>
                 <div class="form-col"></div>
                 <div class="form-col"></div>
             </div>

             <!-- Total Payable Section -->
             <div class="total-payable-section">
                <span>Total Payable Amount : Rs 00.00</span>
             </div>

             <!-- Grey Bar Spacer -->
             <div class="grey-spacer-bar">
                 <button class="btn-print-small">Print</button>
             </div>

             <!-- Table Section -->
             <div class="table-responsive">
                <table class="item-table">
                    <thead>
                        <tr>
                            <th style="width: 30%;">Particular</th>
                            <th>Rate</th>
                            <th>Taxable Amt</th>
                            <th>SGST/UTGST %</th>
                            <th>SGST/UTGST</th>
                            <th>CGST %</th>
                            <th>CGST</th>
                            <th>CESS %</th>
                            <th>CESS</th>
                            <th>Amount</th>
                            <th><button class="btn-plus" (click)="addRow()">+</button></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let item of invoiceItems; let i = index">
                            <td><input type="text" class="table-input" [(ngModel)]="item.particular" [name]="'particular' + i"></td>
                            <td><input type="text" class="table-input small-input" [(ngModel)]="item.rate" [name]="'rate' + i"></td>
                            <td><input type="text" class="table-input" [(ngModel)]="item.taxableAmt" [name]="'taxableAmt' + i"></td>
                            <td><input type="text" class="table-input small-input" [(ngModel)]="item.sgstPercent" [name]="'sgstPercent' + i"></td>
                            <td><input type="text" class="table-input" [(ngModel)]="item.sgstAmt" [name]="'sgstAmt' + i"></td>
                            <td><input type="text" class="table-input small-input" [(ngModel)]="item.cgstPercent" [name]="'cgstPercent' + i"></td>
                             <td><input type="text" class="table-input" [(ngModel)]="item.cgstAmt" [name]="'cgstAmt' + i"></td>
                             <td><input type="text" class="table-input small-input" [(ngModel)]="item.cessPercent" [name]="'cessPercent' + i"></td>
                            <td><input type="text" class="table-input" [(ngModel)]="item.cessAmt" [name]="'cessAmt' + i"></td>
                             <td><input type="text" class="table-input" [(ngModel)]="item.amount" [name]="'amount' + i"></td>
                            <td class="action-cell">
                                <button class="btn-minus" (click)="removeRow(i)">-</button>
                            </td>
                        </tr>
                        <!-- Totals Row in Table Body/Foot -->
                         <tr class="totals-tr">
                            <td style="text-align: right; font-weight: bold;">Total</td>
                            <td></td>
                            <td><input type="text" class="table-input total-input" value="00.00" readonly></td>
                            <td></td>
                            <td><input type="text" class="table-input total-input" value="00.00" readonly></td>
                            <td></td>
                           <td><input type="text" class="table-input total-input" value="00.00" readonly></td>
                             <td></td>
                           <td><input type="text" class="table-input total-input" value="00.00" readonly></td>
                           <td><input type="text" class="table-input total-input" value="00.00" readonly></td>
                           <td></td>
                        </tr>
                    </tbody>
                </table>
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

    .btn-save {
        background-color: #b71c1c; /* Dark Red button */
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
        gap: 15px; 
    }

    .form-grid-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        align-items: center; 
    }

    .form-col {
        display: flex;
        align-items: center; 
        gap: 10px;
        justify-content: flex-end; 
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
        flex: 1;
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 100%;
        max-width: 180px; 
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        height: 28px;
    }
    
    .form-control.readonly {
        background-color: #eee;
        color: #555;
    }

    /* Custom Dropdown Styles (Searchable) */
    .custom-dropdown {
        position: relative;
        flex: 1;
        max-width: 180px;
        width: 100%;
    }
    .dropdown-toggle {
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 3px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 28px;
    }
    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-top: 2px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .dropdown-search {
        padding: 8px;
        border-bottom: 1px solid #eee;
    }
    .dropdown-search input {
        width: 100%;
        border: 1px solid #ddd;
        padding: 4px 8px;
        font-size: 11px;
    }
    .dropdown-options-list {
        max-height: 200px;
        overflow-y: auto;
    }
    .dropdown-option {
        padding: 8px 12px;
        font-size: 11px;
        cursor: pointer;
    }
    .dropdown-option:hover {
        background-color: #f1f5f9;
        color: #f36f21;
    }
    .dropdown-option.no-results {
        color: #999;
        cursor: default;
    }

    .date-input-wrapper {
        position: relative;
        flex: 1;
        max-width: 180px;
    }
    .date-input-wrapper .form-control {
        max-width: 100%;
    }


    /* Total Payable Section */
    .total-payable-section {
        margin-top: 10px;
        font-weight: bold;
        color: #333;
        font-size: 14px;
    }

    /* Grey Spacer Bar */
    .grey-spacer-bar {
        background: #f5f5f5;
        height: 40px;
        margin: 10px 0 20px 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 20px;
    }

    .btn-print-small {
        background: #b71c1c; /* Dark Red */
        color: white;
        font-size: 11px;
        border: none;
        padding: 4px 12px;
        cursor: pointer;
        font-weight: bold;
    }

    /* Table Styles */
    .table-responsive {
        width: 100%;
        overflow-x: auto;
    }
    .item-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
    }
    .item-table th {
        text-align: left;
        color: #555;
        font-weight: 600;
        padding: 5px;
    }
    .item-table td {
        padding: 5px;
    }
    
    .table-input {
        width: 100%;
        border: 1px solid #ccc;
        padding: 4px;
        font-size: 11px;
    }
    .small-input {
        width: 40px;
    }
    .total-input {
        background: #eee;
        border: 1px solid #ccc;
    }

    .action-cell {
        text-align: center;
    }
    .btn-minus, .btn-plus {
        background: none;
        border: none;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
    }
  `]
})
export class VsiInvoiceComponent implements OnInit {
    isAdmin = signal(false);
    salesInvoiceNo = '';
    customerName = '';
    address = '';
    post = signal('');
    gstin = '';
    mobile = '';
    invoiceNo = signal('VSI2026131770001');
    invoiceDate = signal('19-02-2026');

    // Branch selection for Admins
    selectedBranchId = signal<string | number>('');
    branchName = signal('Select Branch');
    branches = signal<any[]>([]);
    isBranchDropdownOpen = signal(false);
    branchSearchTerm = signal('');

    // Post selection (Static)
    postOptions = signal<string[]>([
        'Kollam', 'Pallimukku', 'Chathannoor', 'Kottiyam', 'Mevaram', 
        'Ayathil', 'Eravipuram', 'Mundanakkal', 'Paravur', 'Parippally'
    ]);
    isPostDropdownOpen = signal(false);
    postSearchTerm = signal('');

    searchableBranchList = computed(() => {
        const query = this.branchSearchTerm().toLowerCase().trim();
        return this.branches().filter(b => b.branch_name.toLowerCase().includes(query));
    });

    searchablePostList = computed(() => {
        const query = this.postSearchTerm().toLowerCase().trim();
        return this.postOptions().filter(p => p.toLowerCase().includes(query)).map(p => ({ label: p, value: p }));
    });

    invoiceItems = [
        { particular: '', rate: '', taxableAmt: '', sgstPercent: '', sgstAmt: '', cgstPercent: '', cgstAmt: '', cessPercent: '', cessAmt: '', amount: '' }
    ];

    addRow() {
        this.invoiceItems.push({ particular: '', rate: '', taxableAmt: '', sgstPercent: '', sgstAmt: '', cgstPercent: '', cgstAmt: '', cessPercent: '', cessAmt: '', amount: '' });
    }

    removeRow(index: number) {
        if (this.invoiceItems.length === 1) {
            this.invoiceItems[0] = { particular: '', rate: '', taxableAmt: '', sgstPercent: '', sgstAmt: '', cgstPercent: '', cgstAmt: '', cessPercent: '', cessAmt: '', amount: '' };
        } else {
            this.invoiceItems.splice(index, 1);
        }
    }

    constructor(private router: Router, private api: ApiService) { }

    ngOnInit(): void {
        const user = this.api.getCurrentUser();
        if (user) {
            this.isAdmin.set(user.role == 1 || user.role_des === 'admin');
            if (this.isAdmin()) {
                this.loadBranches();
            } else {
                this.branchName.set(user.branch_name || 'SARATHY KOLLAM KTM');
                this.selectedBranchId.set(user.branch_id || '');
            }
        }
    }

    loadBranches() {
        this.api.getBranches().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.branches.set(res.data || []);
                }
            }
        });
    }

    toggleBranchDropdown() { this.isBranchDropdownOpen.update(v => !v); }
    onBranchSelect(b: any) {
        this.selectedBranchId.set(b.b_id);
        this.branchName.set(b.branch_name);
        this.isBranchDropdownOpen.set(false);
    }

    togglePostDropdown() { this.isPostDropdownOpen.update(v => !v); }
    onPostSelect(p: any) {
        this.post.set(p.value);
        this.isPostDropdownOpen.set(false);
    }
    
    closeDropdowns() {
        this.isBranchDropdownOpen.set(false);
        this.isPostDropdownOpen.set(false);
    }

    navigate(path: string) { this.router.navigate([path]); }
}
