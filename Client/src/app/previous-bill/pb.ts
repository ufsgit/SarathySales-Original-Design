import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Receipt {
  customer: string;
  branch: string;
  date: string;
  receiptNo: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Cancelled';
}

@Component({
  selector: 'app-previous-bill',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="app-container">
  <!-- Top Navigation -->
  <nav class="top-nav">
    <div class="nav-brand">
      <div class="logo-box">S</div>
      <h1>Sarathy Motors</h1>
    </div>
    <div class="nav-actions">
      <button class="icon-btn" title="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      </button>
      <div class="user-pill" (click)="navigate('/user-dashboard')">
        <div class="avatar">SB</div>
        <span>Staff Portal</span>
      </div>
    </div>
  </nav>

  <main class="page-content">
    <header class="content-header">
      <div class="header-left">
        <button class="back-link" (click)="navigate('/user-dashboard')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Terminal
        </button>
        <h2>Previous Bill History</h2>
        <p>Comprehensive list of all generated money receipts and vehicle transactions.</p>
      </div>
      <div class="header-right">
        <button class="action-btn primary" (click)="navigate('/money-receipt')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Receipt
        </button>
      </div>
    </header>

    <!-- Stats Overview -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon blue">₹</div>
        <div class="stat-data">
          <span class="label">Total Collected</span>
          <span class="value">₹0.00</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="stat-data">
          <span class="label">Total Receipts</span>
          <span class="value">0</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="stat-data">
          <span class="label">Pending Audits</span>
          <span class="value">0</span>
        </div>
      </div>
    </div>

    <div class="data-section">
      <div class="section-toolbar">
        <div class="search-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search by customer, receipt no or phone...">
        </div>
        <div class="filter-actions">
          <button class="secondary-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filters
          </button>
          <button class="secondary-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export
          </button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>SI:NO</th>
              <th>CLIENT DETAILS</th>
              <th>BRANCH OFFICE</th>
              <th>DATE</th>
              <th>RECEIPT NUMBER</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @if (receipts.length === 0) {
              <tr class="empty-row">
                <td colspan="8">
                  <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h3>No Transactions Found</h3>
                    <p>We couldn't find any service history for the current criteria.</p>
                  </div>
                </td>
              </tr>
            }
            @for (item of receipts; track $index) {
              <tr>
                <td>{{$index + 1}}</td>
                <td>
                  <div class="client-cell">
                    <span class="name">{{item.customer}}</span>
                  </div>
                </td>
                <td><span class="branch-tag">{{item.branch}}</span></td>
                <td>{{item.date}}</td>
                <td><code class="receipt-code">{{item.receiptNo}}</code></td>
                <td><span class="amount-cell">₹{{item.amount | number:'1.2-2'}}</span></td>
                <td><span class="status-badge" [class]="item.status.toLowerCase()">{{item.status}}</span></td>
                <td class="table-actions">
                  <button class="view-btn">View</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <footer class="table-footer">
        <div class="entries-count">Showing 0 to 0 of 0 entries</div>
        <div class="pagination">
          <button class="page-btn" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span class="page-num active">1</span>
          <button class="page-btn" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </footer>
    </div>
  </main>
</div>
`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    :host {
      --primary: #0f172a;
      --accent: #3b82f6;
      --bg: #f8fafc;
      --surface: #ffffff;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }

    .app-container {
      min-height: 100vh;
      background-color: var(--bg);
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: var(--text-main);
    }

    /* Navigation */
    .top-nav {
      height: 70px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 0 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand { display: flex; align-items: center; gap: 12px; }
    .logo-box {
      width: 40px;
      height: 40px;
      background: var(--primary);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 20px;
    }
    .nav-brand h1 { font-size: 20px; font-weight: 700; margin: 0; color: var(--primary); letter-spacing: -0.5px; }
    .nav-actions { display: flex; align-items: center; gap: 20px; }
    .user-pill {
      background: #f1f5f9;
      padding: 6px 16px 6px 6px;
      border-radius: 100px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }
    .user-pill:hover { background: #e2e8f0; }
    .avatar {
      width: 32px;
      height: 32px;
      background: var(--accent);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    /* Page Content */
    .page-content { padding: 40px; max-width: 1400px; margin: 0 auto; }
    
    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    .back-link {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 12px;
      padding: 0;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--accent); }
    .content-header h2 { font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; }
    .content-header p { color: var(--text-muted); margin: 8px 0 0; font-size: 15px; }

    /* Stats Overview */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: var(--surface);
      padding: 24px;
      border-radius: 20px;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
    }
    .stat-icon.blue { background: #eff6ff; color: #3b82f6; }
    .stat-icon.green { background: #f0fdf4; color: #10b981; }
    .stat-icon.orange { background: #fff7ed; color: #f97316; }
    .stat-data .label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
    .stat-data .value { font-size: 24px; font-weight: 800; display: block; margin-top: 2px; }

    /* Data Section */
    .data-section {
      background: var(--surface);
      border-radius: 24px;
      border: 1px solid var(--border);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .section-toolbar {
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      background: #fcfdfe;
    }
    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f1f5f9;
      padding: 10px 18px;
      border-radius: 14px;
      width: 400px;
      color: var(--text-muted);
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .search-wrapper:focus-within { background: white; border-color: var(--accent); box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
    .search-wrapper input { border: none; background: transparent; outline: none; width: 100%; font-size: 14px; color: var(--text-main); font-family: inherit; }
    
    .filter-actions { display: flex; gap: 12px; }
    .secondary-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      border: 1px solid var(--border);
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .secondary-btn:hover { background: #f8fafc; color: var(--text-main); border-color: #cbd5e1; }

    .primary {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .primary:hover { background: #1e293b; transform: translateY(-1px); }

    /* Table */
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 16px 32px; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; background: #f8fafc; }
    td { padding: 20px 32px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: var(--text-main); }
    
    .client-cell { display: flex; flex-direction: column; }
    .client-cell .name { font-weight: 700; color: var(--primary); }
    .branch-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: var(--text-muted); }
    .receipt-code { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--accent); background: #eff6ff; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .amount-cell { font-weight: 800; color: var(--primary); }
    
    .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; }
    .status-badge.paid { background: #dcfce7; color: #166534; }
    .status-badge.pending { background: #fef9c3; color: #854d0e; }
    
    .view-btn { background: none; border: 1px solid var(--border); padding: 6px 16px; border-radius: 100px; font-size: 12px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
    .view-btn:hover { background: var(--primary); color: white; border-color: var(--primary); }

    .empty-row td { padding: 100px 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .empty-icon { font-size: 48px; margin-bottom: 8px; }
    .empty-state h3 { margin: 0; font-size: 20px; font-weight: 700; }
    .empty-state p { margin: 0; color: var(--text-muted); }

    .table-footer { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; background: #fcfdfe; }
    .entries-count { font-size: 14px; color: var(--text-muted); font-weight: 500; }
    .pagination { display: flex; align-items: center; gap: 4px; }
    .page-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: white; border-radius: 8px; color: var(--text-muted); cursor: pointer; }
    .page-num { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; border-radius: 8px; cursor: pointer; }
    .page-num.active { background: var(--primary); color: white; }

    @media (max-width: 1024px) {
      .stats-cards { grid-template-columns: 1fr; }
      .search-wrapper { width: 100%; }
      .section-toolbar { flex-direction: column; gap: 20px; }
      .filter-actions { width: 100%; }
    }
  `]
})
export class PreviousBillComponent {
  receipts: Receipt[] = [];
  constructor(private router: Router) { }
  navigate(path: string) { this.router.navigate([path]); }
}
