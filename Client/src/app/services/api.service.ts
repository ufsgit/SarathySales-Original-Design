import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

import { environment } from '../../environments/environment';

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    user?: any;
    total?: number;
    page?: number;
    limit?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly BASE_URL = environment.apiUrl;

    constructor(private http: HttpClient) { }

    private addTokenToUrl(url: string): string {
        const token = this.getToken();
        if (!token) return url;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}token=${token}`;
    }

    private handleError(err: any): Observable<never> {
        return throwError(() => err);
    }

    // ─── Auth ─────────────────────────────────────────
    // ────────────────────────────

    login(username: string, password: string): Observable<ApiResponse> {
        console.log(`Login frontend: ${username}`);
        return this.http.post<ApiResponse>(`${this.BASE_URL}/auth/login`, { username, password })
            .pipe(
                tap(res => {
                    console.log('Full Backend Response:', JSON.stringify(res));
                    const data = res.data || res;
                    const token = data.token;

                    if (res.success && token) {
                        localStorage.setItem('sarathy_token', token);
                        console.log('Saved to localStorage: sarathy_token');
                    }
                }),
                catchError(err => this.handleError(err))
            );
    }

    changePassword(loginId: number, oldPassword: string, newPassword: string): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/auth/change-password`,
            { loginId, oldPassword, newPassword }
        ).pipe(catchError(err => this.handleError(err)));
    }

    logout(): void {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sarathy_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.removeItem('sarathy_user'); // Just in case it doesn't have the underscore suffix
    }

    getCurrentUser(): any {
        const token = this.getToken();
        if (!token) return null;
        try {
            return jwtDecode(token);
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    }

    getToken(): string | null {
        return localStorage.getItem('sarathy_token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    // ─── Branch ──────────────────────────────────────────────────────────────────

    getBranches(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/branch/list`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listBranches(): Observable<ApiResponse> {
        return this.getBranches();
    }

    // ─── Customer ─────────────────────────────────────────────────────────────────

    searchCustomer(query: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/customer/search?query=${encodeURIComponent(query)}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listCustomers(page = 1, limit = 50, search = ''): Observable<ApiResponse> {
        const params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/customer/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    addCustomer(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/customer/add`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    checkChassisUnique(chassisNo: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/customer/check-chassis?chassisNo=${encodeURIComponent(chassisNo)}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    checkEngineUnique(engineNo: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/customer/check-engine?engineNo=${encodeURIComponent(engineNo)}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    // ─── Money Receipt ─────────────────────────────────────────────────────────────

    getMoneyReceiptNextNo(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/money-receipt/next-no${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listMoneyReceipts(page = 1, limit = 25, search = '', branchId?: string): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        if (branchId) params = params.set('branchId', branchId);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/money-receipt/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    saveMoneyReceipt(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/money-receipt/save`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getMoneyReceipt(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/money-receipt/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateMoneyReceipt(id: number, data: any): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/money-receipt/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    // ─── Pay Slip ─────────────────────────────────────────────────────────────────

    getPaySlipNextNo(branchId?: string, branchName?: string): Observable<ApiResponse> {
        const params: string[] = [];
        if (branchId) params.push(`branchId=${encodeURIComponent(branchId)}`);
        if (branchName) params.push(`branchName=${encodeURIComponent(branchName)}`);
        const q = params.length ? `?${params.join('&')}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/pay-slip/next-no${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getAdvisers(branchName?: string): Observable<ApiResponse> {
        const q = branchName ? `?branchName=${encodeURIComponent(branchName)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/pay-slip/advisers${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getPaySlipFormData(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/pay-slip/form-data${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listPaySlips(page = 1, limit = 25, search = '', branchId?: string): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        if (branchId) params = params.set('branchId', branchId);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/pay-slip/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    savePaySlip(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/pay-slip/save`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    updatePaySlip(id: number, data: any): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/pay-slip/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getPaySlip(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/pay-slip/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getPaySlipNumbers(): Observable<ApiResponse<string[]>> {
        const user = this.getCurrentUser();
        const branchId = user?.branch_id ? String(user.branch_id) : undefined;
        return this.listPaySlips(1, 5000, '', branchId).pipe(
            map((res: any) => ({
                success: !!res?.success,
                data: Array.isArray(res?.data)
                    ? res.data.map((r: any) => (r.pay_slip_no || '').toString().trim()).filter((v: string) => !!v)
                    : []
            })),
            catchError(err => this.handleError(err))
        );
    }

    getPaySlipByNo(paySlipNo: string): Observable<ApiResponse> {
        const no = (paySlipNo || '').toString().trim();
        if (!no) return of({ success: false, message: 'Pay slip number required' });

        const user = this.getCurrentUser();
        const branchId = user?.branch_id ? String(user.branch_id) : undefined;

        return this.listPaySlips(1, 200, no, branchId).pipe(
            switchMap((res: any) => {
                const list = Array.isArray(res?.data) ? res.data : [];
                const row = list.find((r: any) => (r.pay_slip_no || '').toString().trim() === no);
                if (!row?.payslip_id) return of({ success: false, message: 'Pay slip not found' });
                return this.getPaySlip(Number(row.payslip_id));
            }),
            catchError(err => this.handleError(err))
        );
    }

    getInsuranceCompanies(): Observable<ApiResponse> {
        const user = this.getCurrentUser();
        const branchId = user?.branch_id ? String(user.branch_id) : undefined;
        return this.getPaySlipFormData(branchId).pipe(
            map((res: any) => {
                const opts = Array.isArray(res?.data?.financeOptions) ? res.data.financeOptions : [];
                const data = opts
                    .map((name: any) => (name || '').toString().trim())
                    .filter((name: string) => !!name && name.toLowerCase() !== 'by cash')
                    .map((name: string) => ({ icompany_name: name }));
                return { success: !!res?.success, data };
            }),
            catchError(err => this.handleError(err))
        );
    }

    getPaySlipPdfUrl(no: string | number): string {
        return `${this.BASE_URL}/pay-slip/pdf-by-no/${no}`;
    }

    // ─── Gate Pass ─────────────────────────────────────────────────────────────────

    getGatePassNextNo(branchId?: string, branchName?: string): Observable<ApiResponse> {
        const params: string[] = [];
        if (branchId) params.push(`branchId=${encodeURIComponent(branchId)}`);
        if (branchName) params.push(`branchName=${encodeURIComponent(branchName)}`);
        const q = params.length ? `?${params.join('&')}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/gate-pass/next-no${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listGatePasses(page = 1, limit = 25, search = '', branchId?: string): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        if (branchId) params = params.set('branchId', branchId);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/gate-pass/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    saveGatePass(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/gate-pass/save`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getGatePass(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/gate-pass/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getGatePassInvoices(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/gate-pass/invoices${q}`).pipe(
            catchError(err => this.handleError(err))
        );
    }

    getGatePassInvoiceDetails(invoiceNo: string, branchId?: string): Observable<ApiResponse> {
        const no = (invoiceNo || '').toString().trim();
        if (!no) return of({ success: false, message: 'Invoice number required' });
        let q = `?invoiceNo=${encodeURIComponent(no)}`;
        if (branchId) q += `&branchId=${encodeURIComponent(branchId)}`;
        return this.http.get<ApiResponse>(`${this.BASE_URL}/gate-pass/invoice-details${q}`).pipe(
            catchError(err => this.handleError(err))
        );
    }

    // ─── Sales Invoice ────────────────────────────────────────────────────────────

    getSalesInvoiceNextNo(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/sales-invoice/next-no${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getAllLabourCodes(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/sales-invoice/labour-codes`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getPurchaseProductOptions(): Observable<ApiResponse> {
        return forkJoin({
            products: this.getAllLabourCodes(),
            colors: this.http.get<ApiResponse>(`${this.BASE_URL}/purchase-invoice/model-colors`)
        }).pipe(
            map(({ products, colors }: any) => {
                const rows = Array.isArray(products?.data) ? products.data : [];
                const colorRows = Array.isArray(colors?.data) ? colors.data : [];
                const mappedColors = colorRows.map((c: any) => ({
                    colorCode: (c.mod_code || '').toString().trim(),
                    colorName: (c.mod_name || '').toString().trim()
                })).filter((c: any) => c.colorCode || c.colorName);

                const data = rows.map((r: any) => ({
                    productId: Number(r.labour_id) || 0,
                    prodCode: (r.labour_code || '').toString().trim(),
                    description: (r.labour_title || '').toString().trim(),
                    salePrice: Number(r.sale_price) || 0,
                    colors: mappedColors
                }));
                return { success: !!products?.success, data };
            }),
            catchError(err => this.handleError(err))
        );
    }

    getSalesInvoiceExecutives(branchName?: string): Observable<ApiResponse> {
        const q = branchName ? `?branchName=${encodeURIComponent(branchName)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/sales-invoice/executives${q}`).pipe(
            map((res: any) => {
                const rows = Array.isArray(res?.data) ? res.data : [];
                const data = rows.map((r: any) => ({
                    ...r,
                    e_first_name: (r.e_first_name || r.name || '').toString().trim(),
                    e_code: (r.e_code || r.emp_id || '').toString().trim()
                }));
                return { success: !!res?.success, data };
            }),
            catchError(err => this.handleError(err))
        );
    }

    getSalesInvoiceHypothecationOptions(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/sales-invoice/hypothecation-options`).pipe(
            catchError(err => this.handleError(err))
        );
    }

    getSalesInvoiceChassisRecords(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/sales-invoice/chassis-records${q}`).pipe(
            catchError(() =>
                this.listSalesInvoices(1, 5000, '', branchId).pipe(
                    map((res: any) => ({
                        success: !!res?.success,
                        data: Array.isArray(res?.data)
                            ? res.data.filter((r: any) => (r?.inv_chassis || '').toString().trim() !== '')
                            : []
                    }))
                )
            ),
            catchError(err => this.handleError(err))
        );
    }

    listSalesInvoices(page = 1, limit = 25, search = '', branchId?: string): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        if (branchId) params = params.set('branchId', branchId);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/sales-invoice/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    saveSalesInvoice(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/sales-invoice/save`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateSalesInvoice(id: string | number, data: any): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/sales-invoice/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getSalesInvoice(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/sales-invoice/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getSalesPdfUrl(no: string | number): string {
        return `${this.BASE_URL}/sales-invoice/pdf-by-no/${no}`;
    }

    getSalesLetterPdfUrl(no: string | number): string {
        return `${this.BASE_URL}/sales-invoice/pdf-by-no/sales-letter/${no}`;
    }

    getSalesStickerPdfUrl(no: string | number): string {
        return `${this.BASE_URL}/sales-invoice/pdf-by-no/sticker/${no}`;
    }

    getSalesRtoBillPdfUrl(no: string | number): string {
        return `${this.BASE_URL}/sales-invoice/pdf-by-no/rto-bill/${no}`;
    }

    // ─── Proforma Invoice ─────────────────────────────────────────────────────────

    getProformaExecutives(branchName?: string): Observable<ApiResponse> {
        const q = branchName ? `?branchName=${encodeURIComponent(branchName)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/proforma/executives${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }
    getProformaNextNo(branchId?: string, branchName?: string): Observable<ApiResponse> {
        const params: string[] = [];
        if (branchId) params.push(`branchId=${encodeURIComponent(branchId)}`);
        if (branchName) params.push(`branchName=${encodeURIComponent(branchName)}`);
        const q = params.length ? `?${params.join('&')}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/proforma/next-no${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }
    listProformas(page = 1, limit = 25, search = '', branchId?: string): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        if (branchId) params = params.set('branchId', branchId);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/proforma/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    saveProforma(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/proforma/save`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getProforma(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/proforma/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateProforma(id: number, data: any): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/proforma/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getProformaPdfUrl(no: string | number): string {
        return `${this.BASE_URL}/proforma/pdf-by-no/${no}`;
    }

    getProformaChassisRecords(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/invoice-from-proforma/chassis-records${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    // ─── Purchase Invoice ─────────────────────────────────────────────────────────

    listPurchaseInvoices(page = 1, limit = 25, search = '', branchId?: string): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        if (branchId) params = params.set('branchId', branchId);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/purchase-invoice/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getPurchaseInvoice(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/purchase-invoice/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    savePurchaseInvoice(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/purchase-invoice/save`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getPurchasePdfUrl(no: string | number): string {
        return `${this.BASE_URL}/purchase-invoice/pdf-by-no/${no}`;
    }

    // ─── Purchase Upload ──────────────────────────────────────────────────────────

    uploadPurchaseExcel(file: File, branchId: string): Observable<ApiResponse> {
        const formData = new FormData();
        formData.append('excelFile', file);
        formData.append('branchId', branchId);
        return this.http.post<ApiResponse>(`${this.BASE_URL}/purchase-upload/upload`, formData)
            .pipe(catchError(err => this.handleError(err)));
    }

    // ─── Branch Transfer ──────────────────────────────────────────────────────────

    getBranchTransferNextNo(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/branch-transfer/next-no${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listBranchTransfers(page = 1, limit = 25, search = '', branchId?: string): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        if (branchId) params = params.set('branchId', branchId);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/branch-transfer/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    saveBranchTransfer(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/branch-transfer/save`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getAvailableStockForTransfer(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/branch-transfer/available-stock${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getBranchTransferInstitutionName(institutionId: number | string, branchId?: string): Observable<ApiResponse> {
        const id = encodeURIComponent((institutionId ?? '').toString());
        const b = branchId ? `&branchId=${encodeURIComponent(branchId)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/branch-transfer/institution-name?institutionId=${id}${b}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getBranchTransferPdfUrl(no: string | number): string {
        return `${this.BASE_URL}/branch-transfer/pdf-by-no/${no}`;
    }

    // ─── VSI ──────────────────────────────────────────────────────────────────────

    getVsiNextNo(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/vsi/next-no${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listVsi(page = 1, limit = 25, search = '', branchId?: string): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
        if (branchId) params = params.set('branchId', branchId);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/vsi/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    saveVsi(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/vsi/save`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    getVsi(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/vsi/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    // ─── Stock ────────────────────────────────────────────────────────────────────

    getStock(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/stock/list${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getAvailableVehicles(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/stock/available${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    // ─── Reports ──────────────────────────────────────────────────────────────────

    getSalesReport(branchId?: string, from?: string, to?: string, page = 1, limit = 25, vehicleCode?: string | string[]): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        if (vehicleCode) {
            const codeStr = Array.isArray(vehicleCode) ? vehicleCode.join(',') : vehicleCode;
            if (codeStr) params = params.set('vehicleCode', codeStr);
        }
        return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/sales`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getPurchaseReport(branchId?: string, from?: string, to?: string, page = 1, limit = 25, vehicleCode?: string | string[]): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        if (vehicleCode) {
            const codeStr = Array.isArray(vehicleCode) ? vehicleCode.join(',') : vehicleCode;
            if (codeStr) params = params.set('vehicleCode', codeStr);
        }
        return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/purchase`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getMoneyReceiptReport(branchId?: string, from?: string, to?: string, page = 1, limit = 25): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/money-receipt`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getPayslipReport(branchId?: string, from?: string, to?: string, page = 1, limit = 25): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/pay-slip`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getBranchTransferReport(branchId?: string, from?: string, to?: string, page = 1, limit = 25): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/branch-transfer`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getProformaReport(branchId?: string, from?: string, to?: string, status?: string, page = 1, limit = 25): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/proforma`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getSalesExcelUrl(branchId?: string, from?: string, to?: string, vehicleCode?: string | string[]): string {
        let q = `?from=${from}&to=${to}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (vehicleCode) {
            const codeStr = Array.isArray(vehicleCode) ? vehicleCode.join(',') : vehicleCode;
            if (codeStr) q += `&vehicleCode=${codeStr}`;
        }
        return this.addTokenToUrl(`${this.BASE_URL}/reports/sales/excel${q}`);
    }

    getSalesPagedExcelUrl(branchId?: string, from?: string, to?: string, vehicleCode?: string | string[], page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (vehicleCode) {
            const codeStr = Array.isArray(vehicleCode) ? vehicleCode.join(',') : vehicleCode;
            if (codeStr) q += `&vehicleCode=${codeStr}`;
        }
        return this.addTokenToUrl(`${this.BASE_URL}/reports/sales/paged-excel${q}`);
    }

    getSalesPagedCsvUrl(branchId?: string, from?: string, to?: string, vehicleCode?: string | string[], page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (vehicleCode) {
            const codeStr = Array.isArray(vehicleCode) ? vehicleCode.join(',') : vehicleCode;
            if (codeStr) q += `&vehicleCode=${codeStr}`;
        }
        return this.addTokenToUrl(`${this.BASE_URL}/reports/sales/paged-csv${q}`);
    }

    getPurchaseExcelUrl(branchId?: string, from?: string, to?: string, vehicleCode?: string | string[]): string {
        let q = `?from=${from}&to=${to}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (vehicleCode) {
            const codeStr = Array.isArray(vehicleCode) ? vehicleCode.join(',') : vehicleCode;
            if (codeStr) q += `&vehicleCode=${codeStr}`;
        }
        return this.addTokenToUrl(`${this.BASE_URL}/reports/purchase/excel${q}`);
    }

    getPurchasePagedExcelUrl(branchId?: string, from?: string, to?: string, vehicleCode?: string | string[], page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (vehicleCode) {
            const codeStr = Array.isArray(vehicleCode) ? vehicleCode.join(',') : vehicleCode;
            if (codeStr) q += `&vehicleCode=${codeStr}`;
        }
        return this.addTokenToUrl(`${this.BASE_URL}/reports/purchase/paged-excel${q}`);
    }

    getPurchasePagedCsvUrl(branchId?: string, from?: string, to?: string, vehicleCode?: string | string[], page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (vehicleCode) {
            const codeStr = Array.isArray(vehicleCode) ? vehicleCode.join(',') : vehicleCode;
            if (codeStr) q += `&vehicleCode=${codeStr}`;
        }
        return this.addTokenToUrl(`${this.BASE_URL}/reports/purchase/paged-csv${q}`);
    }

    getPayslipExcelUrl(branchId?: string, from?: string, to?: string): string {
        let q = `?from=${from}&to=${to}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/payslip/excel${q}`);
    }

    getPayslipPagedExcelUrl(branchId?: string, from?: string, to?: string, page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/payslip/paged-excel${q}`);
    }

    getPayslipPagedCsvUrl(branchId?: string, from?: string, to?: string, page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/payslip/paged-csv${q}`);
    }

    getMoneyReceiptExcelUrl(branchId?: string, from?: string, to?: string): string {
        let q = `?from=${from}&to=${to}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/money-receipt/excel${q}`);
    }

    getMoneyReceiptPagedExcelUrl(branchId?: string, from?: string, to?: string, page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/money-receipt/paged-excel${q}`);
    }

    getMoneyReceiptPagedCsvUrl(branchId?: string, from?: string, to?: string, page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/money-receipt/paged-csv${q}`);
    }

    getBranchTransferExcelUrl(branchId?: string, from?: string, to?: string): string {
        let q = `?from=${from}&to=${to}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/branch-transfer/excel${q}`);
    }

    getBranchTransferPagedExcelUrl(branchId?: string, from?: string, to?: string, page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/branch-transfer/paged-excel${q}`);
    }

    getBranchTransferPagedCsvUrl(branchId?: string, from?: string, to?: string, page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/branch-transfer/paged-csv${q}`);
    }

    getProformaExcelUrl(branchId?: string, from?: string, to?: string, status?: string): string {
        let q = `?from=${from}&to=${to}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (status) q += `&status=${status}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/proforma/excel${q}`);
    }

    getProformaPagedExcelUrl(branchId?: string, from?: string, to?: string, status?: string, page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (status) q += `&status=${status}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/proforma/paged-excel${q}`);
    }

    getProformaPagedCsvUrl(branchId?: string, from?: string, to?: string, status?: string, page = 1, limit = 25): string {
        let q = `?from=${from}&to=${to}&page=${page}&limit=${limit}`;
        if (branchId) q += `&branchId=${branchId}`;
        if (status) q += `&status=${status}`;
        return this.addTokenToUrl(`${this.BASE_URL}/reports/proforma/paged-csv${q}`);
    }

    getVsiReport(branchId?: string, from?: string, to?: string, page = 1, limit = 25): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/vsi`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getStockVerification(branchId?: string, from?: string, to?: string, page = 1, limit = 25): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/stock/report/verification`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getStockSplitup(branchId?: string, from?: string, to?: string, page = 1, limit = 25): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId) params = params.set('branchId', branchId);
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/stock/report/splitup`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    // ─── Vehicle Enquiry ──────────────────────────────────────────────────────────

    searchVehicles(query: string, branchId?: string): Observable<ApiResponse> {
        let q = `?query=${encodeURIComponent(query)}`;
        if (branchId) q += `&branchId=${branchId}`;
        return this.http.get<ApiResponse>(`${this.BASE_URL}/vehicle-enquiry/search${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getVehicleByChassis(chassisNo: string, branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/vehicle-enquiry/chassis/${encodeURIComponent(chassisNo)}${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listChassis(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/vehicle-enquiry/chassis-list${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getVehicleStickerUrl(chassisNo: string): string {
        return `${this.BASE_URL}/vehicle-enquiry/pdf/sticker/${chassisNo}`;
    }

    getVehicleSaleLetterUrl(chassisNo: string): string {
        return `${this.BASE_URL}/vehicle-enquiry/pdf/sale-letter/${chassisNo}`;
    }

    getVehicleEnquiryPrintUrl(chassisNo: string): string {
        return `${this.BASE_URL}/vehicle-enquiry/pdf/print-enquiry/${chassisNo}`;
    }

    // ─── Invoice From Proforma ──────────────────────────────────────────────────────────

    getInvoiceFromProformaExecutives(branchName?: string): Observable<ApiResponse> {
        const q = branchName ? `?branchName=${encodeURIComponent(branchName)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/invoice-from-proforma/executives${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getNextInvoiceFromProformaNumber(branchId: string) {
        return this.http.get<any>(
            `${this.BASE_URL}/invoice-from-proforma/next-number?branchId=${branchId}`
        );
    }
    // ─── Admin Masters ────────────────────────────────────────────────────────────

    listEmployees(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/admin/employees/list`)
            .pipe(catchError(err => this.handleError(err)));
    }

    addEmployee(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/admin/employees/add`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateEmployee(id: string | number, data: any): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/admin/employees/edit/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    deleteEmployee(id: string | number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.BASE_URL}/admin/employees/delete/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listProducts(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/admin/products/list`)
            .pipe(catchError(err => this.handleError(err)));
    }

    addProductMaster(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/admin/products/add`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    listHypothecations(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/admin/hypothecations/list`)
            .pipe(catchError(err => this.handleError(err)));
    }

    addHypothecationMaster(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/admin/hypothecations/add`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    addColorMaster(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/admin/colors/add`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateColorMaster(id: string | number, data: any): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/admin/colors/edit/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    deleteColorMaster(id: string | number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.BASE_URL}/admin/colors/delete/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listColors(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/admin/colors/list`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listCompanies(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/admin/companies/list`)
            .pipe(catchError(err => this.handleError(err)));
    }

    addCompanyMaster(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/admin/companies/add`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateCompanyMaster(id: string | number, data: any): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/admin/companies/edit/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    deleteCompanyMaster(id: string | number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.BASE_URL}/admin/companies/delete/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listInstitutions(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/admin/institutions/list`)
            .pipe(catchError(err => this.handleError(err)));
    }

    addInstitutionMaster(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/admin/institutions/add`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateInstitutionMaster(id: string | number, data: any): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/admin/institutions/edit/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    deleteInstitutionMaster(id: string | number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.BASE_URL}/admin/institutions/delete/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listDesignations(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/admin/designations/list`)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateStock(data: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/stock/update`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    listStocks(branchId?: string): Observable<ApiResponse> {
        const q = branchId ? `?branchId=${branchId}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/stock/list${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    deleteStock(id: string | number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.BASE_URL}/stock/delete/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getSalesReturnReport(branchId?: string, page = 1, limit = 10, searchTerm = ''): Observable<ApiResponse> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (branchId && branchId !== 'All Branches') params = params.set('branchId', branchId);
        if (searchTerm) params = params.set('searchTerm', searchTerm);
        return this.http.get<ApiResponse>(`${this.BASE_URL}/sales-return/list`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }
}

