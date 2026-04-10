import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';
import { UppercaseDirective } from '../uppercase.directive';

@Component({
    selector: 'app-vsi-report',
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
        <span>List VSI Report</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
          
          <h2>List VSI Report</h2>
        </header>

        <div class="page-card-content">
          
          <!-- Filter Area -->
          <div class="filter-area centered-filter">
             <div class="filter-row">
                 <label>Branch</label>
                 <div class="custom-dropdown" [class.active]="isBranchDropdownOpen()" [class.disabled]="!isAdmin()">
                    <div class="dropdown-selected" (click)="toggleBranchDropdown()">
                        <span [class.placeholder]="branchName() === 'Select Branch'">{{ branchName() || 'Select Branch' }}</span>
                        <i class="fas fa-chevron-down arrow"></i>
                    </div>
                    <div class="dropdown-menu" *ngIf="isBranchDropdownOpen()">
                        <div class="search-container">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Search branch..." [ngModel]="branchSearchTerm()" (ngModelChange)="branchSearchTerm.set($event)" (click)="$event.stopPropagation()">
                        </div>
                        <div class="options-container">
                            <div class="option" *ngFor="let branch of filteredBranches()" (click)="selectBranch(branch)">
                                <span class="branch-name">{{ branch.branch_name }}</span>
                                <span class="branch-id">({{ branch.b_id }})</span>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
             <div class="filter-row">
                 <label>Search Option</label>
                 <select class="form-control" [ngModel]="searchOption()" (change)="onSearchOptionChange($event)">
                     <option value="Custom Date">Custom Date</option>
                     <option value="Month to Date">Month to Date</option>
                     <option value="Previous Month">Previous Month</option>
                     <option value="Year to Date">Year to Date</option>
                     <option value="Previous Year">Previous Year</option>
                 </select>
             </div>
             <div class="filter-row date-row">
                 <div class="date-group">
                     <label>Date From</label>
                     <div class="date-input-wrapper">
                        <input type="date" class="form-control" [ngModel]="fromDate()" (ngModelChange)="fromDate.set($event)" [disabled]="searchOption() !== 'Custom Date'">
                     </div>
                 </div>
                 <div class="date-group">
                     <label>Date To</label>
                     <div class="date-input-wrapper">
                        <input type="date" class="form-control" [ngModel]="toDate()" (ngModelChange)="toDate.set($event)" [disabled]="searchOption() !== 'Custom Date'">
                     </div>
                 </div>
             </div>
          </div>

          <!-- Controls Row -->
          <div class="controls-row">
            <div class="export-buttons">
                <button class="btn-csv">CSV</button>
                <button class="btn-excel">Excel</button>
            </div>
            <div class="entries-box">
               <label>Show</label>
               <select>
                 <option>10</option>
               </select>
               <label>entries</label>
            </div>
          </div>

          <!-- Table -->
          <div class="table-responsive">
            <table class="theme-table">
              <thead>
                <!-- Column Filters Row -->
                <tr class="filters-tr">
                    <th><label for="invoiceNo">Invoice No</label></th>
                    <th><label for="invoiceDate">Invoice Date</label></th>
                    <th><label for="branchName">Branch Name</label></th>
                    <th><label for="customerName">Invoice Customer</label></th>
                    <th><label for="mobileNumber">Mobile Number</label></th>
                    <th><label for="address">Address</label></th>
                    <th><label for="saleInvoiceNo">Sale Invoice No</label></th>
                    <th><label for="customerGS1">Customer GSTN</label></th>
                    <th><label for="taxableAmount">Taxable Amount</label></th>
                    <th><label for="sgstAmount">SGST/UTGST(9)</label></th>
                    <th><label for="cgstAmount">CGST(9)</label></th>
                    <th><label for="cessAmount">CESS</label></th>
                    <th><label for="invoiceAmount">Invoice Amount</label></th>
                </tr>
              </thead>
              <tbody>
                <tr class="no-data-row">
                    <td colspan="13" class="no-data">No data available in table</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer Pagination -->
          <div class="table-footer">
             <div class="showing-text">
               Showing 0 to 0 of 0 entries
             </div>
             <div class="pagination-controls">
                <button class="page-btn" disabled>Previous</button>
                <button class="page-btn" disabled>Next</button>
             </div>
          </div>
          
          <div class="totals-footer-area">

            <div class="total-group">
                <label>Total SGST/UTGST(9) Amount</label>
                <input type="text" value="0.00" readonly>
            </div>

            <div class="total-group">
                <label>Total Taxable Amount</label>
                <input type="text" value="0.00" readonly>
            </div>

            <div class="total-group">
                <label>Total CESS</label>
                <input type="text" value="0.00" readonly>
            </div>

            <!-- Wrap CGST + Invoice -->
            <div class="cgst-invoice-column">
                <div class="total-group">
                    <label>Total CGST Amount</label>
                    <input type="text" value="0.00" readonly>
                </div>

                <div class="total-group-stacked">
                    <label>Total Invoice Amount</label>
                    <input type="text" value="0.00" readonly>
                </div>
            </div>

        </div>

        </div>
      </div>
    </div>
  </main>
  
  <div style="height: 50px;"></div>
  <app-user-footer></app-user-footer>
</div>
  `,
    styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    :host {
        --primary: #0f172a;
        --accent: #3b82f6;
        --bg: #f8fafc;
        --surface: #ffffff;
        --text-main: #111827;
        --text-muted: #6b7280;
        --border: #eef2f6;
        --orange: #f36f21;
        --red: #d32f2f;
        display: block;
    }

    .app-container {
        font-family: 'Plus Jakarta Sans', sans-serif;
        background-color: var(--bg);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        color: var(--text-main);
    }

    .page-container {
        padding: 0;
    }

    .page-content-wrapper {
        width: 100%;
        padding: 0 20px;
    }

    /* Breadcrumb */
    .breadcrumb-bar {
        font-size: 12px;
        color: var(--text-muted);
        padding: 15px 0;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .breadcrumb-bar a { 
        color: var(--text-muted); 
        text-decoration: none; 
        cursor: pointer;
        transition: color 0.2s;
    }
    .breadcrumb-bar a:hover { color: var(--orange); }

    /* Card & Header */
    .theme-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        margin-bottom: 20px;
    }

    .orange-header-strip {
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;
    }
    
    .menu-icon {
        font-size: 14px;
        background: rgba(255, 255, 255, 0.2);
        padding: 8px;
        border-radius: 6px;
    }

    .orange-header-strip h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    /* Content Area */
    .page-card-content {
        padding: 24px;
        background: var(--surface);
    }
    
    /* Filter Area */
    .centered-filter {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        margin-bottom: 32px;
        padding: 20px;
        background: #fdfdfd;
        border: 1px solid #f1f5f9;
        border-radius: 8px;
    }
    
    .filter-row {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
        max-width: 600px;
    }
    .filter-row label {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-main);
        min-width: 100px;
        text-align: right;
    }
    .form-control {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 13px;
        background: #fff;
        transition: all 0.2s;
        height: 38px;
    }
    .form-control:focus {
        border-color: var(--orange);
        box-shadow: 0 0 0 3px rgba(243, 111, 33, 0.1);
        outline: none;
    }
    .form-control[disabled] {
        background: #f8fafc;
        color: var(--text-muted);
        cursor: not-allowed;
    }
    
    .date-row {
        justify-content: center;
        gap: 24px;
    }
    .date-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .date-input-wrapper {
        position: relative;
    }
    .date-input-wrapper .form-control {
        min-width: 140px;
        padding-right: 35px;
    }
    .calendar-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        font-size: 14px;
        pointer-events: none;
    }

    /* Controls */
    .controls-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 0 4px;
    }
    
    .export-buttons {
        display: flex;
        gap: 8px;
    }
    .btn-csv, .btn-excel {
        background: #fff;
        border: 1px solid #e2e8f0;
        padding: 6px 16px;
        font-size: 12px;
        cursor: pointer;
        color: var(--text-main);
        font-weight: 600;
        border-radius: 6px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .btn-csv:hover, .btn-excel:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
    }
    
    .entries-box {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--red);
        font-weight: 600;
    }
    .entries-box select {
        padding: 4px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        color: var(--text-main);
        font-weight: 600;
        outline: none;
    }

    /* Table */
    .table-responsive {
        width: 100%;
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-bottom: 16px;
    }
    
    .theme-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }
    
    .theme-table thead th {
        background: #f8fafc;
        padding: 12px 16px;
        text-align: left;
        font-weight: 700;
        color: var(--text-main);
        border-bottom: 2px solid var(--border);
        white-space: nowrap;
    }

    .filters-tr th {
        padding: 8px;
        background: #f1f5f9;
    }
    .filters-tr label {
        font-size: 11px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .no-data {
        text-align: center;
        padding: 40px;
        background: #fff;
        font-weight: 700;
        font-size: 15px;
        color: var(--red);
        text-transform: lowercase;
    }

    /* Pagination */
    .table-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        padding: 0 4px;
    }
    
    .showing-text {
        font-size: 13px;
        color: var(--red);
        font-weight: 600;
    }
    
    .pagination-controls {
        display: flex;
        gap: 8px;
    }
    
    .page-btn {
        background: #fff;
        border: 1px solid #e2e8f0;
        color: var(--text-main);
        padding: 6px 12px;
        font-size: 13px;
        cursor: pointer;
        font-weight: 600;
        border-radius: 6px;
        transition: all 0.2s;
    }
    .page-btn:not(:disabled):hover {
        background: #f8fafc;
        border-color: #cbd5e1;
    }
    .page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Totals Footer */
    .totals-footer-area {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        padding: 24px;
        background: #f8fafc;
        border: 1px solid var(--border);
        border-radius: 12px;
    }
    
    .total-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .total-group label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .total-group input {
        padding: 10px 14px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 700;
        color: var(--text-main);
        width: 100%;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .cgst-invoice-column {
        display: flex;
        flex-direction: column;
        gap: 20px;
        grid-column: span 1;
    }

    .total-group-stacked {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .total-group-stacked label {
        font-size: 12px;
        font-weight: 700;
        color: var(--orange);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .total-group-stacked input {
        padding: 12px 14px;
        background: #fff;
        border: 2px solid var(--orange);
        border-radius: 8px;
        font-size: 18px;
        font-weight: 800;
        color: var(--orange);
        width: 100%;
    }

    .custom-dropdown {
        flex: 1;
        position: relative;
        cursor: pointer;
    }

    .dropdown-selected {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 13px;
        height: 38px;
    }

    .custom-dropdown.active .dropdown-selected {
        border-color: var(--orange);
        box-shadow: 0 0 0 3px rgba(243, 111, 33, 0.1);
    }

    .placeholder {
        color: var(--text-muted);
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid var(--orange);
        border-radius: 6px;
        margin-top: 4px;
        z-index: 1000;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .search-container {
        padding: 10px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .search-container i {
        color: var(--text-muted);
        font-size: 12px;
    }

    .search-container input {
        border: none;
        outline: none;
        width: 100%;
        font-size: 13px;
        color: var(--text-main);
    }

    .options-container {
        max-height: 250px;
        overflow-y: auto;
    }

    .option {
        padding: 10px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        transition: background 0.2s;
    }

    .option:hover {
        background: #fff5ed;
        color: var(--orange);
    }

    .branch-name {
        font-weight: 500;
    }

    .branch-id {
        color: var(--text-muted);
        font-size: 11px;
    }

    .custom-dropdown.disabled {
        pointer-events: none;
        opacity: 0.8;
    }

    .custom-dropdown.disabled .dropdown-selected {
        background: #f8fafc;
        color: var(--text-muted);
    }

    @media (max-width: 1024px) {
        .totals-footer-area {
            grid-template-columns: 1fr 1fr;
        }
    }

    @media (max-width: 768px) {
        .page-content-wrapper { padding: 0 12px; }
        .filter-row { flex-direction: column; align-items: stretch; gap: 8px; }
        .filter-row label { text-align: left; }
        .date-row { flex-direction: column; }
        .controls-row { flex-direction: column; gap: 16px; align-items: flex-start; }
        .totals-footer-area { grid-template-columns: 1fr; padding: 16px; }
    }
  `]
})
export class VsiReportComponent implements OnInit {
    isAdmin = signal(false);
    branchId = signal('');
    branchName = signal('');
    
