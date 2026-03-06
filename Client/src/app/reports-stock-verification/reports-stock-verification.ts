import { Component, signal, computed, effect } from '@angular/core';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-reports-stock-verification',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter, RouterLink],
    templateUrl: './reports-stock-verification.html',
    styleUrl: './reports-stock-verification.css',
})
export class ReportsStockVerification {
    branchId = signal<string>('');
    loading = signal<boolean>(false);
    records = signal<any[]>([]);
    total = signal<number>(0);
    page = signal<number>(1);
    limit = signal<number>(25);

    // Dynamic branches
    branches = signal<any[]>([]);

    // Filter signals
    searchOption = signal<string>('Custom Date');
    fromDate = signal<string>(new Date().toISOString().split('T')[0]);
    toDate = signal<string>(new Date().toISOString().split('T')[0]);

    constructor(private api: ApiService) {
        // Initialize branch from storage
        const userStr = localStorage.getItem('sarathy_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            this.branchId.set(user.branch_id?.toString() || '');
        }

        // Fetch all branches for dropdown
        this.api.getBranches().subscribe({
            next: (res) => {
                if (res.success) this.branches.set(res.data || []);
            }
        });

        effect(() => {
            if (this.branchId()) {
                this.loadData();
            }
        });
    }

    loadData() {
        if (!this.branchId()) return;
        this.loading.set(true);
        this.api.getStockVerification(
            this.branchId(),
            this.fromDate(),
            this.toDate(),
            this.page(),
            this.limit()
        ).subscribe({
            next: (res) => {
                if (res.success) {
                    const sanitized = (res.data || []).map((r: any) => ({
                        ...r,
                        opening_stock: parseFloat(r.opening_stock || 0),
                        purchase: parseFloat(r.purchase || 0),
                        sales: parseFloat(r.sales || 0),
                        branch_transfer: parseFloat(r.branch_transfer || 0),
                        stock: parseFloat(r.stock || 0)
                    }));
                    this.records.set(sanitized);
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

    // Pagination Computeds
    totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
    hasPrev = computed(() => this.page() > 1);
    hasNext = computed(() => this.page() < this.totalPages());
    fromEntry = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1);
    toEntry = computed(() => Math.min(this.page() * this.limit(), this.total()));

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

    // Summary Totals matching image: Total Sales, Total Branch Trfer, Current Stock, Total Purchase
    totalSales = computed(() => this.records().reduce((acc, r) => acc + r.sales, 0));
    totalBranchTransfer = computed(() => this.records().reduce((acc, r) => acc + r.branch_transfer, 0));
    currentStockTotal = computed(() => this.records().reduce((acc, r) => acc + r.stock, 0));
    totalPurchase = computed(() => this.records().reduce((acc, r) => acc + r.purchase, 0));

    changePage(p: number | string) {
        if (typeof p === 'number' && p !== this.page()) {
            this.page.set(p);
            this.loadData();
        }
    }

    changeLimit(limit: any) {
        this.limit.set(Number(limit));
        this.page.set(1);
        this.loadData();
    }

    onFilterChange() {
        this.page.set(1);
        this.loadData();
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
            case 'Custom Date':
            default:
                return;
        }

        this.fromDate.set(this.formatDate(from));
        this.toDate.set(this.formatDate(to));
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
}
