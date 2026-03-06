import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-previous-pay-slip',
  standalone: true,
  imports: [UserNav, UserFooter, RouterLink, FormsModule],
  templateUrl: './previous-pay-slip.html',
  styleUrl: './previous-pay-slip.css',
})
export class PreviousPaySlip implements OnInit, OnDestroy {

  // ── State signals ──────────────────────────────────────────
  records = signal<any[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(25);
  searchTerm = signal('');
  isLoading = signal(false);
  errorMsg = signal('');

  // ── Derived ────────────────────────────────────────────────
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  fromEntry = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1
  );
  toEntry = computed(() =>
    Math.min(this.page() * this.limit(), this.total())
  );

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

  // search debounce
  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    // debounce search input — wait 400 ms before firing API call
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

  // ── Data loading ────────────────────────────────────────────
  loadData(): void {
    const user = this.api.getCurrentUser();
    if (!user || !user.branch_id) {
      this.errorMsg.set('Branch info missing. Please re-login.');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set('');

    this.api.listPaySlips(this.page(), this.limit(), this.searchTerm(), user.branch_id)
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            this.records.set(res.data ?? []);
            this.total.set(res.total ?? 0);
          } else {
            this.errorMsg.set(res.message || 'Failed to load records.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMsg.set(err?.error?.message || 'Server error. Please try again.');
        }
      });
  }

  // ── Controls ────────────────────────────────────────────────
  onSearchInput(value: string): void {
    this.searchInput$.next(value);
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

  // ── Helpers ─────────────────────────────────────────────────
  rowIndex(i: number): number {
    return (this.page() - 1) * this.limit() + i + 1;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN');
  }

  formatAmount(val: any): string {
    const n = parseFloat(val);
    return isNaN(n) ? '—' : n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  generatePdf(id: number): void {
    const url = this.api.getPaySlipPdfUrl(id);
    window.open(url, '_blank');
  }
}
