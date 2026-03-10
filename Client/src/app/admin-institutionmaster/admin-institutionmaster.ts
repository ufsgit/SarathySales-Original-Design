import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { AdminFooter } from '../admin-footer/admin-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-institutionmaster',
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
        <span class="active">{{ isEdit() ? 'Edit' : 'Add' }} Institution Master</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>{{ isEdit() ? 'Edit' : 'Add' }} Institution Master</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="viewList()">List Institution Master</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="master-form" (ngSubmit)="onSubmit()">
            <div class="form-center-layout">
                <div class="form-group row">
                    <label>Institution Code :</label>
                    <input type="text" class="form-control" name="code" [(ngModel)]="code" placeholder="Institution Code" [disabled]="isEdit()">
                </div>
                <div class="form-group row">
                    <label>Institution Name:</label>
                    <input type="text" class="form-control" name="name" [(ngModel)]="name" placeholder="Institution Name" required>
                </div>
                <div class="form-group row align-start">
                    <label>Address :</label>
                    <textarea class="form-control" name="address" [(ngModel)]="address" placeholder="Address" rows="4"></textarea>
                </div>
                <div class="form-group row">
                    <label>Location</label>
                    <input type="text" class="form-control" name="location" [(ngModel)]="location" placeholder="Location">
                </div>
                <div class="form-group row">
                    <label>Pin Code</label>
                    <input type="text" class="form-control" name="pinCode" [(ngModel)]="pinCode" placeholder="Pin Code">
                </div>
                
                <div class="form-spacer"></div>

                <div class="form-group row">
                    <label>GSTIN Number</label>
                    <input type="text" class="form-control" name="gstin" [(ngModel)]="gstin" placeholder="GSTIN">
                </div>
                <div class="form-group row">
                    <label>Phone Number :</label>
                    <input type="text" class="form-control" name="phone" [(ngModel)]="phone" placeholder="Contact Number">
                </div>
                <div class="form-group row">
                    <label>Email Id :</label>
                    <input type="email" class="form-control" name="email" [(ngModel)]="email" placeholder="Email-Id">
                </div>

                <div class="form-actions">
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

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; max-width: 1000px; margin: 0 auto; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .menu-icon { font-size: 14px; cursor: pointer; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .btn-list { background-color: #c92127; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 40px; background: #f9f9f9; }
    
    .form-center-layout { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px; }
    
    .form-group { display: flex; align-items: center; gap: 20px; }
    .form-group.align-start { align-items: flex-start; }
    .form-group label { min-width: 160px; text-align: right; font-size: 13px; color: #333; font-weight: 400; }
    
    .form-control { flex: 1; padding: 8px 12px; font-size: 13px; border: 1px solid #ddd; border-radius: 2px; background: #fff !important; transition: border-color 0.2s; min-height: 34px; width: 100%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.075); }
    .form-control:disabled { background: #eee !important; color: #777; cursor: not-allowed; }
    textarea.form-control { height: auto; }
    .form-control:focus { border-color: #1a62bf; outline: none; box-shadow: 0 0 8px rgba(26, 98, 191, 0.2); }
    .form-control::placeholder { color: #aaa; font-style: normal; }

    .form-spacer { height: 20px; }

    .form-actions { display: flex; justify-content: center; gap: 15px; margin-top: 30px; }
    
    .btn-submit { background-color: #c92127; color: white; border: none; padding: 8px 40px; font-size: 14px; font-weight: 600; border-radius: 20px; cursor: pointer; min-width: 120px; }
    .btn-cancel { background-color: #fff; color: #666; border: 1px solid #ddd; padding: 8px 40px; font-size: 14px; font-weight: 400; border-radius: 20px; cursor: pointer; min-width: 120px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    
    @media (max-width: 768px) { 
      .form-group { flex-direction: column; align-items: flex-start; gap: 5px; } 
      .form-group label { min-width: 100%; text-align: left; }
    }
  `]
})
export class AdminInstitutionmaster implements OnInit {
  isEdit = signal(false);
  editId = signal<string | null>(null);

  // Form Fields as properties (template uses ngModel)
  code = '';
  name = '';
  address = '';
  location = '';
  pinCode = '';
  gstin = '';
  phone = '';
  email = '';

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
        if (params['id']) {
            this.isEdit.set(true);
            this.editId.set(params['id']);
            this.code = params['id'];
            this.name = params['name'] || '';
            this.address = params['address'] || '';
            this.location = params['location'] || '';
            this.pinCode = params['pin'] || '';
            this.gstin = params['gstin'] || '';
            this.phone = params['phone'] || '';
            this.email = params['email'] || '';
        }
    });
  }

  onSubmit() {
    if (!this.name) {
      alert('Institution name is required');
      return;
    }

    const payload = {
        code: this.code,
        name: this.name,
        address: this.address,
        location: this.location,
        pinCode: this.pinCode,
        gstin: this.gstin,
        phone: this.phone,
        email: this.email
    };

    if (this.isEdit()) {
        this.apiService.updateInstitutionMaster(this.editId()!, payload).subscribe({
            next: (res: any) => {
                if (res.success) {
                    alert('Institution Master details has been updated successfully!');
                    this.viewList();
                } else {
                    alert('Failed to update institution: ' + res.message);
                }
            },
            error: (err: any) => {
                console.error(err);
                alert('Server error occurred while updating institution details');
            }
        });
    } else {
        this.apiService.addInstitutionMaster(payload).subscribe({
            next: (res: any) => {
                if (res.success) {
                    alert('Institution Master details has been saved successfully!');
                    this.resetForm();
                } else {
                    alert('Failed to save institution: ' + res.message);
                }
            },
            error: (err: any) => {
                console.error(err);
                alert('Server error occurred while saving institution details');
            }
        });
    }
  }

  resetForm() {
    this.code = '';
    this.name = '';
    this.address = '';
    this.location = '';
    this.pinCode = '';
    this.gstin = '';
    this.phone = '';
    this.email = '';
    this.isEdit.set(false);
    this.editId.set(null);
  }

  viewList() {
    this.router.navigate(['/admin-institutionmasterlist']);
  }
}
