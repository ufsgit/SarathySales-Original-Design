import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-colorlist',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, AdminFooter, RouterLink],
  template: `
<div class="app-container" (click)="closeDropdown()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <span>Master Operations</span>
        <span class="separator"> > </span>
        <span class="active">List Color Types</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-th menu-icon"></i>
             <h2>Color Types List</h2>
          </div>
          <div class="header-actions">
             <button class="btn-add" routerLink="/admin-color">Add Color Types</button>
          </div>
        </header>

        <div class="page-card-content">
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>SI No</th>
                  <th>Color Code</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="colors().length === 0">
                  <td colspan="4" class="no-data">No color data found</td>
                </tr>
                <tr *ngFor="let c of colors(); let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ c.color_code }}</td>
                  <td>{{ c.description }}</td>
                  <td class="action-cell">
                    <div class="action-wrapper" (click)="$event.stopPropagation()">
                       <button class="btn-action" (click)="toggleDropdown(i)">
                         Action <i class="fas fa-caret-down"></i>
                       </button>
                       <div class="action-dropdown" *ngIf="openDropdownIndex === i">
                          <div class="dropdown-item" (click)="onEdit(c)">
                            <i class="fas fa-edit"></i> Edit
                          </div>
                          <div class="dropdown-item delete" (click)="onDelete(c)">
                            <i class="fas fa-trash"></i> Delete
                          </div>
                       </div>
                    </div>
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
  <app-admin-footer></app-admin-footer>
</div>
  `,
  styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 5px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    
    .breadcrumb-bar { font-size: 13px; color: #555; padding: 15px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-item { color: #555; text-decoration: none; display: flex; align-items: center; gap: 5px; }
    .breadcrumb-bar .active { color: #333; font-weight: 500; }
    .separator { color: #999; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; margin-top: 10px; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .menu-icon { font-size: 14px; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .header-actions { display: flex; gap: 5px; }
    .btn-add { background-color: #c92127; color: white; border: none; padding: 6px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 0; background: #fff; }
    
    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .report-table th { background: #f1f1f1; padding: 10px; text-align: left; border: 1px solid #ddd; color: #333; font-weight: 600; }
    .report-table td { padding: 10px; border: 1px solid #ddd; color: #555; vertical-align: middle; }
    .report-table tr:nth-child(even) { background: #fafafa; }
    .no-data { text-align: center; padding: 30px !important; color: #888; font-style: italic; }

    /* Action Button Styles */
    .action-cell { width: 100px; text-align: center; }
    .action-wrapper { position: relative; display: inline-block; }
    .btn-action { background-color: #c92127; color: white; border: none; padding: 4px 12px; font-size: 11px; font-weight: 500; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
    .action-dropdown { position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 3px; min-width: 120px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .dropdown-item { padding: 8px 12px; text-align: left; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 8px; color: #333; }
    .dropdown-item:hover { background-color: #f5f5f5; }
    .dropdown-item i { width: 14px; text-align: center; }
    .dropdown-item.delete { color: #d9534f; border-top: 1px solid #eee; }

    @media (max-width: 768px) {
       .report-table { min-width: 600px; }
    }
  `]
})
export class AdminColorlist implements OnInit {
  colors = signal<any[]>([]);
  openDropdownIndex: number | null = null;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadColors();
  }

  loadColors() {
    this.apiService.listColors().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.colors.set(res.data || []);
        }
      },
      error: (err: any) => console.error('Error loading colors', err)
    });
  }

  toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  closeDropdown() {
    this.openDropdownIndex = null;
  }

  onEdit(color: any) {
    this.router.navigate(['/admin-color'], { 
      queryParams: { 
        id: color.id, 
        code: color.color_code, 
        desc: color.description 
      } 
    });
  }

  onDelete(color: any) {
    if (confirm('Are you sure you want to delete this color type?')) {
       this.apiService.deleteColorMaster(color.id).subscribe({
         next: (res: any) => {
           if (res.success) {
             alert('Color Master deleted successfully!');
             this.loadColors();
           } else {
             alert('Failed to delete: ' + res.message);
           }
         },
         error: (err) => alert('Error deleting color master')
       });
    }
  }
}
