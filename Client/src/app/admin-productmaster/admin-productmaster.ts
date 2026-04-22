import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-productmaster',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, RouterLink],
  template: `
<div class="app-container">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <span class="breadcrumb-item">Master Operation</span>
        <span class="separator"> > </span>
        <span class="active">Add Product Master</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Add Product Master</h2>
          </div>
          <div class="header-actions">
             <button class="btn-save" (click)="onSubmit()">Save</button>
             <button class="btn-list" routerLink="/admin-productmasterlist">List Product Master</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="master-form">
            <div class="form-grid-4-cols">
                
                <!-- Column 1 -->
                <div class="form-column">
                    <div class="form-group row">
                        <label>Product Code :</label>
                        <input type="text" class="form-control" name="code" [(ngModel)]="product.code" required>
                    </div>
                    <div class="form-group row">
                        <label>Product Name :</label>
                        <input type="text" class="form-control" name="name" [(ngModel)]="product.name" required>
                    </div>
                    <div class="form-group row">
                        <label>Class :</label>
                        <input type="text" class="form-control" name="class" [(ngModel)]="product.class">
                    </div>
                    <div class="form-group row">
                        <label>F.A Weight :</label>
                        <input type="text" class="form-control" name="faWeight" [(ngModel)]="product.faWeight">
                    </div>
                    <div class="form-group row">
                        <label>R.A Weight(Gross Weight):</label>
                        <input type="text" class="form-control" name="raWeight" [(ngModel)]="product.raWeight">
                    </div>
                    <div class="form-group row">
                        <label>O.A Weight :</label>
                        <input type="text" class="form-control" name="oaWeight" [(ngModel)]="product.oaWeight">
                    </div>
                    <div class="form-group row">
                        <label>HSN Code :</label>
                        <input type="text" class="form-control" name="hsnCode" [(ngModel)]="product.hsnCode">
                    </div>
                </div>

                <!-- Column 2 -->
                <div class="form-column">
                    <div class="form-group row">
                        <label>T.A Weight :</label>
                        <input type="text" class="form-control" name="taWeight" [(ngModel)]="product.taWeight">
                    </div>
                    <div class="form-group row">
                        <label>U.L Weight :</label>
                        <input type="text" class="form-control" name="ulWeight" [(ngModel)]="product.ulWeight">
                    </div>
                    <div class="form-group row">
                        <label>R.Weight :</label>
                        <input type="text" class="form-control" name="rWeight" [(ngModel)]="product.rWeight">
                    </div>
                    <div class="form-group row">
                        <label>H.P:</label>
                        <input type="text" class="form-control" name="hp" [(ngModel)]="product.hp">
                    </div>
                    <div class="form-group row">
                        <label>Description:</label>
                        <input type="text" class="form-control" name="description" [(ngModel)]="product.description">
                    </div>
                </div>

                <!-- Column 3 -->
                <div class="form-column">
                    <div class="form-group row">
                        <label>C.C :</label>
                        <input type="text" class="form-control" name="cc" [(ngModel)]="product.cc">
                    </div>
                    <div class="form-group row">
                        <label>Type Of Body :</label>
                        <input type="text" class="form-control" name="typeOfBody" [(ngModel)]="product.typeOfBody">
                    </div>
                    <div class="form-group row">
                        <label>No of Cylinders :</label>
                        <input type="text" class="form-control" name="noOfCylinders" [(ngModel)]="product.noOfCylinders">
                    </div>
                    <div class="form-group row">
                        <label>Fuel :</label>
                        <input type="text" class="form-control" name="fuel" [(ngModel)]="product.fuel">
                    </div>
                    <div class="form-group row">
                        <label>Wheel Base :</label>
                        <input type="text" class="form-control" name="wheelBase" [(ngModel)]="product.wheelBase">
                    </div>
                    <div class="form-group row">
                        <label>Booking Code :</label>
                        <input type="text" class="form-control" name="bookingCode" [(ngModel)]="product.bookingCode">
                    </div>
                </div>

                <!-- Column 4 -->
                <div class="form-column">
                    <div class="form-group row">
                        <label>Seat Capacity :</label>
                        <input type="text" class="form-control" name="seatCapacity" [(ngModel)]="product.seatCapacity">
                    </div>
                    <div class="form-group row">
                        <label>Basic Price :</label>
                        <input type="number" class="form-control" name="basicPrice" [(ngModel)]="product.basicPrice" (ngModelChange)="calculateTotal()">
                    </div>
                    <div class="form-group row">
                        <label>GST :</label>
                        <div class="custom-select-wrap" (click)="$event.stopPropagation()">
                            <div class="custom-select-trigger" (click)="isTaxDropdownOpen = !isTaxDropdownOpen">
                                {{ selectedTaxLabel || '-- Select GST --' }}
                                <span class="caret">&#9660;</span>
                            </div>
                            <div class="custom-select-dropdown" *ngIf="isTaxDropdownOpen">
                                <input class="search-input" type="text" placeholder="Search GST..."
                                    [(ngModel)]="taxSearchTerm" name="taxSearchTerm"
                                    (click)="$event.stopPropagation()" autofocus>
                                <div class="custom-option first-opt" (click)="clearTaxSelection()">-- Select GST --</div>
                                <div class="custom-option"
                                    *ngFor="let slab of filteredTaxSlabs()"
                                    (click)="selectTaxSlab(slab)">
                                    {{ gstLabel(slab) }}
                                </div>
                                <div class="custom-option no-result" *ngIf="filteredTaxSlabs().length === 0">pls add gst from tax master</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label>CGST :</label>
                        <input type="number" class="form-control readonly" name="cgst" [(ngModel)]="product.cgst" readonly>
                    </div>
                    <div class="form-group row">
                        <label>SGST :</label>
                        <input type="number" class="form-control readonly" name="sgst" [(ngModel)]="product.sgst" readonly>
                    </div>
                    <div class="form-group row">
                        <label>CESS :</label>
                        <input type="number" class="form-control readonly" name="cess" [(ngModel)]="product.cess" readonly>
                    </div>
                    <div class="form-group row">
                        <label>Total :</label>
                        <input type="number" class="form-control readonly" name="total" [(ngModel)]="totalPrice" readonly>
                    </div>
                    <div class="form-group row">
                        <label>Purchase Cost :</label>
                        <input type="number" class="form-control" name="purchaseCost" [(ngModel)]="product.purchaseCost">
                    </div>
                </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  </main>
  
  <div style="height: 50px;"></div>
</div>
  `,
  styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 5px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    
    .breadcrumb-bar { font-size: 13px; color: #555; padding: 15px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-item { color: #555; text-decoration: none; display: flex; align-items: center; gap: 5px; }
    .breadcrumb-bar .active { color: #333; }
    .separator { color: #999; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: visible; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .menu-icon { font-size: 14px; cursor: pointer; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .header-actions { display: flex; gap: 5px; }
    .btn-save { background-color: #4caf50; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    .btn-list { background-color: #c92127; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 30px 20px; background: #f4f4f4; }
    
    .form-grid-4-cols { display: grid; grid-template-columns: 1fr 1fr 1fr 1.85fr; gap: 20px; align-items: start; }
    
    .form-column { display: flex; flex-direction: column; gap: 10px; }
    
    .form-group { display: flex; align-items: center; gap: 10px; }
    .form-group.align-start { align-items: flex-start; }
    .form-group label { min-width: 130px; text-align: right; font-size: 12px; color: #333; font-weight: 400; line-height: 1.2; }
    
    .form-control { flex: 1; padding: 4px 8px; font-size: 12px; border: 1px solid #ccc; border-radius: 2px; background: #fff !important; transition: border-color 0.2s; height: 28px; width: 100%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.075); }
    textarea.form-control { height: auto; }
    .form-control:focus { border-color: #1a62bf; outline: none; }
    .form-control::placeholder { color: #aaa; }
    .gray-bg { background-color: #f7f7f7 !important; }

    /* Custom GST Dropdown */
    .custom-select-wrap { position: relative; flex: 1; }
    .custom-select-trigger { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; font-size: 12px; border: 1px solid #ccc; border-radius: 2px; background: #fff; cursor: pointer; height: 28px; box-shadow: inset 0 1px 1px rgba(0,0,0,0.075); user-select: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .custom-select-trigger:hover { border-color: #1a62bf; }
    .caret { font-size: 10px; color: #666; flex-shrink: 0; margin-left: 4px; }
    .custom-select-dropdown { position: absolute; top: 100%; right: 0; min-width: 400px; background: #fff; border: 1px solid #ccc; border-top: none; border-radius: 0 0 3px 3px; z-index: 9999; max-height: 260px; overflow-y: auto; box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
    .search-input { width: 100%; padding: 6px 10px; font-size: 12px; border: none; border-bottom: 1px solid #eee; outline: none; box-sizing: border-box; }
    .custom-option { padding: 7px 12px; font-size: 12px; cursor: pointer; color: #333; white-space: nowrap; }
    .custom-option:hover { background: #e8f0fe; }
    .custom-option.first-opt { color: #888; font-style: italic; }
    .custom-option.no-result { color: #c92127; cursor: default; font-weight: 500; }

    @media (max-width: 1200px) { .form-grid-4-cols { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .form-grid-4-cols { grid-template-columns: 1fr; } .form-group label { min-width: 100px; text-align: left; } }
  `]
})
export class AdminProductmaster implements OnInit {
  products: any[] = [];
  taxSlabs: any[] = [];

  product = {
    code: '',
    name: '',
    class: '',
    faWeight: '',
    raWeight: '',
    oaWeight: '',
    hsnCode: '',
    taWeight: '',
    ulWeight: '',
    rWeight: '',
    hp: '',
    description: '',
    cc: '',
    typeOfBody: '',
    noOfCylinders: '',
    fuel: '',
    wheelBase: '',
    bookingCode: '',
    seatCapacity: '',
    basicPrice: 0,
    cgst: 0,
    sgst: 0,
    cess: 0,
    purchaseCost: 0,
    idTaxSlab: 0
  };

  totalPrice: number = 0;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadTaxSlabs();
  }

  loadTaxSlabs() {
    this.apiService.getTaxSlabs(1, 'all').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.taxSlabs = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error loading tax slabs', err);
      }
    });
  }

  // Custom GST dropdown state
  isTaxDropdownOpen = false;
  taxSearchTerm = '';
  selectedTaxLabel = '';

  gstLabel(slab: any): string {
    const g = Number(slab.GST) || 0;
    const c = Number(slab.CGST) || 0;
    const s = Number(slab.SGST) || 0;
    const ce = Number(slab.CESS) || 0;
    return `GST ${g.toFixed(2)}% (CGST ${c.toFixed(2)}% + SGST ${s.toFixed(2)}% + CESS ${ce.toFixed(2)})%`;
  }

  filteredTaxSlabs(): any[] {
    const term = this.taxSearchTerm.toLowerCase();
    if (!term) return this.taxSlabs;
    return this.taxSlabs.filter(s => this.gstLabel(s).toLowerCase().includes(term));
  }

  selectTaxSlab(slab: any) {
    const basicPrice = Number(this.product.basicPrice) || 0;
    this.product.idTaxSlab = slab.id_tax_slab;
    this.product.cgst = Number(((basicPrice * (Number(slab.CGST) || 0)) / 100).toFixed(2));
    this.product.sgst = Number(((basicPrice * (Number(slab.SGST) || 0)) / 100).toFixed(2));
    this.product.cess = Number(((basicPrice * (Number(slab.CESS) || 0)) / 100).toFixed(2));
    this.selectedTaxLabel = this.gstLabel(slab);
    this.isTaxDropdownOpen = false;
    this.taxSearchTerm = '';
    this.calculateTotal();
  }

  clearTaxSelection() {
    this.product.idTaxSlab = 0;
    this.product.cgst = 0;
    this.product.sgst = 0;
    this.product.cess = 0;
    this.selectedTaxLabel = '';
    this.isTaxDropdownOpen = false;
    this.taxSearchTerm = '';
    this.calculateTotal();
  }

  closeTaxDropdown() {
    this.isTaxDropdownOpen = false;
  }

  loadProducts() {
    this.apiService.listProducts(1, 1000).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.products = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error loading product list', err);
      }
    });
  }

  onTaxSlabChange(event: any) {
    const slabId = event.target.value;
    if (!slabId) return;
    const slab = this.taxSlabs.find(s => s.id_tax_slab == slabId);
    if (slab) this.selectTaxSlab(slab);
  }

  calculateTotal() {
    const basic = Number(this.product.basicPrice) || 0;
    const slab = this.taxSlabs.find(s => s.id_tax_slab == this.product.idTaxSlab);
    if (slab) {
      this.product.cgst = Number(((basic * (Number(slab.CGST) || 0)) / 100).toFixed(2));
      this.product.sgst = Number(((basic * (Number(slab.SGST) || 0)) / 100).toFixed(2));
      this.product.cess = Number(((basic * (Number(slab.CESS) || 0)) / 100).toFixed(2));
    }
    this.totalPrice = Number((basic + this.product.cgst + this.product.sgst + this.product.cess).toFixed(2));
  }

  private isProductCodeDuplicate(code: string): boolean {
    return this.products.some(p => p.code?.toString().trim().toLowerCase() === code.trim().toLowerCase());
  }

  onSubmit() {
    if (!this.product.code) {
      alert('Product Code is required');
      return;
    }

    if (!this.product.name) {
      alert('Product Name is required');
      return;
    }

    if (!this.product.idTaxSlab) {
      alert('Please select a GST (Tax Slab)');
      return;
    }

    if (this.isProductCodeDuplicate(this.product.code)) {
      alert('Product code must be unique. This code already exists.');
      return;
    }

    this.apiService.addProductMaster({
      ...this.product,
      totalPrice: this.totalPrice
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
           alert('Product Master details has been saved successfully!');
           this.resetForm();
        } else {
           alert('Failed to save product: ' + res.message);
        }
      },
      error: (err: any) => {
        console.error(err);
        const message = err?.error?.message || 'Server error occurred while saving product details';
        alert(message);
      }
    });
  }

  resetForm() {
    this.product = {
        code: '',
        name: '',
        class: '',
        faWeight: '',
        raWeight: '',
        oaWeight: '',
        hsnCode: '',
        taWeight: '',
        ulWeight: '',
        rWeight: '',
        hp: '',
        description: '',
        cc: '',
        typeOfBody: '',
        noOfCylinders: '',
        fuel: '',
        wheelBase: '',
        bookingCode: '',
        seatCapacity: '',
        basicPrice: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
        purchaseCost: 0,
        idTaxSlab: 0
    };
    this.totalPrice = 0;
    this.selectedTaxLabel = '';
    this.taxSearchTerm = '';
  }
}
