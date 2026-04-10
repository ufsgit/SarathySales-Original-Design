import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-previous-branch-transfer',
  standalone: true,
  imports: [UserNav, UserFooter, RouterLink, FormsModule],
  templateUrl: './previous-branch-transfer.html',
  styleUrl: './previous-branch-transfer.css',
})
export class PreviousBranchTransfer implements OnInit, OnDestroy {

  records = signal<any[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(25);
  searchTerm = signal('');
  isLoading = signal(false);
  isAdmin = computed(() => {
    const user = this.api.getCurrentUser();
    return user?.role == 1 || user?.role_des === 'admin';
  });
  errorMsg = signal('');

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

  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private router: Router) { }

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

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadData(): void {
    const user = this.api.getCurrentUser();
    if (!user) {
      this.errorMsg.set('User info missing. Please re-login.');
      return;
    }

    const isAdmin = user.role == 1 || user.role_des === 'admin';
    const branchId = isAdmin ? undefined : user.branch_id;

    if (!isAdmin && !branchId) {
      this.errorMsg.set('Branch info missing. Please re-login.');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set('');
    this.api.listBranchTransfers(this.page(), this.limit(), this.searchTerm(), branchId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) { this.records.set(res.data ?? []); this.total.set(res.total ?? 0); }
        else { this.errorMsg.set(res.message || 'Failed to load records.'); }
      },
      error: (err) => { this.isLoading.set(false); this.errorMsg.set(err?.error?.message || 'Server error.'); }
    });
  }

  onSearchInput(value: string): void { this.searchInput$.next(value); }

  onLimitChange(value: string): void { this.limit.set(Number(value)); this.page.set(1); this.loadData(); }

  prevPage(): void { if (this.hasPrev()) { this.page.update(p => p - 1); this.loadData(); } }
  nextPage(): void { if (this.hasNext()) { this.page.update(p => p + 1); this.loadData(); } }

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p !== this.page()) {
      this.page.set(p);
      this.loadData();
    }
  }

  rowIndex(i: number): number { return (this.page() - 1) * this.limit() + i + 1; }

  editBill(row: any): void {
    if (!row?.lc_id) return;
    this.router.navigate(['/branch-transfer', row.lc_id]);
  }

  generatePdf(row: any): void {
    if (!row.debit_note_no) return;
    const url = this.api.getBranchTransferPdfUrl(row.debit_note_no);
    window.open(url, '_blank');
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN');
  }
}
