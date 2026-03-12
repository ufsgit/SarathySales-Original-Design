import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-vsi-report',
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
        <span>List VSI Report</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
          <i class="fas fa-th menu-icon"></i>
          <h2>List VSI Report</h2>
        </header>

        <div class="page-card-content">
          
          <!-- Filter Area -->
          <div class="filter-area centered-filter">
             <div class="filter-row">
                 <label>Branch</label>
                 <select class="form-control" disabled [ngModel]="branchId()">
                     <option [value]="branchId()">{{branchName()}} ({{branchId()}})</option>
                 </select>
             </div>
             <div class="filter-row">
                 <label>Search Option</label>
                 <select class="form-control">
                     <option>Custom Date</option>
                 </select>
             </div>
             <div class="filter-row date-row">
                 <div class="date-group">
                     <label>Date From</label>
                     <div class="date-input-wrapper">
                        <input type="text" class="form-control" value="19-02-2026">
                        <i class="fas fa-calendar-alt calendar-icon"></i>
                     </div>
                 </div>
                 <div class="date-group">
                     <label>Date To</label>
                     <div class="date-input-wrapper">
                        <input type="text" class="form-control" value="19-02-2026">
                        <i class="fas fa-calendar-alt calendar-icon"></i>
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
          
          <!-- Scrollbar visual simulation for empty table screenshot match -->
          <!-- <div class="scrollbar-sim">
             <div class="scrollbar-track"></div>
          </div> -->

          
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
        align-items: center;
        gap: 10px;
        color: white;
    }
    
    .menu-icon {
        font-size: 14px;
        background: #d85c15;
        padding: 6px;
        border-radius: 3px;
    }

    .orange-header-strip h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        text-transform: capitalize;
    }

    /* Content Area */
    .page-card-content {
        padding: 10px; /* Reduced padding */
        background: #fff; /* White bg */
    }
    
    /* Filter Area */
    .centered-filter {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px; /* Tighter gap */
        margin-bottom: 20px;
        padding-top: 10px;
    }
    
    .filter-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .filter-row label {
        font-size: 13px;
        color: #333;
        min-width: 90px;
        text-align: right;
    }
    .form-control {
        padding: 4px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 12px;
        min-width: 220px;
        background: #eee; /* Grey input bg from screenshot */
    }
    
    .date-row {
        gap: 40px; /* Space between date fields */
        margin-top: 5px;
    }
    .date-group {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .date-input-wrapper {
        position: relative;
    }
    .date-input-wrapper .form-control {
        min-width: 130px;
        padding-right: 25px;
        background: #fff; /* Date inputs white? Hard to tell, stick to white for contrast or grey */
    }
    .calendar-icon {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        color: #777;
        font-size: 12px;
    }

    /* Controls */
    .controls-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px; /* Close to table */
    }
    
    .export-buttons {
        display: flex;
        gap: 2px;
    }
    .btn-csv, .btn-excel {
        background: #f0f0f0;
        border: 1px solid #ccc;
        padding: 3px 8px;
        font-size: 11px;
        cursor: pointer;
        color: #333;
        font-weight: 600;
    }
    
    .entries-box {
        display: flex;
        align-items: flex-end; /* Bottom align text */
        gap: 5px;
        font-size: 13px;
        color: #d32f2f; /* Red "Show" "entries" text */
    }
    .entries-box select {
        padding: 2px;
        border: 1px solid #ccc;
        color: #333;
    }

    /* Table */
    .table-responsive {
        width: 100%;
        overflow-x: auto;
        border-top: 2px solid #000; /* Distinct top border */
        border-bottom: 2px solid #000; /* Distinct bottom border */
        margin-bottom: 5px;
    }
    
    .theme-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }
    
    .filters-tr th {
        min-width: 120px;
        padding: 8px 5px;
        background: #e0e0e0; /* Grey header bg */
        border-right: 1px solid #ccc;
    }
    .filters-tr input {
        width: 100%;
        padding: 4px;
        border: 1px solid #bbb;
        font-size: 11px;
    }
    
    .no-data {
        text-align: center;
        padding: 8px;
        background: #fff;
        font-weight: 500;
        font-size: 13px;
        color: #333;
    }

    /* Pagination Text below table */
    .table-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px; /* Space before scrollbar */
    }
    
    .showing-text {
        font-size: 12px;
        color: #d32f2f; /* Red text */
    }
    
    .pagination-controls {
        display: flex;
        gap: 10px;
    }
    
    .page-btn {
        background: none;
        border: none;
        color: #666;
        font-size: 13px;
        cursor: pointer;
        font-weight: 500;
    }
    
    /* Scrollbar Sim */
    .scrollbar-sim {
        height: 15px;
        background: #e0e0e0;
        border-radius: 10px;
        margin-bottom: 20px;
        position: relative;
    }
    .scrollbar-track {
        height: 100%;
        width: 60%; /* fake width */
        background: #909090; /* Darker grey handle */
        border-radius: 10px;
    }

    /* Totals Footer */
    .totals-footer-area {
        min-height: 100px;
        padding-left: 10vh;
        display: flex;
        justify-content: flex-start; /* Right align */
        align-items: flex-start; /* Align bottom */
        gap: 20px;
        flex-wrap: wrap;
        font-size: 14px;
        font-weight: 700;
        color: #333;
    }
    
    .total-group-stacked {
        padding-top: 10px;
        display: flex;
        align-items: end;
        justify-content: flex-end;
        gap: 5px;
    }
    .total-group {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .total-group-stacked input,
    .total-group input {
        width: 150px;
        background: #eee;
        border: 1px solid #ccc;
        padding: 3px;
        font-size: 12px;
    }
    
    .total-group.stacked {
        flex-direction: column; /* Stack label */
        align-items: flex-start;
        max-width: 80px; 
    }
    .total-group.stacked label {
        line-height: 1.2;
    }


    @media (max-width: 768px) {
        .filter-area {
            align-items: flex-start;
        }
        .filter-row {
            flex-direction: column;
            align-items: flex-start;
        }
         .date-row {
            flex-direction: column;
        }
        .controls-row {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
        }
        .table-responsive {
            overflow-x: scroll;
        }
        .totals-footer-area {
            flex-direction: column;
            align-items: flex-start;
        }
    }
  `]
})
export class VsiReportComponent implements OnInit {
    isAdmin = signal(false);
    branchId = signal('');
    branchName = signal('');

    constructor(private router: Router, private api: ApiService) { }

    ngOnInit() {
        const user = this.api.getCurrentUser();
        if (user) {
            this.isAdmin.set(user.role == 1 || user.role_des === 'admin');
            this.branchId.set(user.branch_id || '');
            this.branchName.set(user.branch_name || 'No Branch');
        }
    }

    navigate(path: string) { this.router.navigate([path]); }
}
