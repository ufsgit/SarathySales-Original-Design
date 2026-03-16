import { Routes } from '@angular/router';
import { UserHome } from './user-home/user-home';
import { LoginComponent } from './login/login';
import { authGuard } from './guards/auth.guard';
import { PreviousMoneyReceipt } from './previous-money-receipt/previous-money-receipt';

import { PreviousPaySlip } from './previous-pay-slip/previous-pay-slip';
import { PreviousGatePass } from './previous-gate-pass/previous-gate-pass';
import { PreviousProformaInvoice } from './previous-proforma-invoice/previous-proforma-invoice';
import { EditProformaInvoiceComponent } from './edit-proforma-invoice/edit-proforma-invoice';
import { InvoiceFromProformaComponent } from './invoice-from-proforma/invoice-from-proforma';
import { PreviousPurchaseInvoice } from './previous-purchase-invoice/previous-purchase-invoice';
import { PreviousSalesInvoice } from './previous-sales-invoice/previous-sales-invoice';
import { PreviousBranchTransfer } from './previous-branch-transfer/previous-branch-transfer';
import { ReportsProformaInvoice } from './reports-proforma-invoice/reports-proforma-invoice';
import { ReportsStockVerification } from './reports-stock-verification/reports-stock-verification';
import { ReportStockSplitup } from './report-stock-splitup/report-stock-splitup';
import { ReportPurchaseReport } from './report-purchase-report/report-purchase-report';
import { ReportSalesReport } from './report-sales-report/report-sales-report';
import { ReportsPayslip } from './reports-payslip/reports-payslip';
import { ReportsMoneyReceipt } from './reports-money-receipt/reports-money-receipt';
import { ReportBranchTransfer } from './report-branch-transfer/report-branch-transfer';
import { MyProfileChangePassword } from './myprofile-changepassword/myprofile-changepassword';

import { BranchTransferComponent } from './branch-transfer/branch-transfer';
import { GatePassComponent } from './gate-pass/gate-pass';
import { MoneyReceiptComponent } from './money-receipt/money-receipt';
import { PaySlipComponent } from './pay-slip/pay-slip';
import { ProformaInvoiceComponent } from './proforma-invoice/proforma-invoice';
import { PurchaseInvoiceComponent } from './purchase-invoice/purchase-invoice';
import { PurchaseUploadComponent } from './purchase-upload/purchase-upload';
import { SalesInvoiceComponent } from './sales-invoice/sales-invoice';
import { VehicleEnquiryComponent } from './vehicle-enquiry/vehicle-enquiry';

import { VsiInvoiceComponent } from './vsi-invoice/vsi-invoice';
import { VsiListComponent } from './vsi-list/vsi-list';
import { VsiReportComponent } from './vsi-report/vsi-report';

import { AdminHome } from './admin-home/admin-home';
import { AdminEmpolyee } from './admin-empolyee/admin-empolyee';
import { AdminProductmasterlist } from './admin-productmasterlist/admin-productmasterlist';
import { AdminCompanymaster } from './admin-companymaster/admin-companymaster';
import { AdminCompanymasterlist } from './admin-companymaster/admin-companymasterlist';
import { AdminInstitutionmaster } from './admin-institutionmaster/admin-institutionmaster';
import { AdminInstitutionmasterlist } from './admin-institutionmaster/admin-institutionmasterlist';
import { AdminProductmaster } from './admin-productmaster/admin-productmaster';
import { AdminHypothicationmaster } from './admin-hypothicationmaster/admin-hypothicationmaster';
import { AdminHypothicationmasterlist } from './admin-hypothicationmasterlist/admin-hypothicationmasterlist';
import { AdminColor } from './admin-color/admin-color';
import { AdminColorlist } from './admin-colorlist/admin-colorlist';
import { AdminStock } from './admin-stock/admin-stock';
import { AdminStocklist } from './admin-stocklist/admin-stocklist';
import { AdminEmpolyeelist } from './admin-empolyee/admin-empolyeelist';


