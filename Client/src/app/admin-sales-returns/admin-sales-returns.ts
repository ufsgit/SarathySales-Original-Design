import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { AdminNav } from '../admin-nav/admin-nav';
import { UserFooter } from '../user-footer/user-footer';

@Component({
    selector: 'app-admin-sales-returns',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, AdminNav, UserFooter],
    templateUrl: './admin-sales-returns.html',
    styleUrl: './admin-sales-returns.css'
})
export class AdminSalesReturnsComponent implements OnInit, OnDestroy {
    // Signals for state management
    records = signal<any[]>([]);
    total = signal(0);
    page = signal(1);
    limit = signal(10);
    searchTerm = signal('');
    isLoading = signal(false);
    errorMsg = signal('');

    // Pagination computed signals
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
            // Always show first page
            pages.push(1);

            if (current > 4) {
                pages.push('...');
            }

            // Show current page and neighbors
            const start = Math.max(2, current - 2);
            const end = Math.min(total - 1, current + 2);
            
            // Adjust start/end if we are near boundaries to keep length consistent
            let adjustedStart = start;
            let adjustedEnd = end;
            
            if (current <= 4) {
                adjustedEnd = 6;
            } else if (current > total - 4) {
                adjustedStart = total - 5;
            }

            for (let i = adjustedStart; i <= adjustedEnd; i++) {
                if (i > 1 && i < total) {
                    pages.push(i);
                }
            }

            if (current < total - 3) {
                pages.push('...');
            }

            // Always show last page
            if (total > 1) {
                pages.push(total);
            }
        }
        
        // Final sanity check: unique values and filtered
        return pages.filter((v, i, a) => a.indexOf(v) === i);
    });

    private searchInput$ = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor(private api: ApiService) { }

    ngOnInit(): void {
        this.searchInput$.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(term => {
            this.searchTerm.set(term);
            this.page.set(1);
            this.loadData();
        });
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.isLoading.set(true);
        this.errorMsg.set('');

        // For admin view, we pass undefined for branchId to get all branches
        this.api.getSalesReturnReport(undefined, this.page(), this.limit(), this.searchTerm()).subscribe({
            next: (res: any) => {
                this.isLoading.set(false);
                if (res.success) {
                    this.records.set(res.data ?? []);
                    this.total.set(res.total ?? 0);
                } else {
                    this.errorMsg.set(res.message || 'Failed to load records.');
                }
            },
            error: (err: any) => {
                this.isLoading.set(false);
                this.errorMsg.set(err?.error?.message || 'Server error.');
            }
        });
    }

    onSearchInput(value: string): void {
        this.searchInput$.next(value.trim());
    }

    onLimitChange(value: string): void {
        this.limit.set(Number(value));
        this.page.set(1);
        this.loadData();
    }

    prevPage(): void {
        if (this.hasPrev()) {
            this.page.update(p => p - 1);
            this.loadData();
        }
    }

    nextPage(): void {
        if (this.hasNext()) {
            this.page.update(p => p + 1);
            this.loadData();
        }
    }

    goToPage(p: number | string): void {
        if (typeof p === 'number' && p !== this.page()) {
            this.page.set(p);
            this.loadData();
        }
    }

    rowIndex(i: number): number {
        return (this.page() - 1) * this.limit() + i + 1;
    }

    formatDate(d: string | null): string {
        if (!d) return '—';
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB');
    }

    formatAmount(v: any): string {
        const n = parseFloat(v);
        return isNaN(n) ? (v || '0.00') : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    generatePdf(id: string | number) {
        if (!id) return;
        const url = this.api.getSalesReturnPdfUrl(id);
        window.open(url, '_blank');
    }
}
