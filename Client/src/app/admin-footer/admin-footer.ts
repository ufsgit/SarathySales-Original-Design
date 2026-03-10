import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  template: `
<footer class="admin-footer">
    <div class="footer-bottom">
        <p>&copy; 2024 Sarathy Sales. All rights reserved.</p>
        <p>In association with UFS Software Solutions</p>
    </div>
</footer>
  `,
  styles: [`
    .admin-footer {
        background: #fff;
        padding: 15px 0;
        border-top: 1px solid #dee2e6;
        margin-top: auto;
    }

    .footer-bottom {
        text-align: center;
        color: #777;
        font-size: 13px;
    }

    .footer-bottom p {
        margin: 2px 0;
    }
  `]
})
export class AdminFooter {}