export const routes: Routes = [
    { path: 'admin-home', component: AdminHome, canActivate: [authGuard] },

    { path: 'admin-empolyee', component: AdminEmpolyee, canActivate: [authGuard] },
    { path: 'admin-empolyeelist', component: AdminEmpolyeelist, canActivate: [authGuard] },
    { path: 'admin-productmasterlist', component: AdminProductmasterlist, canActivate: [authGuard] },
    { path: 'admin-companymaster', component: AdminCompanymaster, canActivate: [authGuard] },
    { path: 'admin-companymasterlist', component: AdminCompanymasterlist, canActivate: [authGuard] },
    { path: 'admin-institutionmaster', component: AdminInstitutionmaster, canActivate: [authGuard] },
    { path: 'admin-institutionmasterlist', component: AdminInstitutionmasterlist, canActivate: [authGuard] },
    { path: 'admin-productmaster', component: AdminProductmaster, canActivate: [authGuard] },
    { path: 'admin-hypothicationmaster', component: AdminHypothicationmaster, canActivate: [authGuard] },
    { path: 'admin-hypothicationmasterlist', component: AdminHypothicationmasterlist, canActivate: [authGuard] },
    { path: 'admin-color', component: AdminColor, canActivate: [authGuard] },
    { path: 'admin-colorlist', component: AdminColorlist, canActivate: [authGuard] },
    { path: 'admin-stock', component: AdminStock, canActivate: [authGuard] },
    { path: 'admin-stocklist', component: AdminStocklist, canActivate: [authGuard] },
    { path: 'previous-money-receipt', component: PreviousMoneyReceipt, canActivate: [authGuard] },
    { path: 'previous-pay-slip', component: PreviousPaySlip, canActivate: [authGuard] },
    { path: 'previous-gate-pass', component: PreviousGatePass, canActivate: [authGuard] },
    { path: 'previous-proforma-invoice', component: PreviousProformaInvoice, canActivate: [authGuard] },
    { path: 'edit-proforma-invoice/:id', component: EditProformaInvoiceComponent, canActivate: [authGuard] },
    { path: 'invoice-from-proforma/:id', component: InvoiceFromProformaComponent, canActivate: [authGuard] },
    { path: 'previous-purchase-invoice', component: PreviousPurchaseInvoice, canActivate: [authGuard] },
    { path: 'previous-sales-invoice', component: PreviousSalesInvoice, canActivate: [authGuard] },
    { path: 'previous-branch-transfer', component: PreviousBranchTransfer, canActivate: [authGuard] },
    { path: 'reports-proforma-invoice', component: ReportsProformaInvoice, canActivate: [authGuard] },
    { path: 'reports-stock-verification', component: ReportsStockVerification, canActivate: [authGuard] },
    { path: 'report-stock-splitup', component: ReportStockSplitup, canActivate: [authGuard] },
    { path: 'report-purchase-report', component: ReportPurchaseReport, canActivate: [authGuard] },
    { path: 'report-sales-report', component: ReportSalesReport, canActivate: [authGuard] },
    { path: 'reports-payslip', component: ReportsPayslip, canActivate: [authGuard] },
    { path: 'reports-money-receipt', component: ReportsMoneyReceipt, canActivate: [authGuard] },
    { path: 'report-branch-transfer', component: ReportBranchTransfer, canActivate: [authGuard] },
    { path: 'myprofile-changepassword', component: MyProfileChangePassword, canActivate: [authGuard] },
    { path: 'branch-transfer', component: BranchTransferComponent, canActivate: [authGuard] },
    { path: 'gate-pass', component: GatePassComponent, canActivate: [authGuard] },
    { path: 'money-receipt', component: MoneyReceiptComponent, canActivate: [authGuard] },
    { path: 'pay-slip', component: PaySlipComponent, canActivate: [authGuard] },
    { path: 'proforma-invoice', component: ProformaInvoiceComponent, canActivate: [authGuard] },
    { path: 'purchase-invoice', component: PurchaseInvoiceComponent, canActivate: [authGuard] },
    { path: 'purchase-upload', component: PurchaseUploadComponent, canActivate: [authGuard] },
    { path: 'sales-invoice', component: SalesInvoiceComponent, canActivate: [authGuard] },
    { path: 'vehicle-enquiry', component: VehicleEnquiryComponent, canActivate: [authGuard] },
    { path: 'vsi-invoice', component: VsiInvoiceComponent, canActivate: [authGuard] },
    { path: 'vsi-list', component: VsiListComponent, canActivate: [authGuard] },
    { path: 'vsi-report', component: VsiReportComponent, canActivate: [authGuard] },
    { path: 'admin-sales-returns', loadComponent: () => import('./admin-sales-returns/admin-sales-returns').then(m => m.AdminSalesReturnsComponent), canActivate: [authGuard] },
    { path: 'admin-edit-sale-invoice/:id', loadComponent: () => import('./admin-edit-sale-invoice/admin-edit-sale-invoice').then(m => m.AdminEditSaleInvoiceComponent), canActivate: [authGuard] },
    { path: 'user-home', component: UserHome, canActivate: [authGuard] },

    { path: 'admin-findvehicle', component: VehicleEnquiryComponent, canActivate: [authGuard] },
    { path: '', component: LoginComponent },
];