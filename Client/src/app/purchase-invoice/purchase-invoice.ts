import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-purchase-invoice',
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
        <span class="active">Purchase</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>INVOICE (Purchase)</h2>
          </div>
          <div class="header-actions">
             <button class="btn-save" type="button" (click)="onSave()" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save & Print' }}</button>
             <button class="btn-list" (click)="navigate('/previous-purchase-invoice')">List Purchase Invoice</button>
          </div>
        </header>

        <div class="page-card-content">
          <div *ngIf="successMessage()" style="margin-bottom:10px;color:#2e7d32;font-size:12px;">{{ successMessage() }}</div>
          <div *ngIf="errorMessage()" style="margin-bottom:10px;color:#d32f2f;font-size:12px;">{{ errorMessage() }}</div>
          <form class="ledger-form">
            
            <!-- Row 1 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Branch Name:</label>
                    <input type="text" class="form-control readonly" [value]="branchName()" readonly>
                </div>
                <div class="form-col">
                    <label>Inv No:</label>
                    <input type="text" class="form-control" [ngModel]="invNo()" (ngModelChange)="invNo.set($event)" name="invNo">
                </div>
                <div class="form-col">
                    <label>Institution:</label>
                    <select class="form-control" [ngModel]="institutionId()" (ngModelChange)="onInstitutionChange($event)" name="institutionId">
                        <option value="">--Select--</option>
                        <option *ngFor="let b of institutionOptions()" [value]="b.b_id">{{ b.branch_name }}</option>
                    </select>
                </div>
                <div class="form-col">
                    <label>RC No(supplier):</label>
                    <input type="text" class="form-control" [ngModel]="rcNo()" (ngModelChange)="rcNo.set($event)" name="rcNo">
                </div>
            </div>

            <!-- Row 2 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>HSN Code:</label>
                    <input type="text" class="form-control" [ngModel]="hsnCode()" (ngModelChange)="hsnCode.set($event)" name="hsnCode">
                </div>
                <div class="form-col">
                    <label>RC Date:</label>
                    <div class="date-input-wrapper">
                         <input type="date" class="form-control" [ngModel]="rcDate()" (ngModelChange)="rcDate.set($event)" name="rcDate">
                    </div>
                </div>
                <div class="form-col">
                    <label>Address:</label>
                     <textarea class="form-control readonly" [ngModel]="address()" name="address" rows="1" readonly></textarea>
                </div>
                
                <div class="form-col">
                    <label>Invoice Date:</label>
                    <div class="date-input-wrapper">
                         <input type="date" class="form-control" [ngModel]="invoiceDate()" (ngModelChange)="invoiceDate.set($event)" name="invoiceDate">
                    </div>
                </div>
             </div>

            <!-- Row 3 -->
             <div class="form-grid-row">
                 <div class="form-col"></div>
                 <div class="form-col"></div>
                <div class="form-col">
                   <label>GSTIN:</label>
                   <input type="text" class="form-control readonly" [ngModel]="gstin()" name="gstin" readonly>
                </div>
                <div class="form-col">
                    <label>Basic Total:</label>
                    <input type="number" class="form-control" [ngModel]="basicTotal()" (ngModelChange)="basicTotal.set($event)" name="basicTotal">
                </div>
             </div>

             <!-- Row 4 -->
              <div class="form-grid-row">
                <div class="form-col"></div>
                <div class="form-col"></div>
                <div class="form-col"></div>
                <div class="form-col">
                    <label>Tax Total:</label>
                    <input type="number" class="form-control" [ngModel]="taxTotal()" (ngModelChange)="taxTotal.set($event)" name="taxTotal">
                </div>
             </div>

             <!-- Row 5 -->
              <div class="form-grid-row">
                <div class="form-col"></div>
                <div class="form-col"></div>
                <div class="form-col"></div>
                <div class="form-col">
                    <label>Grand Total:</label>
                    <input type="number" class="form-control" [ngModel]="grandTotal()" (ngModelChange)="grandTotal.set($event)" name="grandTotal">
                </div>
             </div>

             <!-- Total Payable Section -->
             <div class="total-payable-section">
                <span>Total Payable Amount : Rs <span class="amount-val">{{ totalPayableAmount().toFixed(2) }}</span></span>
             </div>

             <!-- Save & Print Button Row (Right Aligned) -->
             <div class="action-row-right">
                <button class="btn-save" type="button" (click)="onSave()" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save & Print' }}</button>
             </div>

             <!-- Line Items Table Header -->
             <div class="items-table-header">
                <div class="th" style="flex: 1;">Product Code</div>
                <div class="th" style="flex: 1.5;">Product Description</div>
                <div class="th" style="flex: 1;">Chassis No</div>
                <div class="th" style="flex: 1;">Engine No</div>
                <div class="th" style="flex: 0.8;">Color Code</div>
                <div class="th" style="flex: 0.8;">Mfg Date</div>
                <div class="th" style="flex: 0.8;">Sale Type/Age</div>
                <div class="th" style="flex: 0.8;">Amount</div>
                <div class="th action-th" style="width: 30px;"><button type="button" (click)="addRow()" class="btn-add">+</button></div>
             </div>

             <!-- Datalists for Product Search -->
             <datalist id="purchaseProductCodeOptions">
                <option *ngFor="let p of productOptions()" [value]="p.prodCode">{{ p.prodCode }} | {{ p.description }}</option>
             </datalist>
             <datalist id="purchaseProductNameOptions">
                <option *ngFor="let p of productOptions()" [value]="p.description">{{ p.description }}</option>
             </datalist>

             <!-- Line Item Rows -->
             <div class="items-table-row" *ngFor="let item of items(); let i = index; trackBy: trackByFn">
                <div class="td" style="flex: 1;">
                    <input
                        type="text"
                        class="form-control table-input"
                        [ngModel]="item.prodCode"
                        (ngModelChange)="onItemFieldChange(i, 'prodCode', $event)"
                        name="prodCode{{i}}"
                        list="purchaseProductCodeOptions"
                        placeholder="Search code">
                </div>
                <div class="td" style="flex: 1.5;">
                    <input
                        type="text"
                        class="form-control table-input"
                        [ngModel]="item.description"
                        (ngModelChange)="onItemFieldChange(i, 'description', $event)"
                        name="desc{{i}}"
                        list="purchaseProductNameOptions"
                        placeholder="Search name">
                </div>
                <div class="td" style="flex: 1;">
                     <input type="text" class="form-control table-input" [ngModel]="item.chassisNo" (ngModelChange)="onItemFieldChange(i, 'chassisNo', $event)" name="chassis{{i}}">
                </div>
                <div class="td" style="flex: 1;">
                     <input type="text" class="form-control table-input" [ngModel]="item.engineNo" (ngModelChange)="onItemFieldChange(i, 'engineNo', $event)" name="engine{{i}}">
                </div>
                <div class="td" style="flex: 0.8;">
                     <select class="form-control table-input" [ngModel]="item.colorCode" (ngModelChange)="onItemFieldChange(i, 'colorCode', $event)" name="color{{i}}">
                        <option value="">--</option>
                        <option *ngFor="let c of item.availableColors" [value]="c.colorCode">{{ formatColorOption(c.colorCode, c.colorName) }}</option>
                     </select>
                </div>
                 <div class="td" style="flex: 0.8;">
                     <div class="date-input-wrapper table-date">
                        <input type="date" class="form-control table-input" [ngModel]="item.mfgDate" (ngModelChange)="onItemFieldChange(i, 'mfgDate', $event)" name="mfg{{i}}">
                         <i class="fas fa-calendar-alt calendar-icon"></i>
                     </div>
                </div>
                <div class="td" style="flex: 0.8;">
                     <input type="text" class="form-control table-input" [ngModel]="item.saleType" (ngModelChange)="onItemFieldChange(i, 'saleType', $event)" name="saleType{{i}}">
                </div>
                <div class="td" style="flex: 0.8;">
                     <input type="number" class="form-control table-input" [ngModel]="item.amount" (ngModelChange)="onItemFieldChange(i, 'amount', $event)" name="amount{{i}}">
                </div>
                <div class="td action-td" style="width: 30px;">
                    <button class="btn-remove" type="button" (click)="removeRow(i)">-</button>
                </div>
             </div> 

             <!-- Footer Totals -->
              <div class="footer-totals">
                 <div class="footer-label">Total Invoice Amount</div>
                 <div class="footer-value"><input type="text" readonly class="val-box" [value]="totalPayableAmount().toFixed(2)"></div>
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
        align-items: center; gap: 15px;
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
        align-items: center;
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
        margin-top: 10px;
    }
    .amount-val {
        color: #666; 
    }

    .action-row-right {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 15px;
        margin-top: 10px;
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
        width: 100%;
        min-width: 0; /* allow flex item to shrink */
        box-sizing: border-box;
        height: 26px;
    }
    .table-date {
        max-width: 100%;
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

    .footer-totals {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #f0f0f0;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        margin: 20px 0 0 0;
    }
    .footer-label {
        text-align: center;
        flex: 1;
    }
    .footer-value {
        position: absolute;
        right: 20px;
    }
    .val-box {
        background: #eee;
        border: 1px solid #dcdcdc;
        padding: 6px 10px;
        width: 100px;
        text-align: right;
        border-radius: 3px;
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
  `]
})
export class PurchaseInvoiceComponent implements OnInit {
  branchId = signal('');
  branchName = signal('SARATHY KOLLAM KTM');
  invNo = signal('');
  institution = signal('');
  institutionId = signal('');
  rcNo = signal('');
  hsnCode = signal('');
  rcDate = signal('');
  address = signal('');
  invoiceDate = signal('');
  gstin = signal('');

  institutionOptions = signal<Array<{ b_id: number; branch_name: string; branch_address: string; branch_gstin: string }>>([]);
  productOptions = signal<Array<{ productId: number; prodCode: string; description: string; salePrice: number; colors: Array<{ colorCode: string; colorName: string }> }>>([]);

  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  items = signal<Array<{
    prodCode: string;
    description: string;
    chassisNo: string;
    engineNo: string;
    colorCode: string;
    colorName: string;
    availableColors: Array<{ colorCode: string; colorName: string }>;
    mfgDate: string;
    saleType: string;
    productId: number;
    amount: number;
  }>>([this.createEmptyItem()]);

  totalPayableAmount = computed(() => {
    return this.items().reduce((sum: number, row: any) => sum + this.toNumber(row.amount), 0);
  });

  basicTotal = signal(0.00);
  taxTotal = signal(0.00);
  grandTotal = signal(0.00);

  constructor(private router: Router, private api: ApiService) { }

  ngOnInit(): void {
    const user = this.api.getCurrentUser();
    if (user) {
      this.branchName.set(user.branch_name || this.branchName());
      this.branchId.set((user.branch_id || '').toString());
    }
    const today = new Date().toISOString().slice(0, 10);
    this.rcDate.set(today);
    this.invoiceDate.set(today);
    this.loadInstitutionOptions();
    this.loadProductOptions();
  }

  private createEmptyItem() {
    return {
      prodCode: '',
      description: '',
      chassisNo: '',
      engineNo: '',
      colorCode: '',
      colorName: '',
      availableColors: [],
      mfgDate: '',
      saleType: '',
      productId: 0,
      amount: 0
    };
  }

  addRow() {
    this.items.update(items => [...items, this.createEmptyItem()]);
  }

  removeRow(index: number) {
    if (this.items().length <= 1) {
      this.items.set([this.createEmptyItem()]);
      return;
    }
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  private loadInstitutionOptions(): void {
    this.api.getBranches().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.institutionOptions.set(res.data.map((b: any) => ({
            b_id: parseInt(b.b_id, 10) || 0,
            branch_name: (b.branch_name || '').toString().trim(),
            branch_address: (b.branch_address || '').toString(),
            branch_gstin: (b.branch_gstin || '').toString().trim()
          })).filter((b: any) => !!b.branch_name));
        }
      }
    });
  }

  onInstitutionChange(idValue: any): void {
    const id = parseInt((idValue || '').toString(), 10) || 0;
    this.institutionId.set(id.toString());
    const selected = this.institutionOptions().find(b => b.b_id === id);
    this.institution.set(selected?.branch_name || '');
    this.address.set(selected?.branch_address || '');
    this.gstin.set(selected?.branch_gstin || '');
  }

  private loadProductOptions(): void {
    this.api.getPurchaseProductOptions().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.productOptions.set(res.data.map((p: any) => ({
            productId: this.toNumber(p.productId),
            prodCode: (p.prodCode || '').toString().trim(),
            description: (p.description || '').toString().trim(),
            salePrice: this.toNumber(p.salePrice),
            colors: Array.isArray(p.colors) ? p.colors.map((c: any) => ({
              colorCode: (c.colorCode || '').toString().trim(),
              colorName: (c.colorName || '').toString().trim()
            })) : []
          })).filter((p: any) => !!p.prodCode));
        }
      }
    });
  }

  onItemFieldChange(index: number, field: string, value: any): void {
    const currentItems = [...this.items()];
    const item = { ...currentItems[index] };
    (item as any)[field] = value;

    if (field === 'prodCode' || field === 'description') {
      const query = (value || '').toString().trim().toLowerCase();
      const selected = this.productOptions().find(p =>
        field === 'prodCode' ? p.prodCode.toLowerCase() === query : p.description.toLowerCase() === query
      );

      if (selected) {
        item.productId = selected.productId;
        item.prodCode = selected.prodCode;
        item.description = selected.description;
        item.amount = this.toNumber(selected.salePrice);
        item.availableColors = selected.colors || [];
      } else if (!value) {
        item.productId = 0;
        item.prodCode = '';
        item.description = '';
        item.amount = 0;
        item.availableColors = [];
      }
    }

    if (field === 'colorCode') {
      const selectedColor = (item.availableColors || []).find(c => c.colorCode === value);
      item.colorName = selectedColor?.colorName || '';
    }

    currentItems[index] = item;
    this.items.set(currentItems);
  }

  private toNumber(v: any): number {
    if (v === null || v === undefined) return 0;
    const n = parseFloat(String(v).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  }

  formatColorOption(code: string, name: string): string {
    const c = (code || '').toString().trim();
    const n = (name || '').toString().trim();
    if (c && n) return `${c}[ ${n}]`;
    return c || n || '';
  }

  onSave(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.invNo()) {
      this.errorMessage.set('Invoice number required');
      alert(this.errorMessage());
      return;
    }
    if (!this.branchId()) {
      this.errorMessage.set('Branch missing. Please login again.');
      alert(this.errorMessage());
      return;
    }

    // FIX: Format time to HH:mm:ss to avoid length issues in DB
    const formattedTime = new Date().toTimeString().split(' ')[0];

    const payload = {
      invoiceNo: this.invNo(),
      branchId: this.branchId(),
      invoiceDate: this.invoiceDate(),
      invoiceTime: formattedTime,
      supplierName: this.institution(),
      address: this.address(),
      rcNo: this.rcNo(),
      rcDate: this.rcDate() || this.invoiceDate(),
      hsnCode: this.hsnCode(),
      gstin: this.gstin(),
      basicTotal: this.toNumber(this.basicTotal()),
      taxTotal: this.toNumber(this.taxTotal()),
      grandTotal: this.toNumber(this.grandTotal()),
      items: this.items().map((i: any) => ({
        productId: this.toNumber(i.productId),
        prodCode: i.prodCode || '',
        description: i.description || '',
        chassisNo: i.chassisNo || '',
        engineNo: i.engineNo || '',
        colorCode: i.colorCode || '',
        colorName: i.colorName || '',
        mfgDate: i.mfgDate || '',
        saleType: i.saleType || '',
        amount: this.toNumber(i.amount)
      })).filter((i: any) => i.prodCode || i.description || i.chassisNo || i.engineNo || i.amount > 0)
    };

    this.isSaving.set(true);
    this.api.savePurchaseInvoice(payload).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        if (res?.success) {
          this.successMessage.set('Purchase invoice saved');
          alert(this.successMessage());
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

  trackByFn(index: number, item: any): any {
    return index;
  }

  navigate(path: string) { this.router.navigate([path]); }
}
