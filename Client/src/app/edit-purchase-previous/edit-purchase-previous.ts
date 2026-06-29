import { Component, OnInit, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';
import { UppercaseDirective } from '../uppercase.directive';


@Component({
  selector: 'app-edit-purchase-previous',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNav, UserFooter, UppercaseDirective],
  templateUrl: './edit-purchase-previous.html',
  styleUrl: './edit-purchase-previous.css'
})
export class EditPurchasePrevious implements OnInit {
  branchId = signal('');
  branchName = signal('Select Branch');
  isAdmin = signal(false);
  branches = signal<any[]>([]);
  isBranchDropdownOpen = signal(false);
  branchSearchTerm = signal('');

  searchableBranchList = computed(() => {
    const term = this.branchSearchTerm().toLowerCase();
    return this.branches().filter(b =>
      (b.branch_name || '').toLowerCase().includes(term)
    );
  });

  isInstitutionDropdownOpen = signal(false);
  institutionSearchTerm = signal('');
  searchableInstitutionList = computed(() => {
    const term = this.institutionSearchTerm().toLowerCase();
    const selectedBranch = (this.branchName() || '').trim().toLowerCase();
    return this.institutionOptions().filter(b =>
      (b.branch_name || '').trim().toLowerCase() !== selectedBranch &&
      (b.branch_name || '').toLowerCase().includes(term)
    );
  });

  @ViewChild('branchDropdownRef') branchDropdownRef!: ElementRef;
  @ViewChild('branchSearchInput') branchSearchInput!: ElementRef;
  @ViewChild('institutionDropdownRef') institutionDropdownRef!: ElementRef;
  @ViewChild('institutionSearchInput') institutionSearchInput!: ElementRef;
  
  invNo = signal('');
  institution = signal('');
  institutionId = signal('');
  rcNo = signal('');
  hsnCode = signal('');
  rcDate = signal('');
  address = signal('');
  invoiceDate = signal('');
  gstin = signal('');

  institutionOptions = signal<Array<{ b_id: number; branch_name: string; branch_address: string; branch_gstin: string }>>([]);
  productOptions = signal<Array<{ productId: number; prodCode: string; description: string; salePrice: number; colors: Array<{ colorCode: string; colorName: string }> }>>([]);

  isSaving = signal(false);
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  items = signal<Array<{
    prodCode: string;
    description: string;
    chassisNo: string;
    engineNo: string;
    colorCode: string;
    colorName: string;
    availableColors: Array<{ colorCode: string; colorName: string }>;
    mfgDate: string;
    saleType: string;
    productId: number;
    amount: number;
    purchaseItemId?: number;
  }>>([]);

  totalPayableAmount = computed(() => {
    return this.items().reduce((sum: number, row: any) => sum + this.toNumber(row.amount), 0);
  });

  basicTotal = signal<number | null>(null);
  taxTotal = signal<number | null>(null);
  grandTotal = signal<number | null>(null);

  constructor(private router: Router, private api: ApiService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const user = this.api.getCurrentUser();
    if (user) {
      const admin = user.role == 1 || user.role_des === 'admin';
      this.isAdmin.set(admin);
    }
    
    this.loadBranches();
    this.loadInstitutionOptions();
    this.loadProductOptions();

    this.route.params.subscribe(params => {
      const invoiceNo = params['id'];
      if (invoiceNo) {
        this.loadInvoiceDetails(invoiceNo);
      }
    });
  }

