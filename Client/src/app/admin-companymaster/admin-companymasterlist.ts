import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-companymasterlist',
  standalone: true,
  imports: [CommonModule, AdminNav, AdminFooter, RouterLink, FormsModule],
  template: `
<div class="app-container" (click)="closeDropdowns()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <a routerLink="/admin-companymaster" class="breadcrumb-item">Add Company Master</a>
        <span class="separator"> > </span>
        <span class="active">List Company Master</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Company Master List</h2>
          </div>
          <div class="header-actions">
             <button class="btn-add" (click)="goToAdd()">Add Company Master</button>
          </div>
        </header>

        <div class="page-card-content">
          
          <!-- Filter Bar -->
          <div class="filter-row">
            <div class="search-box">
              <label>Search:</label>
              <input type="text" [(ngModel)]="searchText" (input)="onSearchInput($event)" class="form-control-sm" placeholder="Search...">
            </div>
            <div class="entries-box">
              <label>Show </label>
              <select class="form-control-sm">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span> entries</span>
            </div>
          </div>

          <!-- Added padding bottom and min-height to prevent clipping -->
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Serial No</th>
                  <th>Company Id</th>
                  <th>Company Name</th>
                  <th>Company Address</th>
                  <th>Contact Number</th>
                  <th>Dealership Code</th>
                  <th>C.S.T No</th>
                  <th>L.S.T No</th>
                  <th>Email Id</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let comp of filteredCompanies(); let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ comp.c_reg_no }}</td>
                  <td>{{ comp.c_name }}</td>
                  <td>{{ comp.c_address }}</td>
                  <td>{{ comp.c_contact_no }}</td>
                  <td>{{ comp.c_dealership_code }}</td>
                  <td>{{ comp.cst_no }}</td>
                  <td>{{ comp.lst_no }}</td>
                  <td>{{ comp.c_email }}</td>
                  <td class="action-cell">
                    <div class="action-wrapper" (click)="$event.stopPropagation()">
                      <button class="btn-action" (click)="toggleDropdown(i)">
                        Action <i class="fas fa-caret-down"></i>
                      </button>
                      <div class="action-dropdown" *ngIf="openDropdownIndex === i">
                        <div class="dropdown-item edit" (click)="onEdit(comp)">
                          <i class="fas fa-edit"></i> Edit
                        </div>
                        <div class="dropdown-item delete" (click)="onDelete(comp)">
                          <i class="fas fa-trash"></i> Delete
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredCompanies().length === 0">
                  <td colspan="10" class="no-data">No records found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer Stats area hidden by padding in container above, restored here -->
          <div class="table-footer">
            <div class="stats">Showing 1 to {{ filteredCompanies().length }} of {{ companies().length }} entries</div>
            <div class="pagination">
               <button class="paginate-btn">Previous</button>
               <button class="paginate-btn active">1</button>
               <button class="paginate-btn">Next</button>
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
    .breadcrumb-item { color: #555; text-decoration: none; cursor: pointer; }
    .breadcrumb-bar .active { font-weight: 500; color: #333; }
    .separator { color: #999; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    
    .blue-header-strip { background: #1a62bf; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .blue-header-strip h2 { margin: 0; font-size: 16px; font-weight: 600; text-transform: none; }
    
    .btn-add { background-color: #c92127; color: white; border: none; padding: 8px 15px; font-size: 13px; cursor: pointer; font-weight: 600; border-radius: 4px; }
    
    .page-card-content { padding: 20px; background: #fff; border-top: 5px solid #1a62bf; min-height: 450px; }
    
    .filter-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 14px; }
    .search-box { display: flex; align-items: center; gap: 10px; }
    .search-box input { border: 1px solid #ccc; padding: 5px 10px; border-radius: 2px; outline: none; }
    .entries-box select { border: 1px solid #ccc; padding: 2px 5px; border-radius: 2px; }

    /* Fix: Allow dropdown to overflow the container and add bottom space */
    .table-container { 
      overflow-x: auto; 
      overflow-y: visible; 
      border: 1px solid #eee; 
      margin-bottom: 15px;
      padding-bottom: 80px; /* Crucial: provides space for the action dropdown */
    }

    .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .report-table th { background: #f8f9fa; color: #333; font-weight: 600; padding: 12px 15px; text-align: left; border-right: 1px solid #eee; border-bottom: 2px solid #ddd; }
    .report-table td { padding: 12px 15px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; color: #444; vertical-align: top; }
    .report-table tr:nth-child(even) { background: #fdfdfd; }
    .no-data { text-align: center; padding: 40px !important; font-style: italic; color: #999; }

    /* Action Dropdown */
    .action-cell { position: relative; width: 120px; text-align: center; }
    .action-wrapper { position: relative; display: inline-block; }
    .btn-action { background: #c92127; color: white; border: none; padding: 6px 15px; font-size: 12px; font-weight: 600; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    
    /* Repositioned to ensure it's "outside" the tight button area and clearly visible */
    .action-dropdown { 
      position: absolute; 
      top: 100%; 
      right: 0; 
      background: #fff; 
      border: 1px solid #ddd; 
      border-radius: 4px; 
      min-width: 130px; 
      z-index: 9999; 
      box-shadow: 0 8px 20px rgba(0,0,0,0.2); 
      margin-top: 5px;
    }

    .dropdown-item { padding: 12px 15px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px; text-align: left; color: #333; transition: all 0.2s; }
    .dropdown-item:hover { background: #f8f9fa; transform: translateX(3px); }
    .dropdown-item.edit { color: #0b5ed7; }
    .dropdown-item.delete { color: #c92127; border-top: 1px solid #f0f0f0; }

    .table-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 5px; font-size: 13px; color: #c92127; font-weight: 600; margin-top: -60px; position: relative; z-index: 10; }
    .paginate-btn { background: #fff; border: 1px solid #ddd; padding: 5px 12px; font-size: 13px; cursor: pointer; color: #666; }
    .paginate-btn.active { background: #0b5ed7; color: #fff; border-color: #0b5ed7; }
  `]
})
export class AdminCompanymasterlist implements OnInit {
  companies = signal<any[]>([]);
  searchText = signal('');
  openDropdownIndex: number | null = null;

