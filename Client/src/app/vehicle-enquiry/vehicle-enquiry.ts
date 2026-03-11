import { Component, OnInit, HostListener, ElementRef, ViewChild, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-vehicle-enquiry',
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
        <span>Master Operation</span>
        <span> > </span>
        <span class="active">Vehicle Enquiry</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="orange-header-strip" [style.background]="isAdmin() ? '#385dc4ff' : '#f36f21'">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Vehicle Enquiry</h2>
          </div>
          <div class="header-actions">
             <button class="btn-sticker" (click)="generatePdf('sticker')" [disabled]="!chassisNo()">{{ chassisNo() ? 'Sticker' : 'Select chassis no' }}</button>
             <button class="btn-sale-letter" (click)="generatePdf('sale-letter')" [disabled]="!chassisNo()">{{ chassisNo() ? 'Sale Letter' : 'Select chassis no' }}</button>
             <button class="btn-print" (click)="generatePdf('print-enquiry')" [disabled]="!chassisNo()">{{ chassisNo() ? 'Print Enquiry' : 'Select chassis no' }}</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="ledger-form">
            <div class="form-cols-wrapper">
                
                <!-- Column 1 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Chassis No:</label>
                        
                        <!-- Custom Searchable Dropdown -->
                        <div class="custom-dropdown" #dropdownRef>
                            <div class="dropdown-toggle" (click)="toggleDropdown()">
                                {{ chassisNo() || '--Select--' }}
                                <i class="fas fa-caret-down"></i>
                            </div>
                            <div class="dropdown-menu" *ngIf="isDropdownOpen()">
                                <div class="dropdown-search">
                                    <input type="text" placeholder="Search..." [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" name="searchTerm" #searchInputRef>
                                </div>
                                <div class="dropdown-options-list">
                                    <div class="dropdown-option" (click)="selectChassis('')">--Select--</div>
                                    <div class="dropdown-option" *ngFor="let c of filteredChassisList()" (click)="selectChassis(c)">
                                        {{ c }}
                                    </div>
                                    <div class="dropdown-option no-results" *ngIf="filteredChassisList().length === 0">No results found</div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div class="form-group">
                        <label>Invoice No :</label>
                        <input type="text" class="form-control" [ngModel]="invoiceNo()" name="invoiceNo" disabled>
                    </div>
                    <div class="form-group">
                        <label>Invoice Date :</label>
                        <input type="text" class="form-control" [ngModel]="invoiceDate()" name="invoiceDate" disabled>
                    </div>
                    <div class="form-group">
                        <label>Regn Type :</label>
                        <input type="text" class="form-control" [ngModel]="regnType()" name="regnType" disabled>
                    </div>
                </div>

                <!-- Column 2 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Customer Name:</label>
                        <input type="text" class="form-control" [ngModel]="customerName()" name="customerName" disabled>
                    </div>
                    <div class="form-group">
                        <label>Father/Husband:</label>
                        <input type="text" class="form-control" [ngModel]="relName()" name="relName" disabled>
                    </div>
                     <div class="form-group" style="align-items: flex-start;">
                        <label style="margin-top: 5px;">Address:</label>
                        <textarea class="form-control" [ngModel]="address()" name="address" rows="5" disabled></textarea>
                    </div>
                    <div class="form-group">
                        <label>Mobile No :</label>
                        <input type="text" class="form-control" [ngModel]="mobileNo()" name="mobileNo" disabled>
                    </div>
                </div>

                <!-- Column 3 -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Purchase B.No :</label>
                        <input type="text" class="form-control" [ngModel]="purchaseBNo()" name="purchaseBNo" disabled>
                    </div>
                    <div class="form-group">
                        <label>Hypothication:</label>
                        <input type="text" class="form-control" [ngModel]="hypothication()" name="hypothication" disabled>
                    </div>
                    <div class="form-group">
                        <label>Engine No:</label>
                        <input type="text" class="form-control" [ngModel]="engineNo()" name="engineNo" disabled>
                    </div>
                    <div class="form-group">
                        <label>Vehicle:</label>
                        <input type="text" class="form-control" [ngModel]="vehicle()" name="vehicle" disabled>
                    </div>
                    <div class="form-group">
                        <label>Color:</label>
                        <input type="text" class="form-control" [ngModel]="color()" name="color" disabled>
                    </div>
                    <div class="form-group">
                        <label>P.Code:</label>
                        <input type="text" class="form-control" [ngModel]="pCode()" name="pCode" disabled>
                    </div>
                </div>

            </div>

             <div class="form-footer-spacer"></div>

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
        gap: 0; /* Buttons touch each other in screenshot */
    }

    .btn-sticker {
        background-color: #b71c1c; /* Dark Red */
        color: white;
        border: none;
        padding: 8px 15px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 600;
        border-right: 1px solid rgba(255,255,255,0.2);
    }

    .btn-sale-letter {
        background-color: #f57f17; /* Yellow/Orange closer to screenshot */
        color: white; 
        border: none;
        padding: 8px 15px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 600;
         border-right: 1px solid rgba(255,255,255,0.2);
    }

    .btn-print {
        background-color: #4caf50; /* Green */
        color: white;
        border: none;
        padding: 8px 15px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 600;
        border-radius: 0 3px 3px 0;
    }
    
    .btn-sticker { border-radius: 3px 0 0 3px; }


    /* Form Grid */
    .page-card-content {
        padding: 30px 20px;
        background: #fff;
        min-height: 500px;
    }

    .ledger-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding: 10px;
    }
    
    .form-cols-wrapper {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px; 
        align-items: start;
    }

    .form-column {
        display: flex;
        flex-direction: column;
        gap: 20px;
        border-bottom: none;
        padding-bottom: 0;
    }


    .form-group {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 30px;
    }

    .form-group label {
        font-size: 12px;
        color: #333;
        white-space: nowrap;
        text-align: right;
        min-width: 100px; 
        font-weight: 400;
    }

    .form-control {
        flex: 1;
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid #eee;
        background: #fbfbfb;
        border-radius: 2px;
        width: 100%;
        height: 28px;
    }
    .form-control:focus {
        border: 1px solid #ccc;
        background: #fff;
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
        border: 1px solid #eee;
        background: #fbfbfb;
        border-radius: 2px;
        height: 28px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #333;
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

    textarea.form-control {
        resize: none;
        height: auto; 
    }

    .form-footer-spacer {
        height: 50px;
        background: #f9f9f9;
        margin-top: 20px;
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
export class VehicleEnquiryComponent implements OnInit {

    @ViewChild('dropdownRef') dropdownRef!: ElementRef;
    @ViewChild('searchInputRef') searchInputRef!: ElementRef;

    isAdmin = signal(false);
    chassisNo = signal('');
    invoiceNo = signal('');
    invoiceDate = signal('');
    regnType = signal('');

    customerName = signal('');
    relName = signal('');
    address = signal('');
    mobileNo = signal('');

    purchaseBNo = signal('');
    hypothication = signal('');
    engineNo = signal('');
    vehicle = signal('');
    color = signal('');
    pCode = signal('');

    chassisList = signal<string[]>([]);
    searchTerm = signal('');
    isDropdownOpen = signal(false);

    filteredChassisList = computed(() => {
        const term = this.searchTerm().toLowerCase();
        return this.chassisList().filter(c => c.toLowerCase().includes(term));
    });

    constructor(private router: Router, private api: ApiService) { }

    ngOnInit(): void {
        const user = this.api.getCurrentUser();
        this.isAdmin.set(user?.role == 1 || user?.role_des === 'admin');
        this.loadChassisList();
    }

    loadChassisList() {
        const user = this.api.getCurrentUser();
        const isAdmin = user?.role == 1 || user?.role_des === 'admin';
        const branchId = isAdmin ? undefined : user?.branch_id;

        this.api.listChassis(branchId).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.chassisList.set(res.data || []);
                }
            },
            error: (err: any) => console.error('Error loading chassis list:', err)
        });
    }

    toggleDropdown() {
        this.isDropdownOpen.update(v => !v);
        if (this.isDropdownOpen()) {
            this.searchTerm.set('');
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
            this.isDropdownOpen.set(false);
        }
    }

    selectChassis(c: string) {
        this.chassisNo.set(c);
        this.isDropdownOpen.set(false);
        this.onChassisSelection();
    }

    onChassisSelection() {
        const selectedChassis = this.chassisNo();
        if (!selectedChassis) {
            this.clearForm();
            return;
        }

        const user = this.api.getCurrentUser();
        const isAdmin = user?.role == 1 || user?.role_des === 'admin';
        const branchId = isAdmin ? undefined : user?.branch_id;

        this.api.getVehicleByChassis(selectedChassis, branchId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const d = res.data;
                    this.invoiceNo.set(d.inv_no || '');
                    this.invoiceDate.set(d.inv_inv_date ? new Date(d.inv_inv_date).toLocaleDateString('en-IN') : '');
                    this.regnType.set(d.inv_type || '');
                    this.customerName.set(d.inv_cus || '');
                    this.relName.set(d.inv_cus_father_hus || '');
                    this.address.set(d.inv_cus_addres || '');
                    this.mobileNo.set(d.inv_pho || '');
                    this.hypothication.set(d.inv_hypothication || '');
                    this.engineNo.set(d.in_engine || '');
                    this.vehicle.set(d.inv_vehicle || '');
                    this.color.set(d.inv_color || '');
                    this.pCode.set(d.inv_vehicle_code || '');
                    this.purchaseBNo.set(d.purchase_bill_no || '');
                }
            },
            error: (err) => {
                console.error('Error fetching vehicle details:', err);
                this.clearForm();
            }
        });
    }

    clearForm() {
        this.invoiceNo.set('');
        this.invoiceDate.set('');
        this.regnType.set('');
        this.customerName.set('');
        this.relName.set('');
        this.address.set('');
        this.mobileNo.set('');
        this.purchaseBNo.set('');
        this.hypothication.set('');
        this.engineNo.set('');
        this.vehicle.set('');
        this.color.set('');
        this.pCode.set('');
    }

    generatePdf(type: string): void {
        const chassis = this.chassisNo();
        if (!chassis) return;

        let url = '';
        if (type === 'sticker') url = this.api.getVehicleStickerUrl(chassis);
        else if (type === 'sale-letter') url = this.api.getVehicleSaleLetterUrl(chassis);
        else if (type === 'print-enquiry') url = this.api.getVehicleEnquiryPrintUrl(chassis);

        if (url) window.open(url, '_blank');
    }

    navigate(path: string) { this.router.navigate([path]); }
}
