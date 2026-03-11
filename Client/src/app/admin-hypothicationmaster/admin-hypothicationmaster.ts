import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-hypothicationmaster',
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
        <span class="active">Hypothication Master</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>Hypothication Master</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" routerLink="/admin-hypothicationmasterlist">List Hypothication Master</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="master-form" (ngSubmit)="onSubmit()">
            <div class="form-narrow-layout">
                
                <div class="form-group row">
                    <label>Finanace Company Name :</label>
                    <input type="text" class="form-control" name="name" [(ngModel)]="financier.name" placeholder="">
                </div>
                
                <div class="form-group row align-start">
                    <label>Address:</label>
                    <textarea class="form-control" name="address" [(ngModel)]="financier.address" placeholder="Address" rows="5"></textarea>
                </div>

                <div class="form-group row">
                    <label>GSTIN:</label>
                    <input type="text" class="form-control" name="gstin" [(ngModel)]="financier.gstin" placeholder="">
                </div>

                <div class="form-actions-centered">
                    <button type="submit" class="btn-submit">Submit</button>
                    <button type="button" class="btn-cancel" (click)="resetForm()">Cancel</button>
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

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; max-width: 800px; margin: 0 auto; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .menu-icon { font-size: 14px; cursor: pointer; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .btn-list { background-color: #c92127; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 40px 30px; background: #f9f9f9; }
    
    .form-narrow-layout { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    
    .form-group { display: flex; align-items: center; gap: 15px; }
    .form-group.align-start { align-items: flex-start; }
    .form-group label { min-width: 180px; text-align: right; font-size: 13px; color: #333; font-weight: 400; }
    
    .form-control { flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid #ddd; border-radius: 2px; background: #fff !important; transition: border-color 0.2s; min-height: 32px; width: 100%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.075); }
    textarea.form-control { height: auto; }
    .form-control:focus { border-color: #1a62bf; outline: none; box-shadow: 0 0 8px rgba(26, 98, 191, 0.2); }
    .form-control::placeholder { color: #aaa; font-style: normal; }

    .form-actions-centered { display: flex; justify-content: center; gap: 15px; margin-top: 20px; padding-left: 90px; }
    
    .btn-submit { background-color: #c92127; color: white; border: none; padding: 8px 30px; font-size: 13px; font-weight: 600; border-radius: 20px; cursor: pointer; min-width: 100px; }
    .btn-cancel { background-color: #f0f0f0; color: #666; border: 1px solid #ddd; padding: 8px 30px; font-size: 13px; font-weight: 400; border-radius: 20px; cursor: pointer; min-width: 100px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    
    @media (max-width: 768px) { 
      .form-group { flex-direction: column; align-items: flex-start; gap: 5px; } 
      .form-group label { min-width: 100%; text-align: left; }
      .form-actions-centered { padding-left: 0; }
    }
  `]
})
export class AdminHypothicationmaster implements OnInit {
  financier = {
    name: '',
    address: '',
    gstin: ''
  };

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {}

  onSubmit() {
    if (!this.financier.name) {
      alert('Finance company name is required');
      return;
    }

    this.apiService.addHypothecationMaster(this.financier).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('Hypothecation Master details has been saved successfully!');
          this.resetForm();
        } else {
          alert('Failed to save hypothecation: ' + res.message);
        }
      },
      error: (err: any) => {
        console.error(err);
        alert('Server error occurred while saving hypothecation details');
      }
    });
  }

  resetForm() {
    this.financier = {
      name: '',
      address: '',
      gstin: ''
    };
  }

  viewList() {
    console.log('Navigate to list');
  }
}