  loadInvoiceDetails(invoiceNo: string) {
    this.isLoading.set(true);
    this.api.getPurchaseInvoiceByNo(invoiceNo).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res?.success && res.data) {
          const d = res.data;
          this.invNo.set(d.invoiceNo || '');
          this.branchName.set(d.branchName || '');
          if (d.branchId) this.branchId.set(d.branchId.toString());
          if (d.invoiceDate) this.invoiceDate.set(this.formatDateForInput(d.invoiceDate));
          if (d.rcDate) this.rcDate.set(this.formatDateForInput(d.rcDate));
          this.rcNo.set(d.rcNo || '');
          this.hsnCode.set(d.hsnCode || '');
          this.gstin.set(d.gstin || '');
          this.address.set(d.address || '');
          this.institution.set(d.supplierName || '');
          this.basicTotal.set(d.basicTotal != null ? Number(d.basicTotal) : null);
          this.taxTotal.set(d.taxTotal != null ? Number(d.taxTotal) : null);
          this.grandTotal.set(d.grandTotal != null ? Number(d.grandTotal) : null);
          
          if (Array.isArray(d.items)) {
            const mappedItems = d.items.map((item: any) => {
                const baseColors = this.getColorsForProduct(item.prodCode);
                const colorCode = (item.colorCode || '').toString().trim();
                const colorName = (item.colorName || '').toString().trim();

                // Ensure the saved color is available in the dropdown
                const hasColor = baseColors.some(c => (c.colorCode || '').trim() === colorCode);
                if (!hasColor && colorCode) {
                    baseColors.push({ colorCode, colorName });
                }

                return {
                    prodCode: item.prodCode || '',
                    description: item.description || '',
                    chassisNo: item.chassisNo || '',
                    engineNo: item.engineNo || '',
                    colorCode: colorCode,
                    colorName: colorName,
                    availableColors: baseColors,
                    mfgDate: this.formatDateForInput(item.mfgDate),
                    saleType: item.saleType || '',
                    productId: item.productId || 0,
                    amount: Number(item.amount) || 0,
                    purchaseItemId: item.purchaseItemId
                };
            });
            this.items.set(mappedItems);
          }
        } else {
          this.errorMessage.set(res?.message || 'Invoice details not found.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to load invoice details.');
      }
    });
  }

  formatDateForInput(d: any): string {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadBranches() {
    this.api.getBranches().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.branches.set(res.data);
        }
      }
    });
  }

  loadInstitutionOptions() {
    this.api.listInstitutions(1, 1000).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.institutionOptions.set(res.data.map((i: any) => ({
            b_id: i.b_id,
            branch_name: i.branch_name,
            branch_address: i.branch_address,
            branch_gstin: i.branch_gstin
          })));
        }
      }
    });
  }

  loadProductOptions() {
    this.api.getPurchaseProductOptions().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.productOptions.set(res.data);
          // After products are loaded, update available colors for existing items
          const currentItems = this.items();
          currentItems.forEach(item => {
            const baseColors = this.getColorsForProduct(item.prodCode);
            const colorCode = (item.colorCode || '').toString().trim();
            const colorName = (item.colorName || '').toString().trim();

            const hasColor = baseColors.some(c => (c.colorCode || '').trim() === colorCode);
            if (!hasColor && colorCode) {
               baseColors.push({ colorCode, colorName });
            }
            item.availableColors = baseColors;
          });
          this.items.set([...currentItems]);
        }
      }
    });
  }

  getColorsForProduct(prodCode: string): any[] {
    const query = (prodCode || '').toString().trim().toLowerCase();
    const prod = this.productOptions().find(p => (p.prodCode || '').trim().toLowerCase() === query);
    return prod ? [...prod.colors] : [];
  }

  onSave() {
    if (!this.invNo()) { alert('Invoice Number is required'); return; }

    const chassisSet = new Set<string>();
    for (const item of this.items()) {
        const c = (item.chassisNo || '').trim();
        if (c) {
            if (chassisSet.has(c)) {
                alert(`Duplicate Chassis Number found in this bill: ${c}`);
                return;
            }
            chassisSet.add(c);
        }
    }
    
    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const payload = {
      invoiceNo: this.invNo(),
      branchId: this.branchId(),
      invoiceDate: this.invoiceDate(),
      supplierName: this.institution(),
      address: this.address(),
      rcNo: this.rcNo(),
      rcDate: this.rcDate(),
      hsnCode: this.hsnCode(),
      gstin: this.gstin(),
      basicTotal: this.basicTotal(),
      taxTotal: this.taxTotal(),
      grandTotal: this.grandTotal(),
      items: this.items()
    };

    this.api.updatePurchaseInvoice(payload.invoiceNo, payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          alert('Purchase Invoice Updated successfully');
          this.router.navigate(['/previous-purchase-invoice']);
        } else {
          this.errorMessage.set(res.message || 'Failed to update invoice');
          alert(res.message || 'Failed to update invoice');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err?.error?.message || 'Server error';
        this.errorMessage.set(msg);
        alert(msg);
      }
    });
  }

  addRow() {
    this.items.update(prev => [...prev, this.createEmptyItem()]);
  }

  removeRow(index: number) {
    if (this.items().length > 1) {
      this.items.update(prev => prev.filter((_, i) => i !== index));
    }
  }

  createEmptyItem() {
    return {
      prodCode: '',
      description: '',
      chassisNo: '',
      engineNo: '',
      colorCode: '',
      colorName: '',
      availableColors: [],
      mfgDate: '',
      saleType: '',
      productId: 0,
      amount: 0
    };
  }

  onItemFieldChange(index: number, field: string, value: any) {
    const current = [...this.items()];
    const item = { ...current[index] };
    (item as any)[field] = value;

    if (field === 'prodCode') {
      const query = (value || '').toString().trim().toLowerCase();
      const prod = this.productOptions().find(p => (p.prodCode || '').trim().toLowerCase() === query);
      if (prod) {
        item.description = prod.description;
        item.productId = prod.productId;
        item.availableColors = [...prod.colors];
        item.amount = prod.salePrice;
      }
    } else if (field === 'colorCode') {
        const color = item.availableColors.find((c: any) => c.colorCode === value);
        if (color) item.colorName = color.colorName;
    }

    current[index] = item;
    this.items.set(current);
  }

  toggleBranchDropdown() { this.isBranchDropdownOpen.update(v => !v); }
  onBranchSelect(b: any) { this.branchName.set(b.branch_name); this.branchId.set(b.b_id.toString()); this.isBranchDropdownOpen.set(false); }
  
  toggleInstitutionDropdown() { this.isInstitutionDropdownOpen.update(v => !v); }
  onInstitutionSelect(b: any) {
    this.institution.set(b.branch_name);
    this.institutionId.set(b.b_id.toString());
    this.address.set(b.branch_address || '');
    this.gstin.set(b.branch_gstin || '');
    this.isInstitutionDropdownOpen.set(false);
  }

  private toNumber(val: any): number { let n = parseFloat(val); return isNaN(n) ? 0 : n; }
  formatColorOption(code: string, name: string): string {
    const c = (code || '').toString().trim();
    const n = (name || '').toString().trim();
    if (c && n) return `${c}[ ${n}]`;
    return c || n || '';
  }
  navigate(path: string) { this.router.navigate([path]); }
  trackByFn(index: number) { return index; }
}
