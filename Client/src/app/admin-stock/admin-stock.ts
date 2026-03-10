import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, AdminFooter, RouterLink],
  template: `
<div class="app-container" (click)="closeDropdowns()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <span class="active">{{ isEdit() ? 'Edit Opening Stock' : 'Add Opening Stock' }}</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>{{ isEdit() ? 'Edit Opening Stocks' : 'Add Opening Stocks' }}</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="viewList()">List Stocks</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="master-form" (ngSubmit)="onSubmit()">
            <div class="form-narrow-layout">
                
                <!-- Branch Dropdown with Search -->
                <div class="form-group row">
                    <label>Branch :</label>
                    <div class="search-container" (click)="$event.stopPropagation()">
                        <div class="search-box-wrapper">
                            <input type="text" 
                                   class="form-control" 
                                   [ngModel]="branchSearch()" 
                                   (ngModelChange)="branchSearch.set($event); onBranchSearchInput()"
                                   name="branchSearch"
                                   (focus)="showBranchList.set(true)"
                                   placeholder="Search Branch..."
                                   [readonly]="isEdit()">
                            <i class="fas fa-chevron-down dropdown-arrow" *ngIf="!isEdit()"></i>
                        </div>
                        <ul class="search-results" *ngIf="showBranchList() && filteredBranches().length > 0 && !isEdit()">
                            <li *ngFor="let b of filteredBranches()" (click)="selectBranch(b)">{{ b.branch_name }}</li>
                        </ul>
                    </div>
                </div>

                <!-- Product Dropdown with Search -->
                <div class="form-group row">
                    <label>Select Item:</label>
                    <div class="search-container" (click)="$event.stopPropagation()">
                        <div class="search-box-wrapper">
                            <input type="text" 
                                   class="form-control" 
                                   [ngModel]="productSearch()" 
                                   (ngModelChange)="productSearch.set($event); onProductSearchInput()"
                                   name="productSearch"
                                   (focus)="showProductList.set(true)"
                                   placeholder="Search Item Code or Name..."
                                   [readonly]="isEdit()">
                            <i class="fas fa-chevron-down dropdown-arrow" *ngIf="!isEdit()"></i>
                        </div>
                        <ul class="search-results" *ngIf="showProductList() && filteredProducts().length > 0 && !isEdit()">
                            <li *ngFor="let p of filteredProducts()" (click)="selectProduct(p)">{{ p.labour_code }} - {{ p.labour_title }}</li>
                        </ul>
                    </div>
                </div>
                
                <div class="form-group row">
                    <label>Item Name :</label>
                    <input type="text" class="form-control readonly-field" name="itemName" [value]="selectedProductName()" readonly>
                </div>

                <div class="form-group row">
                    <label>Opening Stock</label>
                    <input type="number" class="form-control" name="qty" [ngModel]="qtySignal()" (ngModelChange)="qtySignal.set($event)" placeholder="Opening Stock">
                </div>

                <div class="form-actions-centered">
                    <button type="submit" class="btn-submit">{{ isEdit() ? 'Update' : 'Submit' }}</button>
                    <button type="button" class="btn-cancel" (click)="resetForm()">Cancel</button>
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

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; max-width: 900px; margin: 0 auto; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .menu-icon { font-size: 14px; cursor: pointer; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .btn-list { background-color: #c92127; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 40px 30px; background: #f9f9f9; }
    
    .form-narrow-layout { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    
    .form-group { display: flex; align-items: center; gap: 15px; }
    .form-group label { min-width: 180px; text-align: right; font-size: 14px; color: #333; font-weight: 400; }
    
    .form-control { flex: 1; padding: 8px 12px; font-size: 14px; border: 1px solid #ddd; border-radius: 2px; background: #fff !important; transition: border-color 0.2s; min-height: 36px; width: 100%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.075); }
    .readonly-field { background-color: #eeeeee !important; color: #555; cursor: not-allowed; }
    .form-control:focus { border-color: #1a62bf; outline: none; box-shadow: 0 0 8px rgba(26, 98, 191, 0.2); }

    .form-actions-centered { display: flex; justify-content: center; gap: 15px; margin-top: 20px; padding-left: 80px; }
    
    .btn-submit { background-color: #c92127; color: white; border: none; padding: 10px 35px; font-size: 14px; font-weight: 600; border-radius: 25px; cursor: pointer; min-width: 110px; }
    .btn-cancel { background-color: #f0f0f0; color: #666; border: 1px solid #ddd; padding: 10px 35px; font-size: 14px; font-weight: 400; border-radius: 25px; cursor: pointer; min-width: 110px; }
    
    /* Searchable Dropdown Styles */
    .search-container { position: relative; flex: 1; }
    .search-box-wrapper { position: relative; display: flex; align-items: center; }
    .dropdown-arrow { position: absolute; right: 10px; font-size: 10px; color: #777; pointer-events: none; }
    .search-results { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 4px; margin: 2px 0 0 0; padding: 0; list-style: none; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .search-results li { padding: 8px 12px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f4f4f4; }
    .search-results li:hover { background-color: #f1f1f1; color: #1a62bf; }
    .search-results li:last-child { border-bottom: none; }

    @media (max-width: 768px) { 
      .form-group { flex-direction: column; align-items: flex-start; gap: 5px; } 
      .form-group label { min-width: 100%; text-align: left; }
      .form-actions-centered { padding-left: 0; }
    }
  `]
})
export class AdminStock implements OnInit {
  // State Signals
  branchIdSignal = signal<string>('');
  productIdSignal = signal<string>('');
  qtySignal = signal<number>(0);
  
