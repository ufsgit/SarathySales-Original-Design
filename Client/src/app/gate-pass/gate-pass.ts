import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-gate-pass',
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
        <span>Transactions</span>
        <span> > </span>
        <span class="active">Gate Pass</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip">
          <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Vehicle Selection Slip</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="navigate('/previous-gate-pass')">List Gate Pass</button>
             <button class="btn-save" (click)="onSave()" [disabled]="isSaving">{{ isSaving ? 'Saving...' : 'Save & Print' }}</button>
          </div>
        </header>

        <div class="page-card-content">
          <div *ngIf="successMessage" style="margin-bottom:10px;color:#2e7d32;font-size:12px;">{{ successMessage }}</div>
          <div *ngIf="errorMessage" style="margin-bottom:10px;color:#d32f2f;font-size:12px;">{{ errorMessage }}</div>
          <form class="ledger-form">
            
            <!-- Row 1 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Branch Name:</label>
                    <input type="text" class="form-control readonly" [value]="branchName" readonly>
                </div>
                <div class="form-col">
                    <label>Invoice No:</label>
                    <select class="form-control" [(ngModel)]="invoiceNo" name="invoiceNo" (change)="onInvoiceChange()">
                        <option value="">--Select--</option>
                        <option *ngFor="let inv of invoiceOptions" [value]="inv.inv_no">{{ inv.inv_no }}</option>
                    </select>
                </div>
                <div class="form-col">
                    <label>Chassis No:</label>
                    <input type="text" class="form-control readonly" [value]="chassisNo" readonly>
                </div>
                <div class="form-col">
                    <label>Color:</label>
                    <input type="text" class="form-control readonly" [value]="color" readonly>
                </div>
            </div>

            <!-- Row 2 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Gate Pass No:</label>
                    <input type="text" class="form-control readonly" [value]="gatePassNo" readonly>
                </div>
                <div class="form-col">
                    <label>Customer Name:</label>
                    <input type="text" class="form-control readonly" [value]="customerName" readonly>
                </div>
                <div class="form-col">
                     <label>Engine No:</label>
                     <input type="text" class="form-control readonly" [value]="engineNo" readonly>
                </div>
                 <div class="form-col">
                     <label>Product Code:</label>
                     <input type="text" class="form-control readonly" [value]="productCode" readonly>
                </div>
            </div>

             <!-- Row 3 -->
             <div class="form-grid-row">
                <div class="form-col">
                    <label>Gate Pass Date:</label>
                    <div class="date-input-wrapper">
                        <input type="date" class="form-control" [(ngModel)]="passDate" name="passDate">
                    </div>
                </div>
                <div class="form-col">
                    <label>Address:</label>
                    <textarea class="form-control" [(ngModel)]="address" name="address" rows="1" readonly></textarea>
                </div>
                <div class="form-col">
                    <label>Vehicle:</label>
                    <input type="text" class="form-control readonly" [value]="vehicleModel" readonly>
                </div>
                <div class="form-col">
                    <label>Selection Date:</label>
                    <div class="date-input-wrapper">
                         <input type="date" class="form-control" [(ngModel)]="selectionDate" name="selectionDate">
                    </div>
                </div>
            </div>

            <!-- Row 4 -->
            <div class="form-grid-row">
                <div class="form-col">
                    <label>Issue Type:</label>
                    <input type="text" class="form-control" [(ngModel)]="issueType" name="issueType">
                </div>
                <div class="form-col">
                      <!-- Empty -->
                </div>
                <div class="form-col">
                      <!-- Empty -->
                </div>
                <div class="form-col">
                      <!-- Empty -->
                </div>
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
        min-width: 80px; 
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
        height: 30px; 
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
export class GatePassComponent implements OnInit {
  branchName = 'SARATHY KOLLAM KTM';
  branchId = '';
  gatePassNo = '';
  passDate = '';
  issueType = '';
  invoiceNo = '';
  gateInvoiceId = 0;
  invoiceOptions: Array<{ inv_id: number; inv_no: string }> = [];
  customerName = '';
  selectionDate = '';
  address = '';
  vehicleModel = '';
  chassisNo = '';
  engineNo = '';
  color = '';
  productCode = '';
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(private router: Router, private api: ApiService) { }

  ngOnInit(): void {
    const user = this.api.getCurrentUser();
    if (user) {
      this.branchName = (user.branch_name || '').toString().trim() || this.branchName;
      this.branchId = user.branch_id || '';
    }
    this.passDate = this.today();
    this.selectionDate = this.today();
    this.loadNextGatePassNo();
    this.loadInvoiceOptions();
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private loadNextGatePassNo(): void {
    this.api.getGatePassNextNo(this.branchId).subscribe({
      next: (res: any) => {
        if (res.success && res.gatePassNo) this.gatePassNo = res.gatePassNo;
      },
      error: () => {
        this.errorMessage = 'Failed to load gate pass number';
      }
    });
  }

  private loadInvoiceOptions(): void {
    this.api.getGatePassInvoices(this.branchId).subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.invoiceOptions = res.data;
        }
      },
      error: () => {
        this.invoiceOptions = [];
      }
    });
  }

  onInvoiceChange(): void {
    const selected = this.invoiceOptions.find(i => i.inv_no === this.invoiceNo);
    this.gateInvoiceId = selected?.inv_id || 0;
    if (!this.invoiceNo) {
      this.customerName = '';
      this.address = '';
      this.chassisNo = '';
      this.engineNo = '';
      this.vehicleModel = '';
      this.color = '';
      this.productCode = '';
      return;
    }

    this.api.getGatePassInvoiceDetails(this.invoiceNo, this.branchId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const d = res.data;
          this.gateInvoiceId = d.inv_id || this.gateInvoiceId;
          this.customerName = d.customerName || '';
          this.address = d.address || '';
          this.chassisNo = d.chassisNo || '';
          this.engineNo = d.engineNo || '';
          this.vehicleModel = d.vehicleModel || '';
          this.color = d.color || '';
          this.productCode = d.productCode || '';
          if (d.selectionDate) {
            this.selectionDate = new Date(d.selectionDate).toISOString().slice(0, 10);
          }
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load invoice details';
      }
    });
  }

  onSave(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.gatePassNo) {
      this.errorMessage = 'Gate pass number required';
      return;
    }

    const payload = {
      gatePassNo: this.gatePassNo,
      branchId: this.branchId,
      branchName: this.branchName,
      gate_invoice_id: this.gateInvoiceId || 0,
      gatePassDate: this.passDate || this.today(),
      issueType: this.issueType,
      customerName: this.customerName,
      invoiceNo: this.invoiceNo,
      address: this.address,
      selectionDate: this.selectionDate || this.passDate || this.today(),
      chassisNo: this.chassisNo,
      engineNo: this.engineNo,
      vehicleModel: this.vehicleModel,
      color: this.color,
      productCode: this.productCode,
      status: 1
    };

    this.isSaving = true;
    this.api.saveGatePass(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.success) {
          this.successMessage = 'Gate pass saved';
          this.loadNextGatePassNo();
        } else {
          this.errorMessage = res.message || 'Save failed';
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Server error';
      }
    });
  }

  navigate(path: string) { this.router.navigate([path]); }
}
