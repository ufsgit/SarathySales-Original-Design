import { Component, OnInit, signal, computed, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-proforma-invoice',
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
        <span>INVOICE</span>
        <span> > </span>
        <span class="active">Proforma</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>INVOICE (Proforma)</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="navigate('/previous-proforma-invoice')">List Proforma Invoice</button>
          </div>
        </header>

        <div class="page-card-content">
          <div *ngIf="successMessage()" class="alert-msg success">{{ successMessage() }}</div>
          <div *ngIf="errorMessage()" class="alert-msg error">{{ errorMessage() }}</div>
          <form class="ledger-form">
            
            <!-- Row 1 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Branch Name:</label>
                    <input type="text" class="form-control readonly" [value]="branchName()" readonly>
                </div>
                <div class="form-col">
                    <label>Customer Name:</label>
                    <input type="text" class="form-control" [ngModel]="customerName()" (ngModelChange)="customerName.set($event)" name="customerName">
                </div>
                <div class="form-col" style="grid-column: span 1;">
                    <label>Customer Address:</label>
                    <textarea class="form-control" [ngModel]="customerAddress()" (ngModelChange)="customerAddress.set($event)" name="customerAddress" rows="1"></textarea>
                </div>
                <div class="form-col">
                    <label>Date:</label>
                    <div class="date-input-wrapper">
                        <input type="date" class="form-control" [ngModel]="date()" (ngModelChange)="date.set($event)" name="date">
                    </div>
                </div>
            </div>

            <!-- Row 2 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Quotation No:</label>
                    <input type="text" class="form-control readonly" [value]="quotationNo()" readonly>
                </div>
                <div class="form-col">
                    <label>Contact No:</label>
                    <input type="text" class="form-control" [ngModel]="contactNo()" (ngModelChange)="contactNo.set($event)" name="contactNo">
                </div>
                <div class="form-col"></div> 
                <div class="form-col">
                    <label>Reference:</label>
                    <input type="text" class="form-control" [ngModel]="reference()" (ngModelChange)="reference.set($event)" name="reference">
                </div>
             </div>

             <!-- Row 3 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Payment Mode:</label>
                    <select class="form-control" [ngModel]="paymentMode()" (ngModelChange)="paymentMode.set($event)" name="paymentMode">
                        <option value="">--Select--</option>
                        <option value="Cash">Cash</option>
                        <option value="Finance">Finance</option>
                    </select>
                </div>
                <div class="form-col">
                    <label>Executive:</label>
                    <select class="form-control" [ngModel]="executive()" (ngModelChange)="executive.set($event)" name="executive">
                        <option value="">--Select--</option>
                        <option *ngFor="let ex of executiveOptions()" [value]="ex">{{ ex }}</option>
                    </select>
                </div>
                <div class="form-col"></div>
                <div class="form-col"></div>
             </div>

             <!-- Total Payable Section -->
             <div class="total-payable-section">
                <span>Total Payable Amount : Rs <span class="amount-val">{{ grandTotal().toFixed(2) }}</span></span>
             </div>

             <!-- Save & Print Button Row (Right Aligned) -->
             <div class="action-row-right">
                <button class="btn-save" type="button" (click)="onSave()" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save & Print' }}</button>
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
        <option *ngFor="let p of productOptions()" [value]="p.code">{{ p.code }} | {{ p.description }}</option>
    </datalist>
    <tbody id="invoice-body">
        <tr *ngFor="let item of items(); let i = index; trackBy: trackByFn">
            <td>
                <input
                    type="text"
                    class="in-box"
                    [ngModel]="item.productCode"
                    (ngModelChange)="onItemFieldChange(i, 'productCode', $event)"
                    name="code{{i}}"
                    [attr.list]="'productCodeOptions'"
                    placeholder="Search product code">
            </td>
            <td><input type="text" class="in-box" [value]="item.description" name="desc{{i}}" readonly></td>
            <td><input type="number" class="in-box basic-price" [ngModel]="item.basicPrice" (ngModelChange)="onItemFieldChange(i, 'basicPrice', $event)" name="basicPrice{{i}}"></td>
            <td><input type="number" class="in-box qty" [ngModel]="item.qty" (ngModelChange)="onItemFieldChange(i, 'qty', $event)" name="qty{{i}}"></td>
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
            <td><input type="text" class="in-box gray" [value]="totals().taxable.toFixed(2)" readonly></td>
            <td><input type="text" class="in-box gray" [value]="totals().sgst.toFixed(2)" readonly></td>
            <td><input type="text" class="in-box gray" [value]="totals().cgst.toFixed(2)" readonly></td>
            <td><input type="text" class="in-box gray" [value]="totals().cess.toFixed(2)" readonly></td>
            <td><input type="text" class="in-box gray" [value]="totals().amount.toFixed(2)" readonly></td>
            <td></td>
            <tr class="summary-row">
                <td colspan="5"></td>
                <td colspan="3" class="label">Missell-1 &nbsp; <input type="text" class="form-input mini-box" [ngModel]="missell1()" (ngModelChange)="missell1.set($event)" name="missell1"></td>
                <td><input type="number" class="form-input gray-box" [ngModel]="missell1Amount()" (ngModelChange)="missell1Amount.set($event)" name="missell1Amount"></td>
                <td></td>
            </tr>
            <tr class="summary-row">
                <td colspan="5"></td>
                <td colspan="3" class="label">Missell-2 &nbsp; <input type="text" class="form-input mini-box" [ngModel]="missell2()" (ngModelChange)="missell2.set($event)" name="missell2"></td>
                <td><input type="number" class="form-input gray-box" [ngModel]="missell2Amount()" (ngModelChange)="missell2Amount.set($event)" name="missell2Amount"></td>
                <td></td>
            </tr>
            <tr class="summary-row">
                <td colspan="8" class="label">Less</td>
                <td><input type="number" class="form-input gray-box" [ngModel]="lessAmount()" (ngModelChange)="lessAmount.set($event)" name="lessAmount"></td>
                <td></td>
            </tr>
            <tr class="summary-row">
                <td colspan="8" class="label"><strong>Grand Total</strong></td>
                <td><input type="text" class="form-input gray-box" [value]="grandTotal().toFixed(2)" readonly></td>
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
    }
    
    textarea.form-control {
        resize: none;
        height: 30px; 
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
    width: 80px;
    padding: 4px;
    border: 1px solid #ccc;
    background-color: #f0f0f0; /* Matches the gray inbox look */
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

.alert-msg {
    margin: 8px 0 12px;
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 13px;
}

.alert-msg.success {
    color: #155724;
    background: #d4edda;
    border: 1px solid #c3e6cb;
}

.alert-msg.error {
    color: #721c24;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
}

.action-icons {
    font-size: 20px;
    cursor: pointer;
    vertical-align: middle;
}

  `]
})
export class ProformaInvoiceComponent implements OnInit, AfterViewInit {
  branchId = signal('');
  branchName = signal('SARATHY KOLLAM KTM');
  date = signal('');
  quotationNo = signal('');

  customerName = signal('');
  customerAddress = signal('');
  contactNo = signal('');
  reference = signal('');
  paymentMode = signal('Cash');
  executive = signal('');
  executiveOptions = signal<string[]>([]);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  private quoteNoRetryDone = false;

  missell1 = signal('');
  missell1Amount = signal(0);
  missell2 = signal('');
  missell2Amount = signal(0);
  lessAmount = signal(0);

  productOptions = signal<Array<{
    productId: number;
    code: string;
    description: string;
    salePrice: number;
    sgstValue: number;
    cgstValue: number;
    cessValue: number;
  }>>([]);

  items = signal<Array<{
    productId: number;
    productCode: string;
    description: string;
    basicPrice: number;
    qty: number;
    taxable: number;
    sgst: number;
    cgst: number;
    cess: number;
    amount: number;
  }>>([this.createEmptyItem()]);

  readonly todayIso = new Date().toISOString().slice(0, 10);

  constructor(private router: Router, private api: ApiService) { }

  private resolveBranchContext(): void {
    const user = this.api.getCurrentUser() || {};
    const resolvedBranchId = (
      this.branchId() ||
      user.branch_id ||
      user.b_id ||
      user.branchId ||
      ''
    ).toString().trim();
    const resolvedBranchName = (
      user.branch_name ||
      user.e_branch ||
      this.branchName() ||
      ''
    ).toString().trim();

    if (resolvedBranchName) this.branchName.set(resolvedBranchName);
    this.branchId.set(resolvedBranchId);
  }

  private padSerial(n: number): string {
    return String(Math.max(1, n)).padStart(5, '0');
  }

  private buildLocalNextProformaNo(rows: any[] = []): string {
    const branchId = (this.branchId() || '').toString().trim();
    if (!branchId) return '';
    const year = new Date().getFullYear().toString();
    const prefix = `PI${year}${branchId}`;
    let maxSerial = 0;

    for (const r of rows) {
      const no = (r?.pro_quot_no || r?.proformaNo || '').toString().trim();
      if (!no.startsWith(prefix)) continue;
      const serial = parseInt(no.slice(-5), 10);
      if (Number.isFinite(serial) && serial > maxSerial) maxSerial = serial;
    }
    return `${prefix}${this.padSerial(maxSerial + 1)}`;
  }

  private ensureQuotationNoVisible(rows: any[] = []): void {
    if (this.quotationNo()) return;
    if (!Array.isArray(rows) || !rows.length) return;
    const local = this.buildLocalNextProformaNo(rows);
    if (local) this.quotationNo.set(local);
  }

  ngOnInit(): void {
    this.resolveBranchContext();
    this.date.set(this.todayIso);
    this.initializePageData();
    this.loadProductOptions();
    this.loadExecutiveOptions();
  }

  ngAfterViewInit(): void {
    this.enforceMaxDate();
    setTimeout(() => this.enforceMaxDate(), 500);
  }

  private enforceMaxDate(): void {
    const dateInput = document.querySelector('input[name="date"]') as HTMLInputElement | null;
    if (dateInput) {
      dateInput.max = this.todayIso;
    }
  }

  private initializePageData(): void {
    this.resolveBranchContext();
    this.ensureQuotationNoVisible();
    if (this.branchId()) {
      this.loadNextProformaNo();
      return;
    }

    this.api.getBranches().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        const targetName = (this.branchName() || '').toString().trim().toLowerCase();
        const found = rows.find((b: any) => ((b.branch_name || '').toString().trim().toLowerCase() === targetName));
        if (found?.b_id) {
          this.branchId.set(String(found.b_id).trim());
          this.branchName.set((found.branch_name || this.branchName() || '').toString().trim());
        }
        this.ensureQuotationNoVisible();
        this.loadNextProformaNo();
      },
      error: () => {
        this.ensureQuotationNoVisible();
        this.loadNextProformaNo();
      }
    });
  }

  totals = computed(() => {
    return this.items().reduce((acc, item) => {
      acc.taxable += this.toNumber(item.taxable);
      acc.sgst += this.toNumber(item.sgst);
      acc.cgst += this.toNumber(item.cgst);
      acc.cess += this.toNumber(item.cess);
      acc.amount += this.toNumber(item.amount);
      return acc;
    }, { taxable: 0, sgst: 0, cgst: 0, cess: 0, amount: 0 });
  });

  grandTotal = computed(() => {
    return this.toNumber(this.totals().amount) + this.toNumber(this.missell1Amount()) + this.toNumber(this.missell2Amount()) - this.toNumber(this.lessAmount());
  });

  private toNumber(v: any): number {
    if (v === null || v === undefined) return 0;
    const n = parseFloat(String(v).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  }

  private round2(v: number): number {
    return Math.round((this.toNumber(v) + Number.EPSILON) * 100) / 100;
  }

  private createEmptyItem() {
    return {
      productId: 0,
      productCode: '',
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

  private loadNextProformaNo(): void {
    this.resolveBranchContext();
    this.ensureQuotationNoVisible();
    const branchName = (this.branchName() || '').toString().trim();
    this.api.getProformaNextNo(this.branchId() || undefined, branchName || undefined).subscribe({
      next: (res: any) => {
        const serverNo = (
          res?.proformaNo ||
          res?.data?.proformaNo ||
          res?.data?.pro_quot_no ||
          res?.nextNo ||
          ''
        ).toString().trim();
        if (res?.success && serverNo) {
          this.quotationNo.set(serverNo);
          this.quoteNoRetryDone = false;
          return;
        }
        this.loadQuoteNoFromList();
        if (!this.quoteNoRetryDone) {
          this.quoteNoRetryDone = true;
          setTimeout(() => this.loadNextProformaNo(), 300);
        }
      },
      error: () => {
        this.loadQuoteNoFromList();
        if (!this.quoteNoRetryDone) {
          this.quoteNoRetryDone = true;
          setTimeout(() => this.loadNextProformaNo(), 300);
        }
      }
    });
  }

  private loadQuoteNoFromList(): void {
    this.resolveBranchContext();
    this.api.listProformas(1, 5000, '', this.branchId() || undefined).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        this.ensureQuotationNoVisible(rows);
      },
      error: () => this.ensureQuotationNoVisible()
    });
  }

  private loadProductOptions(): void {
    this.api.getAllLabourCodes().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.productOptions.set(res.data.map((r: any) => ({
            productId: this.toNumber(r.labour_id),
            code: (r.labour_code || '').toString().trim(),
            description: (r.labour_title || '').toString().trim(),
            salePrice: this.toNumber(r.sale_price),
            sgstValue: this.toNumber(r.sgst),
            cgstValue: this.toNumber(r.cgst),
            cessValue: this.toNumber(r.cess)
          })).filter((x: any) => x.code));
        }
      }
    });
  }

  private taxRateFromDbValue(dbValue: number, salePrice: number): number {
    const v = this.toNumber(dbValue);
    const p = this.toNumber(salePrice);
    if (v <= 0 || p <= 0) return 0;
    return v <= 100 ? (v / 100) : (v / p);
  }

  private loadExecutiveOptions(): void {
    this.api.getAdvisers().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.executiveOptions.set(res.data
            .map((x: any) => (x.name || x.e_first_name || '').toString().trim())
            .filter((x: string) => !!x));
        }
      }
    });
  }

  onItemFieldChange(index: number, field: string, value: any): void {
    const currentItems = [...this.items()];
    const item = { ...currentItems[index] };
    (item as any)[field] = value;

    if (field === 'productCode') {
      const selected = this.productOptions().find(p => p.code === value);
      if (selected) {
        item.productId = selected.productId;
        item.description = selected.description;
        item.basicPrice = selected.salePrice;
      } else if (!value) {
        item.productId = 0;
        item.description = '';
        item.basicPrice = 0;
      }
    }

    this.recalculateRow(item);
    currentItems[index] = item;
    this.items.set(currentItems);
  }

  recalculateRow(item: any): void {
    const qty = Math.max(1, this.toNumber(item.qty));
    const basic = this.toNumber(item.basicPrice);
    const taxable = this.round2(basic * qty);
    item.qty = qty;
    item.taxable = taxable;

    // Fixed 9% as requested by USER
    const sgstRate = 0.09;
    const cgstRate = 0.09;

    const selected = this.productOptions().find(p => p.code === item.productCode);
    const cessRate = selected ? this.taxRateFromDbValue(selected.cessValue, selected.salePrice) : 0;

    item.sgst = this.round2(taxable * sgstRate);
    item.cgst = this.round2(taxable * cgstRate);
    item.cess = this.round2(taxable * cessRate);
    item.amount = this.round2(item.taxable + item.sgst + item.cgst + item.cess);
  }

  addRow(): void {
    this.items.update(items => [...items, this.createEmptyItem()]);
  }

  removeRow(index: number): void {
    if (this.items().length <= 1) {
      this.items.set([this.createEmptyItem()]);
      return;
    }
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  onSave(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.quotationNo() || !this.customerName()) {
      this.errorMessage.set('Quotation number and customer name are required.');
      alert(this.errorMessage());
      return;
    }

    if (this.date() > this.todayIso) {
        this.errorMessage.set('Date cannot be in the future.');
        alert(this.errorMessage());
        return;
    }

    const payload = {
      proformaNo: this.quotationNo(),
      branchId: this.branchId(),
      branchName: this.branchName(),
      proformaDate: this.date(),
      customerName: this.customerName(),
      address: this.customerAddress(),
      phone: this.contactNo(),
      paymentMode: this.paymentMode(),
      reference: this.reference(),
      executive: this.executive(),
      missell1: this.missell1(),
      missell1Amount: this.toNumber(this.missell1Amount()),
      missell2: this.missell2(),
      missell2Amount: this.toNumber(this.missell2Amount()),
      lessAmount: this.toNumber(this.lessAmount()),
      totals: {
        taxable: this.totals().taxable,
        sgst: this.totals().sgst,
        cgst: this.totals().cgst,
        cess: this.totals().cess,
        amount: this.totals().amount,
        grandTotal: this.grandTotal()
      },
      items: this.items()
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

    this.isSaving.set(true);
    this.saveProformaWithRetry(payload, true);
  }

  private saveProformaWithRetry(payload: any, retryOnConflict: boolean): void {
    this.api.saveProforma(payload).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        if (res?.success) {
          if (res.proformaNo) this.quotationNo.set(String(res.proformaNo));
          this.successMessage.set('Proforma saved successfully.');
          this.errorMessage.set('');
          alert(this.successMessage());
          this.resetFormAfterSave();
          this.loadNextProformaNo();
        } else {
          this.errorMessage.set(res?.message || 'Failed to save proforma.');
          this.successMessage.set('');
          alert(this.errorMessage());
        }
      },
      error: (err: any) => {
        if (retryOnConflict && err?.status === 409) {
          this.api.getProformaNextNo(this.branchId() || undefined, this.branchName() || undefined).subscribe({
            next: (nextRes: any) => {
              if (nextRes?.success && nextRes.proformaNo) {
                this.quotationNo.set(nextRes.proformaNo);
                const retryPayload = { ...payload, proformaNo: nextRes.proformaNo };
                this.saveProformaWithRetry(retryPayload, false);
              } else {
                this.isSaving.set(false);
                this.errorMessage.set(nextRes?.message || 'Failed to regenerate quotation number.');
                this.successMessage.set('');
                alert(this.errorMessage());
              }
            },
            error: (nextErr: any) => {
              this.isSaving.set(false);
              this.errorMessage.set(nextErr?.error?.message || 'Failed to regenerate quotation number.');
              this.successMessage.set('');
              alert(this.errorMessage());
            }
          });
          return;
        }
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to save proforma.');
        this.successMessage.set('');
        alert(this.errorMessage());
      }
    });
  }

  private resetFormAfterSave(): void {
    this.customerName.set('');
    this.customerAddress.set('');
    this.contactNo.set('');
    this.reference.set('');
    this.executive.set('');
    this.paymentMode.set('Cash');
    this.missell1.set('');
    this.missell1Amount.set(0);
    this.missell2.set('');
    this.missell2Amount.set(0);
    this.lessAmount.set(0);
    this.items.set([this.createEmptyItem()]);
  }

  trackByFn(index: number, item: any): any {
    return index;
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
