import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-vsi-invoice',
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
        <span>VSI</span>
        <span> > </span>
        <span class="active">TAX INVOICE</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
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
                    <input type="text" class="form-control readonly" [value]="branchName" readonly>
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
                    <input type="text" class="form-control readonly" [value]="invoiceNo" readonly>
                </div>
                <div class="form-col">
                    <label>Customer GSTIN:</label>
                    <input type="text" class="form-control" [(ngModel)]="gstin" name="gstin">
                </div>
                <div class="form-col">
                    <label>Mobile Number:</label>
                    <input type="text" class="form-control" [(ngModel)]="mobile" name="mobile">
                </div>
                <div class="form-col">
                    <!-- Empty 4th col in row 2 based on image -->
                </div>
             </div>

             <!-- Row 3 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Invoice Date:</label>
                    <div class="date-input-wrapper">
                         <input type="text" class="form-control" [value]="invoiceDate" readonly>
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
        flex: 1; /* Input takes remaining space */
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
  `]
})
export class VsiInvoiceComponent implements OnInit {
    isAdmin = signal(false);
    branchName = 'SARATHY KOLLAM KTM';
    invoiceNo = 'VSI2026131770001';
    invoiceDate = '19-02-2026';

    salesInvoiceNo = '';
    customerName = '';
    address = '';
    gstin = '';
    mobile = '';

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
        this.isAdmin.set(user?.role == 1 || user?.role_des === 'admin');
    }

    navigate(path: string) { this.router.navigate([path]); }
}
