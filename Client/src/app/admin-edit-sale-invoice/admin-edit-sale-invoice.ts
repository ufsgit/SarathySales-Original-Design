import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-edit-sale-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNav, UserFooter],
  templateUrl: './admin-edit-sale-invoice.html',
  styleUrl: './admin-edit-sale-invoice.css'
})
export class AdminEditSaleInvoiceComponent implements OnInit {

  invoiceId = signal<number | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  // Form Fields
  branchName = signal('');
  branchId = signal<number | null>(null);
  invoiceNo = signal('');
  invoiceDate = signal('');
  issueType = signal('');
  customerName = signal('');
  guardian = signal('');
  address = signal('');
  pincode = signal('');
  gstin = signal('');
  mobileNo = signal('');
  age = signal('');
  cdmsNo = signal('');
  area = signal('');
  hypothication = signal('');
  place = signal('');
  receiptNo = signal('');
  registration = signal('');
  financeDues = signal('');
  executiveName = signal('');
  
  chassisNo = signal('');
  engineNo = signal('');
  vehicle = signal('');
  color = signal('');
  pCode = signal('');
  hsnCode = signal('');
  
  basicAmount = signal(0);
  discountAmount = signal(0);
  taxableAmount = signal(0);
  sgst = signal(0);
  cgst = signal(0);
  cess = signal(0);
  totalAmount = signal(0);

  isAdmin = signal(false);
  originalData: any = null;

  // Hypothecation Dropdown State
  hypothecationOptions = signal<any[]>([]);
  hypothecationSearchTerm = signal('');
  isHypothecationDropdownOpen = signal(false);

  searchableHypothecationList = computed(() => {
    const term = this.hypothecationSearchTerm().toLowerCase();
    const list = this.hypothecationOptions();
    if (!term) return list;
    return list.filter(opt => (opt.icompany_name || '').toLowerCase().includes(term));
  });

  // Executive Dropdown State
  executiveOptions = signal<Array<{ value: string; label: string }>>([]);
  executiveSearchTerm = signal('');
  isExecutiveDropdownOpen = signal(false);

  searchableExecutiveList = computed(() => {
    const term = this.executiveSearchTerm().toLowerCase();
    return this.executiveOptions().filter(ex =>
      (ex.label || '').toLowerCase().includes(term)
    );
  });

  // Branch Dropdown State (for Customer selection in Issue Type 02)
  branchOptions = signal<any[]>([]);
  branchSearchTerm = signal('');
  isBranchDropdownOpen = signal(false);
  customerBranchId = signal<string>('');