  filteredCompanies = computed(() => {
    const query = this.searchText().toLowerCase().trim();
    if (!query) return this.companies();
    return this.companies().filter(c => 
      c.c_name?.toLowerCase().includes(query) ||
      c.c_reg_no?.toLowerCase().includes(query) ||
      c.c_address?.toLowerCase().includes(query)
    );
  });

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies() {
    this.apiService.listCompanies().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.companies.set(res.data || []);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onSearchInput(event: any) {
    this.searchText.set(event.target.value);
  }

  toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  closeDropdowns() {
    this.openDropdownIndex = null;
  }

  onEdit(comp: any) {
    this.router.navigate(['/admin-companymaster'], {
      queryParams: {
        id: comp.c_id,
        code: comp.c_reg_no,
        name: comp.c_name,
        address: comp.c_address,
        phone: comp.c_contact_no,
        dealershipCode: comp.c_dealership_code,
        cstNo: comp.cst_no,
        lstNo: comp.lst_no,
        email: comp.c_email
      }
    });
  }

  onDelete(comp: any) {
    if (confirm(`Are you sure you want to delete company "${comp.c_name}"?`)) {
      this.apiService.deleteCompanyMaster(comp.c_id).subscribe({
        next: (res: any) => {
          if (res.success) {
            alert('Company deleted successfully');
            this.loadCompanies();
          } else {
            alert('Failed to delete: ' + res.message);
          }
        },
        error: (err: any) => {
          console.error(err);
          alert('Error deleting company');
        }
      });
    }
  }

  goToAdd() {
    this.router.navigate(['/admin-companymaster']);
  }
}
