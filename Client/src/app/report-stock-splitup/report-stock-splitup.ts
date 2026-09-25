import { Component, signal, computed, effect } from '@angular/core';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-report-stock-splitup',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter, RouterLink],
    templateUrl: './report-stock-splitup.html',
    styleUrl: './report-stock-splitup.css',
})
export class ReportStockSplitup {
    branchId = signal<string>('');
    branchName = signal<string>('Select Branch');
    loading = signal<boolean>(false);
    records = signal<any[]>([]);
    total = signal<number>(0);
    page = signal<number>(1);
    limit = signal<number>(25);
    isInfiniteScroll = signal<boolean>(false);

    // Filter signals
    chassisNo = signal<string>('');
    searchTerm = signal<string>('');
    selectedVehicleCodes = signal<string[]>([]);
    isVehicleDropdownOpen = signal<boolean>(false);
    labourCodes = signal<any[]>([]);

    searchOption = signal<string>('ALL');
    fromDate = signal<string>('');
    toDate = signal<string>('');

    // Admin Branch Selection
    branches = signal<any[]>([]);
    isBranchDropdownOpen = signal<boolean>(false);
    branchSearchTerm = signal<string>('');

    isAdmin = computed(() => {
        const user = this.api.getCurrentUser();
        return user?.role == 1 || user?.role_des === 'admin';
    });

    filteredBranches = computed(() => {
        const term = this.branchSearchTerm().toLowerCase();
        if (!term) return this.branches();
        return this.branches().filter(b =>
            b.branch_name.toLowerCase().includes(term) ||
            b.b_id.toString().includes(term)
        );
    });

    constructor(private api: ApiService) {
        const user = this.api.getCurrentUser();
        if (user) {
            if (this.isAdmin()) {
                this.branchId.set('');
                this.branchName.set('All Branches');
            } else {
                this.branchId.set(user.branch_id?.toString() || '');
                this.branchName.set(user.branch_name || 'My Branch');
            }
        }

        this.api.getBranches().subscribe({
            next: (res) => {
                if (res.success) this.branches.set(res.data || []);
            }
        });

        this.api.getAllLabourCodes().subscribe({
            next: (res) => { if (res.success) this.labourCodes.set(res.data || []); }
        });

        effect(() => {
            // Load data whenever branch, date or other filters change
            this.loadData();
        });

        effect(() => {
            // Load totals whenever filters change
            this.loadTotals();
        });
    }

