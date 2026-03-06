import { Component } from '@angular/core';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-report-stock-splitup',
    standalone: true,
    imports: [UserNav, UserFooter, RouterLink],
    templateUrl: './report-stock-splitup.html',
    styleUrl: './report-stock-splitup.css',
})
export class ReportStockSplitup {

}
