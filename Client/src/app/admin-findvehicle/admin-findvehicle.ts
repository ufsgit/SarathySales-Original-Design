import { Component, OnInit, signal, computed, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-findvehicle',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, AdminFooter, RouterLink],
  providers: [DatePipe],
  template: `
<div class="app-container" (click)="closeDropdowns()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <span class="breadcrumb-item">Master Operation</span>
        <span class="separator"> > </span>
        <span class="active">Vehicle Enquiry</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Vehicle Enquiry</h2>
          </div>
          <div class="header-actions">
             <button class="btn-action btn-sticker" (click)="printSticker()">Sticker</button>
             <button class="btn-action btn-sale-letter" (click)="printSaleLetter()">Sale Letter</button>
             <button class="btn-action btn-print-enquiry" (click)="printEnquiry()">Print Enquiry</button>
          </div>
        </header>

        <div class="page-card-content">
          <div class="enquiry-grid">
            
            <!-- Column 1 -->
            <div class="form-column">
                <div class="form-group row">
                    <label>Chassis No :</label>
                    <div class="search-container" (click)="$event.stopPropagation()">
                        <div class="search-box-wrapper">
                            <input type="text" 
                                   class="form-control" 
                                   [(ngModel)]="chassisSearch" 
                                   (input)="onSearchInput()"
                                   (focus)="showList = true"
                                   placeholder="Search Chassis No...">
                            <i class="fas fa-chevron-down dropdown-arrow"></i>
                        </div>
                        <ul class="search-results" *ngIf="showList && filteredChassis().length > 0">
                            <li *ngFor="let c of filteredChassis()" (click)="selectChassis(c)">{{ c }}</li>
                        </ul>
                    </div>
                </div>
                <div class="form-group row">
                    <label>Invoice No :</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.invoiceNo" readonly>
                </div>
                <div class="form-group row">
                    <label>Invoice Date :</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.invoiceDate" readonly>
                </div>
                <div class="form-group row">
                    <label>Regn Type :</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.regnType" readonly>
                </div>
            </div>

            <!-- Column 2 -->
            <div class="form-column">
                <div class="form-group row">
                    <label>Customer Name:</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.customerName" readonly>
                </div>
                <div class="form-group row">
                    <label>Father/Husband:</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.fatherName" readonly>
                </div>
                <div class="form-group row align-start">
                    <label>Address:</label>
                    <textarea class="form-control readonly-input" rows="4" readonly [value]="vehicleData.address"></textarea>
                </div>
                <div class="form-group row">
                    <label>Mobile No :</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.mobileNo" readonly>
                </div>
            </div>

            <!-- Column 3 -->
            <div class="form-column">
                <div class="form-group row">
                    <label>Purchase B.No :</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.purchaseBNo" readonly>
                </div>
                <div class="form-group row">
                    <label>Hypothication:</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.hypothication" readonly>
                </div>
                <div class="form-group row">
                    <label>Engine No:</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.engineNo" readonly>
                </div>
                <div class="form-group row">
                    <label>Vehicle:</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.vehicle" readonly>
                </div>
                <div class="form-group row">
                    <label>Color:</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.color" readonly>
                </div>
                <div class="form-group row">
                    <label>P.Code:</label>
                    <input type="text" class="form-control readonly-input" [value]="vehicleData.pCode" readonly>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </main>
  
  <div style="height: 50px;"></div>
  <app-admin-footer></app-admin-footer>
</div>
  `,
  styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 5px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    
    .breadcrumb-bar { font-size: 13px; color: #555; padding: 15px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-item { color: #555; text-decoration: none; display: flex; align-items: center; gap: 5px; }
    .breadcrumb-bar .active { color: #333; font-weight: 400; }
    .separator { color: #999; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .menu-icon { font-size: 14px; cursor: pointer; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .header-actions { display: flex; gap: 8px; }
    .btn-action { border: none; color: white; padding: 6px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    .btn-sticker { background-color: #c92127; }
    .btn-sale-letter { background-color: #f39c12; }
    .btn-print-enquiry { background-color: #4caf50; }
    
    .page-card-content { padding: 30px; background: #fff; border-bottom: 25px solid #f4f4f4; }
    
    .enquiry-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; align-items: start; }
    
    .form-column { display: flex; flex-direction: column; gap: 15px; }
    
    .form-group { display: flex; align-items: center; gap: 10px; }
    .form-group.align-start { align-items: flex-start; }
    .form-group label { min-width: 140px; text-align: right; font-size: 13px; color: #333; font-weight: 400; }
    
    .form-control { flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid #ddd; border-radius: 4px; background: #fff !important; transition: border-color 0.2s; height: 32px; width: 100%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.075); }
    .readonly-input { background-color: #fff !important; border: 1px solid #ddd; outline: none; border-left: none; border-right: none; border-top: none; padding-left: 0; box-shadow: none; border-radius: 0; cursor: default; color: #555; }
    textarea.form-control { height: auto; border: 1px solid #eee; background: #fafafa !important; padding: 5px; }

    /* Searchable Dropdown Styles */
    .search-container { position: relative; flex: 1; }
    .search-box-wrapper { position: relative; display: flex; align-items: center; }
    .dropdown-arrow { position: absolute; right: 10px; font-size: 10px; color: #777; pointer-events: none; }
    .search-results { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 4px; margin: 2px 0 0 0; padding: 0; list-style: none; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .search-results li { padding: 8px 12px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f4f4f4; }
    .search-results li:hover { background-color: #f1f1f1; color: #1a62bf; }
    .search-results li:last-child { border-bottom: none; }
    
    @media (max-width: 1100px) { .enquiry-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 768px) { .enquiry-grid { grid-template-columns: 1fr; } .form-group label { min-width: 110px; text-align: left; } }
  `]
})
export class AdminFindvehicle implements OnInit {
  chassisList = signal<string[]>([]);
  chassisSearch: string = '';
  showList: boolean = false;
  selectedChassis: string = '';
  
  // Computed Signal for Filtering
  filteredChassis = computed(() => {
    const list = this.chassisList();
    const query = this.chassisSearch.toLowerCase();
    if (!query) return list.slice(0, 100); // Show first 100 if empty
    return list.filter(c => c.toLowerCase().includes(query)).slice(0, 100);
  });

  vehicleData = {
    invoiceNo: '',
    invoiceDate: '',
    regnType: '',
    customerName: '',
    fatherName: '',
    address: '',
    mobileNo: '',
    purchaseBNo: '',
    hypothication: '',
    engineNo: '',
    vehicle: '',
    color: '',
    pCode: ''
  };

  constructor(private api: ApiService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.loadChassisList();
  }

  loadChassisList() {
    this.api.listChassis().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.chassisList.set(res.data || []);
        }
      },
      error: (err: any) => console.error('Error loading chassis list', err)
    });
  }

  onSearchInput() {
    this.showList = true;
    if (!this.chassisSearch) {
       this.resetForm();
       this.selectedChassis = '';
    }
  }

  selectChassis(c: string) {
    this.chassisSearch = c;
    this.selectedChassis = c;
    this.showList = false;
    this.fetchVehicleDetails(c);
  }

  fetchVehicleDetails(chassis: string) {
    this.api.getVehicleByChassis(chassis).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const d = res.data;
          this.vehicleData = {
            invoiceNo: d.inv_no || '',
            invoiceDate: d.inv_inv_date ? this.datePipe.transform(d.inv_inv_date, 'dd-MM-yyyy') || '' : '',
            regnType: d.inv_type || '',
            customerName: d.inv_cus || '',
            fatherName: d.inv_cus_father_hus || '',
            address: d.inv_cus_addres || '',
            mobileNo: d.inv_pho || '',
            purchaseBNo: d.purchase_bill_no || '',
            hypothication: d.inv_hypothication || '',
            engineNo: d.in_engine || '',
            vehicle: d.inv_vehicle || '',
            color: d.inv_color || '',
            pCode: d.inv_vehicle_code || ''
          };
        } else {
          this.resetForm();
        }
      },
      error: (err: any) => {
        console.error('Error fetching vehicle details', err);
        this.resetForm();
      }
    });
  }

  resetForm() {
    this.vehicleData = {
      invoiceNo: '',
      invoiceDate: '',
      regnType: '',
      customerName: '',
      fatherName: '',
      address: '',
      mobileNo: '',
      purchaseBNo: '',
      hypothication: '',
      engineNo: '',
      vehicle: '',
      color: '',
      pCode: ''
    };
  }

  closeDropdowns() {
    this.showList = false;
  }

  printSticker() {
    if (!this.selectedChassis) return;
    const url = this.api.getVehicleStickerUrl(this.selectedChassis);
    window.open(url, '_blank');
  }

  printSaleLetter() {
    if (!this.selectedChassis) return;
    const url = this.api.getVehicleSaleLetterUrl(this.selectedChassis);
    window.open(url, '_blank');
  }

  printEnquiry() {
    if (!this.selectedChassis) return;
    const url = this.api.getVehicleEnquiryPrintUrl(this.selectedChassis);
    window.open(url, '_blank');
  }
}
