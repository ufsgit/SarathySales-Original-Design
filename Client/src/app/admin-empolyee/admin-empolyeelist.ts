import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-empolyeelist',
  standalone: true,
  imports: [CommonModule, AdminNav, AdminFooter, RouterLink],
  template: `
<div class="app-container" (click)="closeAllDropdowns()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <span class="active">List Employee</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>List Employee</h2>
          </div>
          <div class="header-actions">
             <button class="btn-add" (click)="goToAdd()">Add Employee</button>
          </div>
        </header>

        <div class="page-card-content">
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>SI No</th>
                  <th>Emp Code</th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Institute</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let emp of employees(); let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ emp.e_code }}</td>
                  <td>{{ emp.emp_intial }} {{ emp.e_first_name }}</td>
                  <td>{{ emp.e_designation }}</td>
                  <td>{{ emp.e_branch }}</td>
                  <td>{{ emp.e_mobile }}</td>
                  <td>
                    <span class="status-badge" [ngClass]="emp.status?.toLowerCase() === 'active' ? 'active' : 'inactive'">
                      {{ emp.status || 'Active' }}
                    </span>
                  </td>
                  <td class="action-cell">
                    <div class="action-wrapper" (click)="$event.stopPropagation()">
                      <button class="btn-action" (click)="toggleDropdown(i)">
                        Action <i class="fas fa-caret-down"></i>
                      </button>
                      <div class="action-dropdown" *ngIf="openDropdownIndex === i">
                        <div class="dropdown-item edit" (click)="onEdit(emp)">
                          <i class="fas fa-edit"></i> Edit
                        </div>
                        <div class="dropdown-item delete" (click)="onDelete(emp)">
                          <i class="fas fa-trash"></i> Delete
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="employees().length === 0">
                  <td colspan="8" class="no-data">No employees found</td>
                </tr>
              </tbody>
            </table>
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

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
    
    .blue-header-strip { background: #0b5ed7; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .blue-header-strip h2 { margin: 0; font-size: 16px; font-weight: 600; text-transform: none; }
    
    .btn-add { background-color: #c92127; color: white; border: none; padding: 8px 15px; font-size: 13px; cursor: pointer; font-weight: 600; border-radius: 0; }
    
    .page-card-content { padding: 0; background: #fff; }
    
    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .report-table th { background: #f1f1f1; color: #333; font-weight: 600; padding: 10px; text-align: left; border: 1px solid #ddd; white-space: nowrap; }
    .report-table td { padding: 8px 10px; border: 1px solid #ddd; color: #444; vertical-align: middle; }
    .report-table tr:nth-child(even) { background: #fafafa; }
    .no-data { text-align: center; padding: 40px !important; font-style: italic; color: #999; }

    .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .status-badge.active { background-color: #e6ffed; color: #28a745; }
    .status-badge.inactive { background-color: #fff1f0; color: #cf1322; }

    /* Action Dropdown */
    .action-cell { position: relative; }
    .action-wrapper { position: relative; display: inline-block; }
    .btn-action { background: #c92127; color: white; border: none; padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    .action-dropdown { position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 4px; min-width: 130px; z-index: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .dropdown-item { padding: 10px 16px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; text-align: left; }
    .dropdown-item:hover { background: #f5f5f5; }
    .dropdown-item.edit { color: #0b5ed7; }
    .dropdown-item.delete { color: #c92127; border-top: 1px solid #f0f0f0; }

    .text-center { text-align: center; }
  `]
})
export class AdminEmpolyeelist implements OnInit {
  employees = signal<any[]>([]);
  openDropdownIndex: number | null = null;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees() {
    this.apiService.listEmployees().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.employees.set(res.data || []);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  closeAllDropdowns() {
    this.openDropdownIndex = null;
  }

  onEdit(emp: any) {
    this.router.navigate(['/admin-empolyee'], {
        queryParams: {
            id: emp.emp_id,
            prefix: emp.emp_intial,
            name: emp.e_first_name,
            institute: emp.e_branch,
            address: emp.e_address,
            mobile: emp.e_mobile,
            code: emp.e_code,
            designation: emp.e_designation,
            email: emp.e_email
        }
    });
  }

  onDelete(emp: any) {
    if (confirm(`Are you sure you want to delete employee "${emp.e_first_name}"?`)) {
        this.apiService.deleteEmployee(emp.emp_id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    alert('Employee deleted successfully');
                    this.loadEmployees();
                } else {
                    alert('Failed to delete: ' + res.message);
                }
            },
            error: (err: any) => {
                console.error(err);
                alert('Error deleting employee');
            }
        });
    }
  }

  goToAdd() {
    this.router.navigate(['/admin-empolyee']);
  }
}
