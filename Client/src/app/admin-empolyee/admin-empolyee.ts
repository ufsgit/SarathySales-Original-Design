import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminNav } from '../admin-nav/admin-nav';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-empolyee',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav, RouterLink],
  template: `
<div class="app-container" (click)="closeDropdowns()">
  <app-admin-nav></app-admin-nav>

  <main class="page-container">
    <div class="page-content-wrapper">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <a routerLink="/admin-home" class="breadcrumb-item"><i class="fas fa-home"></i> Home</a>
        <span class="separator"> > </span>
        <span class="active">{{ isEdit() ? 'Edit' : 'Add' }} Employee</span>
      </div>

      <!-- Main Card -->
      <div class="theme-card">
        <header class="blue-header-strip">
           <div class="header-left">
             <i class="fas fa-bars menu-icon"></i>
             <h2>{{ isEdit() ? 'Edit' : 'Add' }} Employee</h2>
          </div>
          <div class="header-actions">
             <button class="btn-list" (click)="viewList()">List Employee</button>
          </div>
        </header>

        <div class="page-card-content">
          <form class="employee-form" (ngSubmit)="onSubmit()">
            <div class="form-cols-wrapper">
                
                <!-- Section 1: Basic Information -->
                <div class="form-section">
                    <header class="section-title">Basic Information</header>
                    <div class="section-content">
                        <div class="form-group row">
                            <label>Name :</label>
                            <div class="input-combined">
                                <!-- Prefix Searchable Dropdown -->
                                <div class="search-container prefix-container" (click)="$event.stopPropagation()">
                                    <div class="search-box-wrapper">
                                        <input type="text" 
                                               class="form-control select-prefix" 
                                               [value]="employee.prefix"
                                               name="prefix"
                                               (focus)="showPrefixList = true"
                                               (input)="employee.prefix = $any($event.target).value"
                                               placeholder="Mr.">
                                    </div>
                                    <ul class="search-results" *ngIf="showPrefixList">
                                        <li *ngFor="let p of prefixes" (click)="selectPrefix(p)">{{ p }}</li>
                                    </ul>
                                </div>
                                <input type="text" class="form-control" name="name" [(ngModel)]="employee.name" placeholder="Enter Full Name" required>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label>Institute Name :</label>
                            <!-- Institute Searchable Dropdown -->
                            <div class="search-container" (click)="$event.stopPropagation()">
                                <div class="search-box-wrapper">
                                    <input type="text" 
                                           class="form-control" 
                                           [value]="instituteSearch()"
                                           name="instituteSearch"
                                           (focus)="showInstituteList = true"
                                           (input)="onInstituteInput($any($event.target).value)"
                                           placeholder="Search Institution...">
                                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                                </div>
                                <ul class="search-results" *ngIf="showInstituteList && filteredBranches().length > 0">
                                    <li *ngFor="let b of filteredBranches()" (click)="selectInstitute(b)">{{ b.branch_name }}</li>
                                </ul>
                            </div>
                        </div>
                        <div class="form-group row align-start">
                            <label>Address :</label>
                            <textarea class="form-control" name="address" [(ngModel)]="employee.address" placeholder="Address" rows="5"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Personal Details -->
                <div class="form-section">
                    <header class="section-title">Personal Details</header>
                    <div class="section-content">
                        <div class="form-group row">
                            <label>Mobile No :</label>
                            <input type="text" class="form-control" name="mobile" [(ngModel)]="employee.mobile" placeholder="Mobile Number">
                        </div>
                        <div class="form-group row">
                            <label>Employee Code :</label>
                            <input type="text" class="form-control" name="code" [(ngModel)]="employee.code" placeholder="Employee Code">
                        </div>
                        <div class="form-group row">
                            <label>Employee Designation :</label>
                            <!-- Designation Searchable Dropdown -->
                            <div class="search-container" (click)="$event.stopPropagation()">
                                <div class="search-box-wrapper">
                                    <input type="text" 
                                           class="form-control" 
                                           [value]="designationSearch()"
                                           name="designationSearch"
                                           (focus)="showDesignationList = true"
                                           (input)="onDesignationInput($any($event.target).value)"
                                           placeholder="Search Designation...">
                                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                                </div>
                                <ul class="search-results" *ngIf="showDesignationList && filteredDesignations().length > 0">
                                    <li *ngFor="let d of filteredDesignations()" (click)="selectDesignation(d)">{{ d }}</li>
                                </ul>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label>Email Id :</label>
                            <input type="email" class="form-control" name="email" [(ngModel)]="employee.email" placeholder="Email Address">
                        </div>
                        <div class="form-group row checkbox-group" *ngIf="!isEdit()">
                            <label class="checkbox-container">
                                <input type="checkbox" name="isUser" [(ngModel)]="employee.isUser">
                                <span class="checkmark"></span>
                                Add as User
                            </label>
                        </div>
                        <div class="form-group row" *ngIf="employee.isUser && !isEdit()">
                            <label>Username :</label>
                            <input type="text" class="form-control" name="username" [(ngModel)]="employee.username" placeholder="Username">
                        </div>
                        <div class="form-group row" *ngIf="employee.isUser && !isEdit()">
                            <label>Password :</label>
                            <input type="password" class="form-control" name="password" [(ngModel)]="employee.password" placeholder="Password">
                        </div>
                    </div>
                </div>

            </div>

             <div class="form-footer-buttons">
                <button type="submit" class="btn-submit" [disabled]="!isEdit() && !employee.isUser">
                    {{ isEdit() ? 'Update' : 'Submit' }}
                </button>
                <button type="button" class="btn-cancel" (click)="resetForm()">Cancel</button>
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
    
    .theme-card { background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
    .blue-header-strip { background: #1a62bf; padding: 8px 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .blue-header-strip h2 { margin: 0; font-size: 16px; font-weight: 600; }
    .btn-list { background-color: #c92127; color: white; border: none; padding: 6px 15px; font-size: 13px; cursor: pointer; font-weight: 600; border-radius: 4px; }
    .page-card-content { padding: 40px; background: #fff; }
    .form-cols-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .form-section { border-radius: 6px; border: 1px solid #1a62bf; position: relative; }
    .section-title { background-color: #1a62bf; color: white; padding: 8px 15px; font-size: 15px; font-weight: 600; border-radius: 5px 5px 0 0; }
    .section-content { padding: 25px; display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; align-items: center; gap: 15px; }
    .form-group.align-start { align-items: flex-start; }
    .form-group label { min-width: 140px; text-align: right; font-size: 14px; color: #444; }
    .form-control { flex: 1; padding: 8px 12px; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; background: #fff; }
    .input-combined { display: flex; flex: 1; gap: 5px; }
    .select-prefix { width: 80px; flex: none; }
    .checkbox-group { justify-content: flex-start; padding-left: 155px; }
    .checkbox-container { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #444; user-select: none; }
    .form-footer-buttons { display: flex; justify-content: center; gap: 20px; margin-top: 3rem; }
    .btn-submit { background-color: #c92127; color: white; border: none; padding: 10px 40px; font-size: 15px; font-weight: 600; border-radius: 25px; cursor: pointer; }
    .btn-submit:disabled { background-color: #ccc; cursor: not-allowed; opacity: 0.7; }
    .btn-cancel { background-color: #f0f0f0; color: #333; border: 1px solid #ddd; padding: 10px 40px; font-size: 15px; font-weight: 500; border-radius: 25px; cursor: pointer; }

    /* Searchable Dropdown Styles */
    .search-container { position: relative; flex: 1; }
    .prefix-container { flex: none; }
    .search-box-wrapper { position: relative; display: flex; align-items: center; }
    .dropdown-arrow { position: absolute; right: 10px; font-size: 10px; color: #777; pointer-events: none; }
    .search-results { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 4px; margin: 2px 0 0 0; padding: 0; list-style: none; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .search-results li { padding: 8px 12px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f4f4f4; color: #333; text-align: left; }
    .search-results li:hover { background-color: #f1f1f1; color: #1a62bf; }
    .search-results li:last-child { border-bottom: none; }

    @media (max-width: 992px) { .form-cols-wrapper { grid-template-columns: 1fr; } .checkbox-group { padding-left: 0; justify-content: center; } }
  `]
})
export class AdminEmpolyee implements OnInit {
  isEdit = signal(false);
  editId = signal<string | null>(null);