  isEdit = signal<boolean>(false);
  editId = signal<string | null>(null);

  productsSignal = signal<any[]>([]);
  branchesSignal = signal<any[]>([]);

  branchSearch = signal<string>('');
  showBranchList = signal<boolean>(false);
  
  productSearch = signal<string>('');
  showProductList = signal<boolean>(false);

  // Computed Selectors
  filteredBranches = computed(() => {
    const list = this.branchesSignal();
    const query = this.branchSearch().toLowerCase();
    if (!query) return list;
    return list.filter(b => b.branch_name.toLowerCase().includes(query));
  });

  filteredProducts = computed(() => {
    const list = this.productsSignal();
    const query = this.productSearch().toLowerCase();
    if (!query) return list.slice(0, 100);
    return list.filter(p =>
      p.labour_code.toLowerCase().includes(query) ||
      p.labour_title.toLowerCase().includes(query)
    ).slice(0, 100);
  });

  selectedProductName = computed(() => {
    const products = this.productsSignal();
    const pid = this.productIdSignal();
    const p = products.find(item => item.labour_id == pid);
    return p ? p.labour_title : '';
  });

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
    this.route.queryParams.subscribe(params => {
      if (params['id'] && params['productId']) {
        this.isEdit.set(true);
        this.editId.set(params['id']);
        this.branchIdSignal.set(params['branchId']);
        this.qtySignal.set(Number(params['qty']));
        this.productIdSignal.set(params['productId']);
        this.branchSearch.set(params['branchName']);
        this.productSearch.set(`${params['code']} - ${params['name']}`);
      }
    });
  }

  loadInitialData() {
    this.apiService.listProducts().subscribe({
      next: (res: any) => {
        if (res.success) this.productsSignal.set(res.data || []);
      }
    });

    this.apiService.listBranches().subscribe({
      next: (res: any) => {
        if (res.success) this.branchesSignal.set(res.data || []);
      }
    });
  }

  onBranchSearchInput() {
    if (this.isEdit()) return;
    this.showBranchList.set(true);
    if (!this.branchSearch()) this.branchIdSignal.set('');
  }

  onProductSearchInput() {
    if (this.isEdit()) return;
    this.showProductList.set(true);
    if (!this.productSearch()) this.productIdSignal.set('');
  }

  selectBranch(branch: any) {
    this.branchSearch.set(branch.branch_name);
    this.branchIdSignal.set(branch.b_id);
    this.showBranchList.set(false);
  }

  selectProduct(product: any) {
    this.productSearch.set(`${product.labour_code} - ${product.labour_title}`);
    this.productIdSignal.set(product.labour_id);
    this.showProductList.set(false);
  }

  closeDropdowns() {
    this.showBranchList.set(false);
    this.showProductList.set(false);
  }

  onSubmit() {
    const pid = this.productIdSignal();
    const bid = this.branchIdSignal();
    
    if (!pid || !bid) {
      alert('Please select product and branch');
      return;
    }

    const payload = {
      productId: pid,
      branchId: bid,
      qty: this.qtySignal()
    };

    this.apiService.updateStock(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('Stock Maintenance details has been saved successfully!');
          if (this.isEdit()) {
            this.router.navigate(['/admin-stocklist']);
          } else {
            this.resetForm();
          }
        } else {
          alert('Failed to save stock: ' + res.message);
        }
      },
      error: (err: any) => {
        console.error(err);
        alert('Server error occurred while saving stock details');
      }
    });
  }

  resetForm() {
    this.branchIdSignal.set('');
    this.productIdSignal.set('');
    this.qtySignal.set(0);
    this.branchSearch.set('');
    this.productSearch.set('');
    
    if (this.isEdit()) {
      this.router.navigate(['/admin-stock'], { queryParams: {} });
      this.isEdit.set(false);
      this.editId.set(null);
    }
  }

  viewList() {
    this.router.navigate(['/admin-stocklist']);
  }
}
