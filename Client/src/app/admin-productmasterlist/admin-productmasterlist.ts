import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-productmasterlist',
  standalone: true,
  imports: [CommonModule, AdminNav, RouterLink],
  template: `
<div class="app-container">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home"><i class="fas fa-home"></i> Home</a>
        <span> > </span>
        <span class="active">List Product Master</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Product Master List</h2>
          </div>
          <div class="header-actions">
             <button class="btn-add" routerLink="/admin-productmaster">Add Product Master</button>
             <button class="btn-update">Update Product Price</button>
          </div>
        </header>

        <div class="page-card-content">
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 50px;">SI No</th>
                  <th>Product Code</th>
                  <th>Name</th>
                  <th>Vehicle Class</th>
                  <th>Fuel</th>
                  <th>Description</th>
                  <th>Basic Price</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>Total Price</th>
                  <th style="width: 100px;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="products.length === 0">
                  <td colspan="11" class="no-data">No data available</td>
                </tr>
                <tr *ngFor="let product of products; let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ product.labour_code }}</td>
                  <td>{{ product.labour_title }}</td>
                  <td>{{ product.repair_type }}</td>
                  <td>{{ product.fuel }}</td>
                  <td class="desc-cell">{{ product.description }}</td>
                  <td>{{ product.sale_price | number:'1.2-2' }}</td>
                  <td>{{ product.cgst }}%</td>
                  <td>{{ product.sgst }}%</td>
                  <td>{{ calculateTotal(product) | number:'1.2-2' }}</td>
                  <td>
                    <button class="btn-action">Action <i class="fas fa-caret-down"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <div style="height: 50px;"></div>
</div>
  `,
  styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 2px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    .breadcrumb-bar { font-size: 13px; color: #555; padding: 10px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-bar a { color: #555; text-decoration: none; cursor: pointer; }
    .breadcrumb-bar .active { font-weight: 500; color: #333; }
    .theme-card { background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
    .blue-header-strip { background: #0b5ed7; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .blue-header-strip h2 { margin: 0; font-size: 16px; font-weight: 600; }
    .header-actions { display: flex; gap: 0; }
    .btn-add { background-color: #c92127; color: white; border: none; padding: 8px 15px; font-size: 13px; font-weight: 600; cursor: pointer; border-right: 1px solid rgba(255,255,255,0.2); }
    .btn-update { background-color: #28a745; color: white; border: none; padding: 8px 15px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .page-card-content { padding: 0; background: #fff; }
    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .report-table th { background-color: #f1f1f1; color: #333; font-weight: 600; padding: 12px 10px; text-align: left; border: 1px solid #ddd; white-space: nowrap; }
    .report-table td { padding: 10px; border: 1px solid #ddd; color: #444; vertical-align: middle; }
    .desc-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .report-table tr:nth-child(even) { background-color: #fafafa; }
    .no-data { text-align: center; padding: 40px !important; font-style: italic; color: #999; }
    .btn-action { background-color: #c92127; color: white; border: none; padding: 6px 15px; font-size: 12px; font-weight: 500; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; }
    @media (max-width: 768px) { .header-actions { flex-direction: column; } }
  `]
})
export class AdminProductmasterlist implements OnInit {
  products: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.apiService.listProducts().subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data;
        }
      },
      error: (err) => console.error('Error loading products', err)
    });
  }

  calculateTotal(product: any): number {
    const basic = Number(product.sale_price) || 0;
    const cgst = basic * (Number(product.cgst) / 100);
    const sgst = basic * (Number(product.sgst) / 100);
    const cess = basic * (Number(product.cess) / 100);
    return basic + cgst + sgst + cess;
  }
}
