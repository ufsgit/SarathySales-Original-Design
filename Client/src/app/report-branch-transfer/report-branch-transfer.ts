import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-report-branch-transfer',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter, RouterLink],
    templateUrl: './report-branch-transfer.html',
    styleUrl: './report-branch-transfer.css',
})
export class ReportBranchTransfer implements OnInit {
    // Signals for state management
    records = signal<any[]>([]);
    page = signal(1);
    limit = signal(10);
    total = signal(0);
    loading = signal(false);

    // Filter signals
    branchId = signal('');
    branchName = signal('');
    fromDate = signal(new Date().toISOString().split('T')[0]);
    toDate = signal(new Date().toISOString().split('T')[0]);
    searchOption = signal('Custom Date');
    isBranchDropdownOpen = signal(false);
    branchSearchTerm = signal('');
    branches = signal<any[]>([]);

    // Computed signals for pagination
    totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
    fromEntry = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1);
    toEntry = computed(() => Math.min(this.page() * this.limit(), this.total()));
    hasPrev = computed(() => this.page() > 1);
    hasNext = computed(() => this.page() < this.totalPages());

    // Total Amount computed
    totalTransAmount = computed(() => {
        return this.records().reduce((acc, row) => acc + (parseFloat(row.trans_total) || 0), 0);
    });

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

    filteredBranches = computed(() => {
        const term = this.branchSearchTerm().toLowerCase();
        return this.branches().filter(b =>
            b.branch_name.toLowerCase().includes(term) ||
            b.b_id.toString().includes(term)
        );
    });

    isAdmin = computed(() => {
        const user = this.api.getCurrentUser();
        return user?.role == 1 || user?.role_des === 'admin';
    });

    constructor(private router: Router, private api: ApiService) { }

    ngOnInit() {
        const user = this.api.getCurrentUser();
        if (user) {
            this.branchId.set(user.branch_id || '');
            this.branchName.set(user.branch_name || 'No Branch');

            if (this.isAdmin()) {
                this.api.getBranches().subscribe({
                    next: (res) => {
                        if (res.success) {
                            this.branches.set(res.data || []);
                        }
                    }
                });
            }
        }
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        this.api.getBranchTransferReport(
            this.branchId(),
            this.fromDate(),
            this.toDate(),
            this.page(),
            this.limit()
        ).subscribe({
            next: (res) => {
                if (res.success) {
                    this.records.set(res.data || []);
                    this.total.set(res.total || (res.data || []).length);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading branch transfer report:', err);
                this.loading.set(false);
            }
        });
    }

    onFilterChange() {
        this.page.set(1);
        this.loadData();
    }

    onSearchOptionChange(event: any) {
        const option = event.target.value;
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
            case 'Custom Date':
            default:
                return;
        }

        this.fromDate.set(this.formatDate(from));
        this.toDate.set(this.formatDate(to));
    }

    formatDate(date: Date): string {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    formatDisplayDate(d: string | null): string {
        if (!d) return '—';
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN');
    }

    formatAmount(v: any): string {
        const n = parseFloat(v);
        return isNaN(n) ? (v || '0.00') : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    changePage(p: number | string) {
        if (typeof p === 'number') {
            this.page.set(p);
            this.loadData();
        }
    }

    changeLimit(event: any) {
        const limit = event.target.value;
        this.limit.set(Number(limit));
        this.page.set(1);
        this.loadData();
    }

    prevPage() { if (this.hasPrev()) { this.page.update(p => p - 1); this.loadData(); } }
    nextPage() { if (this.hasNext()) { this.page.update(p => p + 1); this.loadData(); } }

    navigate(path: string) { this.router.navigate([path]); }

    exportToExcel() {
        const branchId = this.branchId() || undefined;
        const from = this.fromDate();
        const to = this.toDate();
        const url = this.api.getBranchTransferExcelUrl(branchId, from, to);
        window.open(url, '_blank');
    }

    exportPagedExcel() {
        const branchId = this.branchId() || undefined;
        const from = this.fromDate();
        const to = this.toDate();
        const page = this.page();
        const limit = this.limit();
        const url = this.api.getBranchTransferPagedExcelUrl(branchId, from, to, page, limit);
        window.open(url, '_blank');
    }

    exportPagedCsv() {
        const branchId = this.branchId() || undefined;
        const from = this.fromDate();
        const to = this.toDate();
        const page = this.page();
        const limit = this.limit();
        const url = this.api.getBranchTransferPagedCsvUrl(branchId, from, to, page, limit);
        window.open(url, '_blank');
    }

    toggleBranchDropdown() {
        if (!this.isAdmin()) return;
        this.isBranchDropdownOpen.update(v => !v);
        if (this.isBranchDropdownOpen()) {
            this.branchSearchTerm.set('');
        }
    }

    selectBranch(branch: any) {
        this.branchId.set(branch.b_id);
        this.branchName.set(branch.branch_name);
        this.isBranchDropdownOpen.set(false);
        this.onFilterChange();
    }

    viewPdf(id: number) {
        const url = this.api.getBranchTransferPdfUrl(id);
        window.open(url, '_blank');
    }
}