  searchableBranchOptionsList = computed(() => {
    const term = this.branchSearchTerm().toLowerCase();
    return this.branchOptions().filter(b =>
      (b.branch_name || '').toLowerCase().includes(term)
    );
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {
    const user = this.api.getCurrentUser();
    this.isAdmin.set(user?.role == 1 || user?.role_des === 'admin');
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.invoiceId.set(Number(id));
        this.loadInvoice(Number(id));
        this.loadHypothecationOptions();
        this.loadBranches();
      }
    });
  }

  loadBranches() {
    this.api.getBranches().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.branchOptions.set(res.data);
          // If we already loaded the invoice and it's issue type 02, try to find the branch
          if (this.issueType() === '02' && this.customerName()) {
            this.syncCustomerBranchId();
          }
        }
      }
    });
  }

  syncCustomerBranchId() {
    const name = this.customerName().trim().toLowerCase();
    const found = this.branchOptions().find(b => (b.branch_name || '').toLowerCase().trim() === name);
    if (found) {
      this.customerBranchId.set(found.b_id.toString());
    }
  }

  loadHypothecationOptions() {
    this.api.getSalesInvoiceHypothecationOptions().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.hypothecationOptions.set(res.data);
        }
      }
    });
  }

  loadInvoice(id: number) {
    this.isLoading.set(true);
    this.api.getSalesInvoice(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const d = res.data;
          this.branchId.set(d.inv_branch);
          this.branchName.set(d.branch_name || '');
          this.invoiceNo.set(d.inv_no || '');
          this.invoiceDate.set(this.formatDateForInput(d.inv_inv_date));
          this.issueType.set(d.inv_type || '');
          this.customerName.set(d.inv_cus || '');
          this.guardian.set(d.inv_cus_father_hus || '');
          this.address.set(d.inv_cus_addres || '');
          this.pincode.set(d.inv_pincode || '');
          this.gstin.set(d.inv_gstin || '');
          this.mobileNo.set(d.inv_pho || '');
          this.age.set(d.inv_age || '');
          this.cdmsNo.set(d.inv_cdms_no || '');
          this.area.set(d.inv_area || '');
          this.hypothication.set(d.inv_hypothication || '');
          this.place.set(d.inv_place || '');
          this.receiptNo.set(d.inv_receipt_no || '');
          this.registration.set(d.inv_regn || '');
          this.financeDues.set(d.inv_finance_dues || '');
          this.executiveName.set(d.inv_advisername || '');
          this.loadExecutives(d.branch_name || '');

          // Store original data for field restoration
          this.originalData = {
            customerName: d.inv_cus || '',
            address: d.inv_cus_addres || '',
            mobileNo: d.inv_pho || '',
            pincode: d.inv_pincode || '',
            gstin: d.inv_gstin || '',
            place: d.inv_place || '',
            guardian: d.inv_cus_father_hus || '',
            issueType: d.inv_type || ''
          };

          if (this.issueType() === '02' && this.customerName()) {
            this.syncCustomerBranchId();
          }
          
          this.chassisNo.set(d.inv_chassis || '');
          this.engineNo.set(d.in_engine || '');
          this.vehicle.set(d.inv_vehicle || '');
          this.color.set(d.inv_color || '');
          this.pCode.set(d.inv_vehicle_code || '');
          this.hsnCode.set(d.inv_hsncode || '');
          
          this.basicAmount.set(Number(d.inv_basic_amt) || 0);
          this.discountAmount.set(Number(d.inv_discount_amt) || 0);
          this.taxableAmount.set(Number(d.inv_taxable_amt) || 0);
          this.sgst.set(Number(d.inv_sgst) || 0);
          this.cgst.set(Number(d.inv_cgst) || 0);
          this.cess.set(Number(d.inv_cess) || 0);
          this.totalAmount.set(Number(d.inv_total) || 0);
        } else {
          this.errorMsg.set(res.message || 'Failed to load invoice');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set('Server error occurred');
      }
    });
  }

  formatDateForInput(d: any): string {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().split('T')[0];
  }

  recalculateTotalAmount() {
    const basic = Number(this.basicAmount()) || 0;
    const disc = Number(this.discountAmount()) || 0;
    const taxable = basic - disc;
    this.taxableAmount.set(taxable);
    
    // Assuming 9% SGST and 9% CGST based on patterns seen in other files
    const sgstVal = parseFloat((taxable * 0.09).toFixed(2));
    const cgstVal = parseFloat((taxable * 0.09).toFixed(2));
    this.sgst.set(sgstVal);
    this.cgst.set(cgstVal);
    
    const total = taxable + sgstVal + cgstVal + Number(this.cess());
    this.totalAmount.set(parseFloat(total.toFixed(2)));
  }

  onSave() {
    if (!this.invoiceId()) return;
    
    this.isSaving.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const payload = {
      invoiceNo: this.invoiceNo(),
      branchId: this.branchId(),
      invoiceDate: this.invoiceDate(),
      customerName: this.customerName(),
      chassisNo: this.chassisNo(),
      engineNo: this.engineNo(),
      regNo: this.registration(),
      adviserId: this.executiveName(),
      totalAmount: this.totalAmount(),
      mobileNo: this.mobileNo(),
      guardian: this.guardian(),
      address: this.address(),
      issueType: this.issueType(),
      age: this.age(),
      cdmsNo: this.cdmsNo(),
      area: this.area(),
      hypothication: this.hypothication(),
      place: this.place(),
      receiptNo: this.receiptNo(),
      financeDues: this.financeDues(),
      vehicle: this.vehicle(),
      pCode: this.pCode(),
      color: this.color(),
      gstin: this.gstin(),
      basicAmount: this.basicAmount(),
      discountAmount: this.discountAmount(),
      hsnCode: this.hsnCode(),
      taxableAmount: this.taxableAmount(),
      sgst: this.sgst(),
      cgst: this.cgst(),
      cess: this.cess(),
      pincode: this.pincode()
    };

    this.api.updateSalesInvoice(this.invoiceId()!, payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.successMsg.set('Invoice updated successfully');
          alert('Invoice Updated successfully');
          setTimeout(() => this.router.navigate(['/previous-sales-invoice']), 1500);
        } else {
          this.errorMsg.set(res.message || 'Update failed');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMsg.set('Server error occurred');
      }
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  toggleHypothecationDropdown() {
    this.isHypothecationDropdownOpen.update(v => !v);
    if (this.isHypothecationDropdownOpen()) {
        this.hypothecationSearchTerm.set('');
    }
  }

  onHypothecationSelect(opt: any) {
    this.hypothication.set(opt.icompany_name);
    this.isHypothecationDropdownOpen.set(false);
  }

  loadExecutives(branchName: string): void {
    const bName = (branchName || '').trim();
    if (!bName) { this.executiveOptions.set([]); return; }
    this.api.getSalesInvoiceExecutives(bName).subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          const mapped = res.data.map((ex: any) => {
            const firstName = (ex.e_first_name || '').toString().trim();
            const code = (ex.e_code || ex.emp_id || '').toString().trim();
            return { value: firstName || code, label: `${firstName}[${code}]` };
          }).filter((x: any) => x.value && !x.label.startsWith('['));
          this.executiveOptions.set(mapped);
        } else {
          this.executiveOptions.set([]);
        }
      },
      error: () => this.executiveOptions.set([])
    });
  }

  toggleExecutiveDropdown() {
    this.isExecutiveDropdownOpen.update(v => !v);
    if (this.isExecutiveDropdownOpen()) {
      this.executiveSearchTerm.set('');
    }
  }

  onExecutiveSelect(ex: any) {
    this.executiveName.set(ex.value);
    this.isExecutiveDropdownOpen.set(false);
  }

  onIssueTypeChange(newType: string) {
    const prevType = this.issueType();
    if (prevType === newType) return;

    if (newType === '02') {
      // Clear fields when switching to Branch Transfer
      this.customerName.set('');
      this.address.set('');
      this.pincode.set('');
      this.gstin.set('');
      this.guardian.set('');
      this.customerBranchId.set('');
    } else if (newType === '01' && this.originalData) {
      // Restore original data when switching back to Sale (if original type was 01 or if we have original data)
      if (this.originalData.issueType === '01') {
        this.customerName.set(this.originalData.customerName);
        this.address.set(this.originalData.address);
        this.pincode.set(this.originalData.pincode);
        this.gstin.set(this.originalData.gstin);
        this.guardian.set(this.originalData.guardian);
      } else {
        this.customerName.set('');
        this.address.set('');
        this.pincode.set('');
        this.gstin.set('');
        this.guardian.set('');
      }
    }

    this.issueType.set(newType);
  }

  getExecutiveLabel(): string {
    const name = this.executiveName();
    if (!name) return '';
    const opt = this.executiveOptions().find(ex => ex.value === name);
    return opt ? opt.label : name;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.hypo-dropdown')) {
        this.isHypothecationDropdownOpen.set(false);
    }
    if (!target.closest('.exec-dropdown')) {
        this.isExecutiveDropdownOpen.set(false);
    }
    if (!target.closest('.branch-dropdown')) {
        this.isBranchDropdownOpen.set(false);
    }
  }

  toggleBranchDropdown() {
    this.isBranchDropdownOpen.update(v => !v);
    if (this.isBranchDropdownOpen()) {
        this.branchSearchTerm.set('');
    }
  }

  onBranchSelect(branch: any) {
    this.customerName.set(branch.branch_name);
    this.customerBranchId.set(branch.b_id.toString());
    this.address.set(branch.branch_address || '');
    this.pincode.set(branch.branch_pin || '');
    this.gstin.set(branch.branch_gstin || '');
    this.isBranchDropdownOpen.set(false);
  }

  getSelectedCustomerBranchName(): string {
    const id = parseInt((this.customerBranchId() || '').toString(), 10) || 0;
    const selected = this.branchOptions().find(b => b.b_id === id);
    return selected ? selected.branch_name : (this.customerName() || 'Select Branch');
  }

  initiateReturn(): void {
    const invNo = this.invoiceNo();
    if (!invNo) return;

    if (window.confirm(`Are you sure you want to return Invoice ${invNo}? This will restore stock.`)) {
      this.isLoading.set(true);
      this.api.saveSalesReturn({
        invNo: invNo,
        returnDate: new Date().toISOString().split('T')[0]
      }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            alert('Sales return processed successfully.');
            this.router.navigate(['/previous-sales-invoice']);
          } else {
            this.errorMsg.set(res.message || 'Failed to process return.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMsg.set(err?.error?.message || 'Server error.');
        }
      });
    }
  }
}
