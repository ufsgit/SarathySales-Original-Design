import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-color',
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
        <span>Add Color Master</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>{{ isEdit() ? 'Edit Color Master' : 'Add Color Master' }}</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="viewList()">List Color Master</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="master-form" (ngSubmit)="onSubmit()">
            <div class="form-narrow-layout">
                
                <div class="form-group row">
                    <label>Color Code :</label>
                    <input type="text" class="form-control" name="code" [ngModel]="codeSignal()" (ngModelChange)="codeSignal.set($event)" placeholder="Color Code">
                </div>

                <div class="form-group row">
                    <label>Description :</label>
                    <input type="text" class="form-control" name="description" [ngModel]="descSignal()" (ngModelChange)="descSignal.set($event)" placeholder="Description">
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
</div>
  `,
  styles: [`
    .app-container { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; min-height: 100vh; display: flex; flex-direction: column; }
    .page-container { padding: 5px 0 0 0; }
    .page-content-wrapper { width: 100%; padding: 0 15px; }
    
    .breadcrumb-bar { font-size: 13px; color: #555; padding: 15px 0; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-item { color: #555; text-decoration: none; display: flex; align-items: center; gap: 5px; }
    .separator { color: #999; }

    .theme-card { background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; max-width: 900px; margin: 0 auto; margin-top: 20px; }
    
    .blue-header-strip { background: #1a62bf; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .menu-icon { font-size: 14px; cursor: pointer; color: #fff; }
    .blue-header-strip h2 { margin: 0; font-size: 15px; font-weight: 600; text-transform: none; }
    
    .btn-list { background-color: #c92127; color: white; border: none; padding: 5px 15px; font-size: 12px; cursor: pointer; font-weight: 600; border-radius: 3px; }
    
    .page-card-content { padding: 40px 30px; background: #fff; }
    
    .form-narrow-layout { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    
    .form-group { display: flex; align-items: center; gap: 15px; }
    .form-group label { min-width: 120px; text-align: right; font-size: 14px; color: #333; }
    
    .form-control { flex: 1; padding: 8px 12px; font-size: 14px; border: 1px solid #ddd; border-radius: 3px; background: #fff !important; transition: border-color 0.2s; }
    .form-control:focus { border-color: #1a62bf; outline: none; }

    .form-actions-centered { display: flex; justify-content: center; gap: 15px; margin-top: 20px; }
    
    .btn-submit { background-color: #c92127; color: white; border: none; padding: 8px 30px; font-size: 14px; font-weight: 600; border-radius: 20px; cursor: pointer; min-width: 100px; }
    .btn-cancel { background-color: #eee; color: #333; border: none; padding: 8px 30px; font-size: 14px; font-weight: 400; border-radius: 20px; cursor: pointer; min-width: 100px; }
  `]
})
export class AdminColor implements OnInit {
  codeSignal = signal<string>('');
  descSignal = signal<string>('');
  
  isEdit = signal<boolean>(false);
  editId = signal<string | null>(null);

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id'] && params['code']) {
        this.isEdit.set(true);
        this.editId.set(params['id']);
        this.codeSignal.set(params['code']);
        this.descSignal.set(params['desc'] || '');
      }
    });
  }

  onSubmit() {
    const code = this.codeSignal();
    const desc = this.descSignal();
    
    if (!code) {
      alert('Color code is required');
      return;
    }

    const payload = {
      code: code,
      description: desc
    };

    const id = this.editId();
    if (this.isEdit() && id) {
        this.apiService.updateColorMaster(id, payload).subscribe({
            next: (res: any) => {
              if (res.success) {
                alert('Color Master details has been updated successfully!');
                this.router.navigate(['/admin-colorlist']);
              } else {
                alert('Failed to update color: ' + res.message);
              }
            },
            error: (err: any) => {
              console.error(err);
              alert('Server error occurred while updating color details');
            }
        });
    } else {
        this.apiService.addColorMaster(payload).subscribe({
          next: (res: any) => {
            if (res.success) {
              alert('Color Master details has been saved successfully!');
              this.resetForm();
            } else {
              alert('Failed to save color: ' + res.message);
            }
          },
          error: (err: any) => {
            console.error(err);
            alert('Server error occurred while saving color details');
          }
        });
    }
  }

  resetForm() {
    this.codeSignal.set('');
    this.descSignal.set('');
    
    if (this.isEdit()) {
        this.router.navigate(['/admin-color'], { queryParams: {} });
        this.isEdit.set(false);
        this.editId.set(null);
    }
  }

  viewList() {
    this.router.navigate(['/admin-colorlist']);
  }
}