  employee = {
    prefix: 'Mr.',
    name: '',
    institute: '',
    address: '',
    mobile: '',
    code: '',
    designation: '',
    email: '',
    isUser: false,
    username: '',
    password: ''
  };

  // Static Data
  prefixes: string[] = ['Mr.', 'Ms.', 'Mrs.'];

  // Signals for Data
  branchesSignal = signal<any[]>([]);
  designationsSignal = signal<string[]>([
    'Executive', 'Team Leader', 'Showroom Manager', 'Sales Advisor',
    'Billing Staff', 'Supervisor', 'Manager', 'Service Advisor',
    'Accountant', 'Mechanic', 'Others'
  ]);

  // Search Signals
  instituteSearch = signal<string>('');
  designationSearch = signal<string>('');

  // List Visibility
  showPrefixList: boolean = false;
  showInstituteList: boolean = false;
  showDesignationList: boolean = false;

  // Computed Filters
  filteredBranches = computed(() => {
    const list = this.branchesSignal();
    const query = this.instituteSearch().toLowerCase().trim();
    if (!query) return list;
    return list.filter(b => b.branch_name.toLowerCase().includes(query));
  });

  filteredDesignations = computed(() => {
    const list = this.designationsSignal();
    const query = this.designationSearch().toLowerCase().trim();
    if (!query) return list;
    return list.filter(d => d.toLowerCase().includes(query));
  });

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadBranches();
    this.loadDesignations();

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEdit.set(true);
        this.editId.set(params['id']);
        this.employee.prefix = params['prefix'] || 'Mr.';
        this.employee.name = params['name'] || '';
        this.employee.institute = params['institute'] || '';
        this.employee.address = params['address'] || '';
        this.employee.mobile = params['mobile'] || '';
        this.employee.code = params['code'] || '';
        this.employee.designation = params['designation'] || '';
        this.employee.email = params['email'] || '';
        this.instituteSearch.set(this.employee.institute);
        this.designationSearch.set(this.employee.designation);
      }
    });
  }

  loadBranches() {
    this.apiService.getBranches().subscribe({
      next: (res: any) => {
        if (res.success) this.branchesSignal.set(res.data || []);
      },
      error: (err: any) => console.error('Error loading branches', err)
    });
  }

  loadDesignations() {
    const defaultList = [
      'Executive', 'Team Leader', 'Showroom Manager', 'Sales Advisor',
      'Billing Staff', 'Supervisor', 'Manager', 'Service Advisor',
      'Accountant', 'Mechanic', 'Others'
    ];

    this.apiService.listDesignations().subscribe({
      next: (res: any) => {
        if (res.success && res.data.length > 0) {
          const merged = Array.from(new Set([...defaultList, ...res.data]));
          this.designationsSignal.set(merged);
        }
      },
      error: () => { }
    });
  }

  onInstituteInput(value: string) {
    this.instituteSearch.set(value);
    this.showInstituteList = true;
    if (!value) this.employee.institute = '';
  }

  onDesignationInput(value: string) {
    this.designationSearch.set(value);
    this.showDesignationList = true;
    if (!value) this.employee.designation = '';
  }

  selectPrefix(p: string) {
    this.employee.prefix = p;
    this.showPrefixList = false;
  }

  selectInstitute(b: any) {
    this.instituteSearch.set(b.branch_name);
    this.employee.institute = b.branch_name;
    this.showInstituteList = false;
  }

  selectDesignation(d: string) {
    this.designationSearch.set(d);
    this.employee.designation = d;
    this.showDesignationList = false;
  }

  closeDropdowns() {
    this.showPrefixList = false;
    this.showInstituteList = false;
    this.showDesignationList = false;
  }

  onSubmit() {
    if (!this.employee.name) {
      alert('Please enter employee name');
      return;
    }
    if (!this.isEdit() && !this.employee.isUser) {
      alert('Please click on the Add as User checkbox to submit');
      return;
    }

    if (this.employee.isUser && (!this.employee.username || !this.employee.password)) {
      alert('Please enter username and password');
      return;
    }

    const payload = {
      prefix: this.employee.prefix,
      name: this.employee.name,
      institute: this.employee.institute,
      address: this.employee.address,
      mobile: this.employee.mobile,
      code: this.employee.code,
      designation: this.employee.designation,
      email: this.employee.email,
      isUser: this.employee.isUser,
      username: this.employee.username,
      password: this.employee.password
    };

    if (this.isEdit()) {
      this.apiService.updateEmployee(this.editId()!, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            alert('Employee details has been updated successfully!');
            this.viewList();
          } else {
            alert('Failed to update employee: ' + res.message);
          }
        },
        error: (err: any) => {
          console.error('Error updating employee', err);
          alert('Server error occurred while updating employee details');
        }
      });
    } else {
      this.apiService.addEmployee(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            alert('Employee details has been saved successfully!');
            this.resetForm();
          } else {
            alert('Failed to save employee: ' + res.message);
          }
        },
        error: (err: any) => {
          console.error('Error adding employee', err);
          alert('Server error occurred while saving employee details');
        }
      });
    }
  }

  resetForm() {
    this.employee = {
      prefix: 'Mr.',
      name: '',
      institute: '',
      address: '',
      mobile: '',
      code: '',
      designation: '',
      email: '',
      isUser: false,
      username: '',
      password: ''
    };
    this.instituteSearch.set('');
    this.designationSearch.set('');
    this.isEdit.set(false);
    this.editId.set(null);
  }

  viewList() {
    this.router.navigate(['/admin-empolyeelist']);
  }
}
