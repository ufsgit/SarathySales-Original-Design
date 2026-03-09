import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-productmaster',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, AdminFooter, RouterLink],
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
                        <input type="text" class="form-control" name="code" [(ngModel)]="product.code">
                    </div>
                    <div class="form-group row">
                        <label>Product Name :</label>
                        <input type="text" class="form-control" name="name" [(ngModel)]="product.name">
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
                    <div class="form-group row align-start">
                        <label>Description:</label>
                        <textarea class="form-control" name="description" [(ngModel)]="product.description" rows="4"></textarea>
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
                        <label>CGST :</label>
                        <input type="number" class="form-control" name="cgst" [(ngModel)]="product.cgst" (ngModelChange)="calculateTotal()">
                    </div>
                    <div class="form-group row">
                        <label>SGST :</label>
                        <input type="number" class="form-control" name="sgst" [(ngModel)]="product.sgst" (ngModelChange)="calculateTotal()">
                    </div>
                    <div class="form-group row">
                        <label>CESS :</label>
                        <input type="number" class="form-control" name="cess" [(ngModel)]="product.cess" (ngModelChange)="calculateTotal()">
                    </div>
                    <div class="form-group row">
                        <label>Total :</label>
                        <input type="text" class="form-control gray-bg" name="total" [value]="totalPrice" readonly>
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
  <app-admin-footer></app-admin-footer>
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

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .menu-icon { font-size: 14px; cursor: pointer; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .header-actions { display: flex; gap: 5px; }
    .btn-save { background-color: #4caf50; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    .btn-list { background-color: #c92127; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 30px 20px; background: #f4f4f4; }
    
    .form-grid-4-cols { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: start; }
    
    .form-column { display: flex; flex-direction: column; gap: 10px; }
    
    .form-group { display: flex; align-items: center; gap: 10px; }
    .form-group.align-start { align-items: flex-start; }
    .form-group label { min-width: 130px; text-align: right; font-size: 12px; color: #333; font-weight: 400; line-height: 1.2; }
    
    .form-control { flex: 1; padding: 4px 8px; font-size: 12px; border: 1px solid #ccc; border-radius: 2px; background: #fff !important; transition: border-color 0.2s; height: 28px; width: 100%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.075); }
    textarea.form-control { height: auto; }
    .form-control:focus { border-color: #1a62bf; outline: none; }
    .form-control::placeholder { color: #aaa; }
    .gray-bg { background-color: #f7f7f7 !important; }

    @media (max-width: 1200px) { .form-grid-4-cols { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .form-grid-4-cols { grid-template-columns: 1fr; } .form-group label { min-width: 100px; text-align: left; } }
  `]
})
export class AdminProductmaster implements OnInit {
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
    purchaseCost: 0
  };

  totalPrice: number = 0;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {}

  calculateTotal() {
    const basic = Number(this.product.basicPrice) || 0;
    const cgst = Number(this.product.cgst) || 0;
    const sgst = Number(this.product.sgst) || 0;
    const cess = Number(this.product.cess) || 0;
    this.totalPrice = basic + cgst + sgst + cess;
  }

  onSubmit() {
    if (!this.product.code || !this.product.name) {
      alert('Product Code and Name are required');
      return;
    }

    this.apiService.addProductMaster(this.product).subscribe({
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
        alert('Server error occurred while saving product details');
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
        purchaseCost: 0
    };
    this.totalPrice = 0;
  }
}