    loadData() {
        if (this.page() === 1) {
            this.loading.set(true);
        }
        const apiCall = this.searchOption() === 'ALL'
            ? this.api.getStockSplitupAll(
                this.branchId(),
                this.chassisNo(),
                this.selectedVehicleCodes(),
                this.page(),
                this.limit(),
                this.searchTerm()
            )
            : this.api.getStockSplitup(
                this.branchId(),
                this.fromDate(),
                this.toDate(),
                this.chassisNo(),
                this.selectedVehicleCodes(),
                this.page(),
                this.limit(),
                this.searchTerm()
            );

        apiCall.subscribe({
            next: (res) => {
                if (res.success) {
                    if (this.isInfiniteScroll() && this.page() > 1) {
                        this.records.update(curr => [...curr, ...(res.data || [])]);
                    } else {
                        this.records.set(res.data || []);
                    }
                    this.total.set(res.total || 0);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.loading.set(false);
            }
        });
    }

    loadTotals() {
        const obs = this.searchOption() === 'ALL'
            ? this.api.getStockSplitupTotalsAll(
                this.branchId(),
                this.chassisNo(),
                this.selectedVehicleCodes(),
                this.searchTerm()
            )
            : this.api.getStockSplitupTotals(
                this.branchId(),
                this.fromDate(),
                this.toDate(),
                this.chassisNo(),
                this.selectedVehicleCodes(),
                this.searchTerm()
            );

        obs.subscribe({
            next: (res) => {
                if (res.success && res.grandTotals) {
                    this.totalInvoiceAmount.set(parseFloat(res.grandTotals.totalInvoiceAmount || 0));
                }
            },
            error: (err) => console.error(err)
        });
    }

    toggleBranchDropdown() {
        this.isBranchDropdownOpen.set(!this.isBranchDropdownOpen());
        if (this.isBranchDropdownOpen()) {
            this.branchSearchTerm.set('');
        }
    }

    selectBranch(branch: any) {
        this.branchId.set(branch.b_id.toString());
        this.branchName.set(branch.branch_name);
        this.isBranchDropdownOpen.set(false);
        this.page.set(1);
    }

    onFilterChange() {
        this.page.set(1);
    }

    toggleVehicleDropdown() {
        this.isVehicleDropdownOpen.set(!this.isVehicleDropdownOpen());
    }

    isVehicleSelected(code: string): boolean {
        return this.selectedVehicleCodes().includes(code);
    }

    toggleVehicleCode(code: string) {
        const current = this.selectedVehicleCodes();
        if (current.includes(code)) {
            this.selectedVehicleCodes.set(current.filter(c => c !== code));
        } else {
            this.selectedVehicleCodes.set([...current, code]);
        }
        this.onFilterChange();
    }

    changePage(p: number | string) {
        if (typeof p === 'number' && p !== this.page()) {
            this.page.set(p);
        }
    }

    changeLimit(limit: any) {
        const numLimit = Number(limit);
        if (numLimit === 0) {
            this.isInfiniteScroll.set(true);
            this.limit.set(250);
        } else {
            this.isInfiniteScroll.set(false);
            this.limit.set(numLimit);
        }
        this.page.set(1);
    }

    onTableScroll(event: any) {
        if (!this.isInfiniteScroll() || this.loading()) return;
        
        const target = event.target as HTMLElement;
        const threshold = 2000; 
        if (target.scrollHeight - target.scrollTop - target.clientHeight < threshold) {
            if (this.records().length < this.total()) {
                this.loading.set(true);
                this.page.update(p => p + 1);
            }
        }
    }

    onSearchOptionChange(option: string) {
        this.searchOption.set(option);
        this.updateDateRange(option);
        this.onFilterChange();
    }

    updateDateRange(option: string) {
        const today = new Date();
        let from = new Date();
        let to = new Date();

        switch (option) {
            case 'Month to Date':
                from = new Date(today.getFullYear(), today.getMonth(), 1);
                to = today;
                break;
            case 'Previous Month':
                from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                to = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'Year to Date':
                from = new Date(today.getFullYear(), 0, 1);
                to = today;
                break;
            case 'Previous Year':
                from = new Date(today.getFullYear() - 1, 0, 1);
                to = new Date(today.getFullYear() - 1, 11, 31);
                break;
            case 'ALL':
                from = null as any;
                to = null as any;
                break;
            case 'Custom Date':
            default:
                return;
        }

        this.fromDate.set(from ? this.formatDate(from) : '');
        this.toDate.set(to ? this.formatDate(to) : '');
    }

    private formatDate(date: Date): string {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    // Pagination Computeds
    totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
    hasPrev = computed(() => this.page() > 1);
    hasNext = computed(() => this.isInfiniteScroll() ? this.records().length < this.total() : this.page() < this.totalPages());
    fromEntry = computed(() => this.total() === 0 ? 0 : (this.isInfiniteScroll() ? 1 : (this.page() - 1) * this.limit() + 1));
    toEntry = computed(() => this.isInfiniteScroll() ? this.records().length : Math.min(this.page() * this.limit(), this.total()));

    visiblePages = computed(() => {
        const total = this.totalPages();
        const current = this.page();
        const pages: (number | string)[] = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current > 4) pages.push('...');
            const start = Math.max(2, current - 2);
            const end = Math.min(total - 1, current + 2);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 3) pages.push('...');
            if (total > 1) pages.push(total);
        }
        return pages;
    });

    totalInvoiceAmount = signal<number>(0);

    viewPdf(id: string) {
        const url = this.api.getPurchasePdfUrl(id);
        window.open(url, '_blank');
    }

    exportToExcel() {
        const branchId = this.branchId() || undefined;
        const from = this.fromDate();
        const to = this.toDate();
        const chassisNo = this.chassisNo() || undefined;
        const vehicleCode = this.selectedVehicleCodes().length > 0 ? this.selectedVehicleCodes() : undefined;
        const search = this.searchTerm() || undefined;

        const url = this.searchOption() === 'ALL'
            ? this.api.getStockSplitupAllExcelUrl(branchId, chassisNo, vehicleCode, search)
            : this.api.getStockSplitupExcelUrl(branchId, from, to, chassisNo, vehicleCode, search);
        window.open(url, '_blank');
    }

    exportPagedExcel() {
        const branchId = this.branchId() || undefined;
        const from = this.fromDate();
        const to = this.toDate();
        const chassisNo = this.chassisNo() || undefined;
        const vehicleCode = this.selectedVehicleCodes().length > 0 ? this.selectedVehicleCodes() : undefined;
        const page = this.page();
        const limit = this.limit();
        const search = this.searchTerm() || undefined;

        const url = this.searchOption() === 'ALL'
            ? this.api.getStockSplitupAllPagedExcelUrl(branchId, chassisNo, vehicleCode, page, limit, search)
            : this.api.getStockSplitupPagedExcelUrl(branchId, from, to, chassisNo, vehicleCode, page, limit, search);
        window.open(url, '_blank');
    }

    exportPagedCsv() {
        const branchId = this.branchId() || undefined;
        const from = this.fromDate();
        const to = this.toDate();
        const chassisNo = this.chassisNo() || undefined;
        const vehicleCode = this.selectedVehicleCodes().length > 0 ? this.selectedVehicleCodes() : undefined;
        const page = this.page();
        const limit = this.limit();
        const search = this.searchTerm() || undefined;

        const url = this.searchOption() === 'ALL'
            ? this.api.getStockSplitupAllPagedCsvUrl(branchId, chassisNo, vehicleCode, page, limit, search)
            : this.api.getStockSplitupPagedCsvUrl(branchId, from, to, chassisNo, vehicleCode, page, limit, search);
        window.open(url, '_blank');
    }
}
