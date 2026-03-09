import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-companymaster',
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
        <span class="active">Company Master Maintenace</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Add Company Master</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="viewList()">List Company Master</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="master-form" (ngSubmit)="onSubmit()">
            <div class="form-grid-layout">
                
                <!-- Left Column -->
                <div class="form-column">
                    <div class="form-group row">
                        <label>Company Code :</label>
                        <input type="text" class="form-control" name="code" [(ngModel)]="company.code" placeholder="Company Code">
                    </div>
                    <div class="form-group row">
                        <label>Company Name :</label>
                        <input type="text" class="form-control" name="name" [(ngModel)]="company.name" placeholder="Company Name" required>
                    </div>
                    <div class="form-group row align-start">
                        <label>Company Address :</label>
                        <textarea class="form-control" name="address" [(ngModel)]="company.address" placeholder="Your address" rows="4"></textarea>
                    </div>
                    <div class="form-group row">
                        <label>Phone Number :</label>
                        <input type="text" class="form-control" name="phone" [(ngModel)]="company.phone" placeholder="contact no">
                    </div>
                </div>

                <!-- Right Column -->
                <div class="form-column">
                    <div class="form-group row">
                        <label>Dealership Code :</label>
                        <input type="text" class="form-control" name="dealershipCode" [(ngModel)]="company.dealershipCode" placeholder="Dealership Code">
                    </div>
                    <div class="form-group row">
                        <label>C.S.T No :</label>
                        <input type="text" class="form-control" name="cstNo" [(ngModel)]="company.cstNo" placeholder="C.S.T No">
                    </div>
                    <div class="form-group row">
                        <label>L.S.T No :</label>
                        <input type="text" class="form-control" name="lstNo" [(ngModel)]="company.lstNo" placeholder="L.S.T No">
                    </div>
                    <div class="form-group row">
                        <label>Email Id :</label>
                        <input type="email" class="form-control" name="email" [(ngModel)]="company.email" placeholder="Email-Id">
                    </div>
                    
                    <!-- Buttons inside right column but pushed down -->
                    <div class="form-actions-inline">
                        <button type="submit" class="btn-submit">Submit</button>
                        <button type="button" class="btn-cancel" (click)="resetForm()">Cancel</button>
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
    
    .btn-list { background-color: #c92127; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 40px 30px; background: #e8eaeb; }
    
    .form-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; max-width: 1200px; }
    
    .form-column { display: flex; flex-direction: column; gap: 15px; }
    
    .form-group { display: flex; align-items: center; gap: 10px; }
    .form-group.align-start { align-items: flex-start; }
    .form-group label { min-width: 130px; text-align: right; font-size: 13px; color: #333; font-weight: 400; }
    
    .form-control { flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid #ddd; border-radius: 2px; background: #fff !important; transition: border-color 0.2s; height: 32px; width: 100%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.075); }
    textarea.form-control { height: auto; }
    .form-control:focus { border-color: #1a62bf; outline: none; box-shadow: 0 0 8px rgba(26, 98, 191, 0.2); }
    .form-control::placeholder { color: #aaa; font-style: normal; }

    .form-actions-inline { display: flex; justify-content: center; gap: 15px; margin-top: 30px; }
    
    .btn-submit { background-color: #c92127; color: white; border: none; padding: 8px 30px; font-size: 13px; font-weight: 600; border-radius: 20px; cursor: pointer; min-width: 100px; }
    .btn-cancel { background-color: #f0f0f0; color: #666; border: 1px solid #ddd; padding: 8px 30px; font-size: 13px; font-weight: 400; border-radius: 20px; cursor: pointer; min-width: 100px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    
    @media (max-width: 992px) { 
      .form-grid-layout { grid-template-columns: 1fr; gap: 20px; } 
      .form-group label { min-width: 110px; text-align: left; }
    }
  `]
})
export class AdminCompanymaster implements OnInit {
  company = {
    code: '',
    name: '',
    address: '',
    phone: '',
    dealershipCode: '',
    cstNo: '',
    lstNo: '',
    email: ''
  };

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {}

  onSubmit() {
    if (!this.company.name) {
      alert('Company name is required');
      return;
    }

    this.apiService.addCompanyMaster(this.company).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('Company Master details has been saved successfully!');
          this.resetForm();
        } else {
          alert('Failed to save company: ' + res.message);
        }
      },
      error: (err: any) => {
        console.error(err);
        alert('Server error occurred while saving company details');
      }
    });
  }

  resetForm() {
    this.company = {
      code: '',
      name: '',
      address: '',
      phone: '',
      dealershipCode: '',
      cstNo: '',
      lstNo: '',
      email: ''
    };
  }

  viewList() {
    // Navigate to company list if available
    // this.router.navigate(['/admin-company-list']);
    console.log('Navigate to list');
  }
}
