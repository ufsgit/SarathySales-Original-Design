import { Component, OnInit, signal, computed } from '@angular/core';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-reports-proforma-invoice',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter],
    templateUrl: './reports-proforma-invoice.html',
    styleUrl: './reports-proforma-invoice.css',
})
export class ReportsProformaInvoice implements OnInit {
    // Signals for state
    records = signal<any[]>([]);
    page = signal(1);
    limit = signal(25);
    total = signal(0);
    loading = signal(false);

    // Filters
    branchId = signal('');
    branchName = signal('');
    fromDate = signal(new Date().toISOString().split('T')[0]);
    toDate = signal(new Date().toISOString().split('T')[0]);
    status = signal('');
    searchOption = signal('Custom Date');

    Math = Math;

    // Computed totals (safe because data is sanitized on load)
    totalTaxable = computed(() => this.records().reduce((acc, r) => acc + r.pro_vehi_tax_total, 0));
    totalSgst = computed(() => this.records().reduce((acc, r) => acc + r.pro_vehi_sgst_total, 0));
    totalCgst = computed(() => this.records().reduce((acc, r) => acc + r.pro_vehi_cgst_total, 0));
    totalAmount = computed(() => this.records().reduce((acc, r) => acc + r.pro_grand_total, 0));
    totalMiss1 = computed(() => this.records().reduce((acc, r) => acc + r.pro_missal1_amt, 0));
    totalMiss2 = computed(() => this.records().reduce((acc, r) => acc + r.pro_missal2_amt, 0));
    totalLess = computed(() => this.records().reduce((acc, r) => acc + r.pro_less, 0));

    // Pagination signals
    totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
    fromEntry = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1);
    toEntry = computed(() => Math.min(this.page() * this.limit(), this.total()));
    hasPrev = computed(() => this.page() > 1);
    hasNext = computed(() => this.page() < this.totalPages());

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

    constructor(private api: ApiService) { }

    ngOnInit() {
        const user = this.api.getCurrentUser();
        if (user) {
            this.branchId.set(user.branch_id || '');
            this.branchName.set(user.branch_name || 'No Branch');
        }
        this.loadData();
    }

    loadData() {
        if (!this.branchId()) return;
        this.loading.set(true);
        this.api.getProformaReport(
            this.branchId(),
            this.fromDate(),
            this.toDate(),
            this.status(),
            this.page(),
            this.limit()
        ).subscribe({
            next: (res) => {
                if (res.success) {
                    const sanitized = (res.data || []).map((r: any) => ({
                        ...r,
                        pro_vehi_tax_total: parseFloat(r.pro_vehi_tax_total) || 0,
                        pro_vehi_sgst_total: parseFloat(r.pro_vehi_sgst_total) || 0,
                        pro_vehi_cgst_total: parseFloat(r.pro_vehi_cgst_total) || 0,
                        pro_vehicle_total: parseFloat(r.pro_vehicle_total) || 0,
                        pro_missal1_amt: parseFloat(r.pro_missal1_amt) || 0,
                        pro_missal2_amt: parseFloat(r.pro_missal2_amt) || 0,
                        pro_less: parseFloat(r.pro_less) || 0,
                        pro_grand_total: parseFloat(r.pro_grand_total) || 0
                    }));
                    this.records.set(sanitized);
                    this.total.set(res.total || sanitized.length);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading proforma report:', err);
                this.loading.set(false);
            }
        });
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

    refresh() {
        this.loadData();
    }

    changePage(p: number) {
        this.page.set(p);
        this.loadData();
    }

    changeLimit(limit: any) {
        this.limit.set(Number(limit));
        this.page.set(1);
        this.loadData();
    }

    exportToExcel() {
        const url = this.api.getProformaExcelUrl(
            this.branchId(),
            this.fromDate(),
            this.toDate(),
            this.status()
        );
        window.open(url, '_blank');
    }

    exportPagedExcel() {
        const url = this.api.getProformaPagedExcelUrl(
            this.branchId(),
            this.fromDate(),
            this.toDate(),
            this.status(),
            this.page(),
            this.limit()
        );
        window.open(url, '_blank');
    }

    exportPagedCsv() {
        const url = this.api.getProformaPagedCsvUrl(
            this.branchId(),
            this.fromDate(),
            this.toDate(),
            this.status(),
            this.page(),
            this.limit()
        );
        window.open(url, '_blank');
    }

    viewPdf(id: number) {
        const url = this.api.getProformaPdfUrl(id);
        window.open(url, '_blank');
    }
}