    // Search and Filter signals
    searchOption = signal('Custom Date');
    fromDate = signal(new Date().toISOString().split('T')[0]);
    toDate = signal(new Date().toISOString().split('T')[0]);
    
    branches = signal<any[]>([]);
    isBranchDropdownOpen = signal(false);
    branchSearchTerm = signal('');

    // Filtered branches for the searchable dropdown
    filteredBranches = computed(() => {
        const term = this.branchSearchTerm().toLowerCase();
        return this.branches().filter(b => 
            b.branch_name.toLowerCase().includes(term) || 
            b.b_id.toString().includes(term)
        );
    });

    constructor(private router: Router, private api: ApiService) { }

    ngOnInit() {
        const user = this.api.getCurrentUser();
        if (user) {
            this.isAdmin.set(user.role == 1 || user.role_des === 'admin');
            this.branchId.set(user.branch_id || '');
            this.branchName.set(user.branch_name || 'No Branch');

            if (this.isAdmin()) {
                this.loadBranches();
            }
        }
    }

    loadBranches() {
        this.api.getBranches().subscribe({
            next: (res) => {
                if (res.success) {
                    this.branches.set(res.data || []);
                }
            },
            error: (err) => console.error('Error fetching branches:', err)
        });
    }

    toggleBranchDropdown() {
        if (!this.isAdmin()) return;
        this.isBranchDropdownOpen.update(v => !v);
        if (this.isBranchDropdownOpen()) {
            this.branchSearchTerm.set('');
        }
    }

    selectBranch(branch: any) {
        this.branchId.set(branch.b_id);
        this.branchName.set(branch.branch_name);
        this.isBranchDropdownOpen.set(false);
    }

    onSearchOptionChange(event: any) {
        const option = event.target.value;
        this.searchOption.set(option);
        this.updateDateRange(option);
    }

    updateDateRange(option: string) {
        const today = new Date();
        let from = new Date();
        let to = new Date();

        switch (option) {
            case 'This Month':
            case 'Month to Date':
                from = new Date(today.getFullYear(), today.getMonth(), 1);
                to = today;
                break;
            case 'Previous Month':
                from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                to = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'Year to Date':
                from = new Date(today.getFullYear(), 0, 1);
                to = today;
                break;
            case 'Previous Year':
                from = new Date(today.getFullYear() - 1, 0, 1);
                to = new Date(today.getFullYear() - 1, 11, 31);
                break;
            case 'Custom Date':
            default:
                return;
        }

        this.fromDate.set(this.formatDate(from));
        this.toDate.set(this.formatDate(to));
    }

    formatDate(date: Date): string {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    navigate(path: string) { this.router.navigate([path]); }
}
