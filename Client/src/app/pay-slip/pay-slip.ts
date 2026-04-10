import { Component, OnInit, AfterViewInit, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';
import { UppercaseDirective } from '../uppercase.directive';


@Component({
    selector: 'app-pay-slip',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter, UppercaseDirective],
    templateUrl: './pay-slip.html',
    styleUrls: ['./pay-slip.css']
})
export class PaySlipComponent implements OnInit, AfterViewInit {
    // ── State Signals ──────────────────────────────────────────
    branchName = signal('SARATHY KOLLAM KTM');
    branchId = signal('');
    isAdmin = signal(false);
    branches = signal<any[]>([]);
    branchSearchTerm = signal('');
    isBranchDropdownOpen = signal(false);

    @ViewChild('branchDropdownRef') branchDropdownRef!: ElementRef;
    @ViewChild('branchSearchInput') branchSearchInput!: ElementRef;
    @ViewChild('executiveDropdownRef') executiveDropdownRef!: ElementRef;
    @ViewChild('executiveSearchInput') executiveSearchInput!: ElementRef;
    @ViewChild('financeDropdownRef') financeDropdownRef!: ElementRef;
    @ViewChild('financeSearchInput') financeSearchInput!: ElementRef;

    searchableBranchList = computed(() => {
        const term = this.branchSearchTerm().toLowerCase();
        return this.branches().filter(b =>
            (b.branch_name || '').toLowerCase().includes(term) ||
            (b.b_id || '').toString().toLowerCase().includes(term)
        );
    });

    executiveSearchTerm = signal('');
    isExecutiveDropdownOpen = signal(false);
    searchableAdviserList = computed(() => {
        const term = this.executiveSearchTerm().toLowerCase();
        return this.advisers().filter(a =>
            (a.e_first_name || '').toLowerCase().includes(term) ||
            (a.emp_id || '').toString().toLowerCase().includes(term)
        );
    });

    financeSearchTerm = signal('');
    isFinanceDropdownOpen = signal(false);
    searchableFinanceList = computed(() => {
        const term = this.financeSearchTerm().toLowerCase();
        const base = this.insuranceCompanies().map(f => ({ name: f.icompany_name }));
        const list = [{ name: 'By Cash' }, ...base];
        return list.filter(f => f.name.toLowerCase().includes(term));
    });

    paySlipNo = signal('');
    slipNumbers = signal<string[]>([]);
    paySlipDate = signal('');
    customerName = signal('');
    vehicleName = signal('');
    adviserId = signal<any>(null);
    adviserName = signal('');
    remarks = signal('');
    financeCash = signal('');
    vehicleType = signal('');
    payStatus = signal<any>(1);

    // numeric signals left column
    vehicleAmount = signal<number>(0);
    roadTax = signal<number>(0);
    insurance = signal<number>(0);
    regnFee = signal<number>(0);
    vpCharges = signal<number>(0);
    extendedWarranty = signal<number>(0);
    serviceStamp = signal<number>(0);
    fittingsAmt = signal<number>(0);
    bflInsOthers = signal<number>(0);
    advanceEMI = signal<number>(0);
    rsaAmount = signal<number>(0);
    ownershipAmt = signal<number>(0);

    // numeric signals right column
    financeAmount = signal<number>(0);
    advanceCash = signal<number>(0);
    bankTransfer = signal<number>(0);
    swipe = signal<number>(0);
    exchange = signal<number>(0);
    discount = signal<number>(0);
    bflDiscount = signal<number>(0);
    specialDiscount = signal<number>(0);
    duesAmt = signal<number>(0);
    gpay = signal<number>(0);
    others1 = signal<number>(0);
    others2 = signal<number>(0);
    others3 = signal<number>(0);

    // ── Computed Totals ─────────────────────────────────────────
    leftTotal = computed(() => {
        return [
            this.vehicleAmount(),
            this.roadTax(),
            this.insurance(),
            this.regnFee(),
            this.vpCharges(),
            this.extendedWarranty(),
            this.serviceStamp(),
            this.fittingsAmt(),
            this.bflInsOthers(),
            this.advanceEMI(),
            this.rsaAmount(),
            this.ownershipAmt()
        ].reduce((acc, v) => acc + this.toNumber(v), 0);
    });

    rightTotal = computed(() => {
        return [
            this.financeAmount(),
            this.advanceCash(),
            this.bankTransfer(),
            this.swipe(),
            this.exchange(),
            this.discount(),
            this.bflDiscount(),
            this.specialDiscount(),
            this.duesAmt(),
            this.gpay(),
            this.others1(),
            this.others2(),
            this.others3()
        ].reduce((acc, v) => acc + this.toNumber(v), 0);
    });

    balanceAmount = computed(() => this.leftTotal() - this.rightTotal());

    advisers = signal<any[]>([]);
    labourCodes = signal<any[]>([]);
    insuranceCompanies = signal<any[]>([]);
    customers = signal<any[]>([]);

    isSaving = signal(false);
    successMessage = signal('');
    errorMessage = signal('');

    private customerSearch$ = new Subject<string>();
    currentId: number | null = null;
    private slipNoRetryDone = false;
    private initialLoadAttempts = 0;
    private readonly maxInitialLoadAttempts = 6;
    private isLoadingSlipNo = false;
    readonly todayIso = new Date().toISOString().slice(0, 10);

    constructor(private router: Router,
        private api: ApiService,
        private route: ActivatedRoute,
        private titleService: Title) { }

    navigate(path: string) { this.router.navigate([path]); }

    private toNumber(v: any): number {
        if (v === null || v === undefined) return 0;
        const n = parseFloat(String(v).replace(/,/g, '').trim());
        return Number.isFinite(n) ? n : 0;
    }

    private enforceMaxDate(): void {
        const dateInput = document.querySelector('input[name="paySlipDate"]') as HTMLInputElement | null;
        if (!dateInput) return;
        dateInput.max = this.todayIso;
        if (this.paySlipDate() && this.paySlipDate() > this.todayIso) {
            this.paySlipDate.set(this.todayIso);
            dateInput.value = this.todayIso;
        }
    }

    private isSaveConfirmed(): boolean {
        const checkbox = document.querySelector('.confirm input[type="checkbox"]') as HTMLInputElement | null;
        return !!checkbox?.checked;
    }


    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (this.branchDropdownRef && !this.branchDropdownRef.nativeElement.contains(event.target)) {
            this.isBranchDropdownOpen.set(false);
        }
        if (this.executiveDropdownRef && !this.executiveDropdownRef.nativeElement.contains(event.target)) {
            this.isExecutiveDropdownOpen.set(false);
        }
        if (this.financeDropdownRef && !this.financeDropdownRef.nativeElement.contains(event.target)) {
            this.isFinanceDropdownOpen.set(false);
        }
    }

    toggleBranchDropdown() {
        this.isBranchDropdownOpen.update(v => !v);
        if (this.isBranchDropdownOpen()) {
            this.branchSearchTerm.set('');
            setTimeout(() => this.branchSearchInput?.nativeElement.focus(), 0);
        }
    }

    onBranchSelect(branch: any) {
        console.log('[PaySlip] Branch selected:', branch);
        this.branchName.set(branch.branch_name);
        this.branchId.set(String(branch.b_id));
        this.isBranchDropdownOpen.set(false);

        // Reset relative state
        this.paySlipNo.set('');
        this.successMessage.set('');
        this.errorMessage.set('');

        // Reload data for the new branch
        this.loadSlipNo();
        this.loadAdvisers();
        this.loadFormData();
    }

    toggleExecutiveDropdown() {
        this.isExecutiveDropdownOpen.update(v => !v);
        if (this.isExecutiveDropdownOpen()) {
            this.executiveSearchTerm.set('');
            setTimeout(() => this.executiveSearchInput?.nativeElement.focus(), 0);
        }
    }

    onExecutiveSelect(adv: any) {
        this.adviserId.set(adv.emp_id);
        this.adviserName.set(adv.e_first_name || adv.name || '');
        this.isExecutiveDropdownOpen.set(false);
    }

    toggleFinanceDropdown() {
        this.isFinanceDropdownOpen.update(v => !v);
        if (this.isFinanceDropdownOpen()) {
            this.financeSearchTerm.set('');
            setTimeout(() => this.financeSearchInput?.nativeElement.focus(), 0);
        }
    }

    onFinanceSelect(f: any) {
        this.financeCash.set(f.name);
        this.isFinanceDropdownOpen.set(false);
    }

    loadBranches() {
        this.api.getBranches().subscribe({
            next: (res: any) => {
                if (res.success && Array.isArray(res.data)) {
                    this.branches.set(res.data);
                }
            }
        });
    }

    ngOnInit(): void {
        const user = this.api.getCurrentUser();
        if (user) {
            const admin = user.role == 1 || user.role_des === 'admin';
            this.isAdmin.set(admin);

            let bName = (user.branch_name || '').toString().trim();
            if (bName === 'No Branch' || !bName) {
                if (admin) {
                    bName = 'Select Branch';
                    this.branchId.set('');
                } else {
                    bName = 'SARATHY KOLLAM KTM';
                    this.branchId.set(user.branch_id ? user.branch_id.toString() : '');
                }
            } else {
                this.branchId.set(user.branch_id ? user.branch_id.toString() : '');
            }
            this.branchName.set(bName);

            if (admin) this.loadBranches();
        }
        this.paySlipDate.set(this.todayIso);
        this.loadAdvisers();
        this.loadLabourCodes();
        this.loadInsuranceCompanies();
        this.loadFormData();

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            const id = Number(idParam);
            if (!isNaN(id)) {
                this.currentId = id;
                this.titleService.setTitle('Edit Pay Slip');
                this.loadPaySlip(id);
            }
        } else {
            this.loadSlipNo();
        }
    }

    private loadInitialData(): void {
        this.loadSlipNo();
        this.loadAdvisers();
        this.loadLabourCodes();
        this.loadInsuranceCompanies();
        this.loadFormData();
    }

    ngAfterViewInit(): void {
        this.enforceMaxDate();
        setTimeout(() => this.enforceMaxDate(), 300);
    }


    loadSlipNo(): void {
        if (this.currentId) return;
        if (!this.branchId()) return;
        if (this.paySlipNo() && this.paySlipNo() !== 'Error' && this.paySlipNo() !== 'Fetching...') return;
        if (this.isLoadingSlipNo) return;

        const branchId = this.branchId();
        const branchName = this.branchName();

        this.isLoadingSlipNo = true;
        this.paySlipNo.set('Fetching...');

        this.api.getPaySlipNextNo(branchId || undefined, branchName || undefined).subscribe({
            next: (res: any) => {
                this.isLoadingSlipNo = false;
                console.log('[PaySlip] loadSlipNo response:', res);
                if (res.success && res.paySlipNo) {
                    this.paySlipNo.set(res.paySlipNo);
                } else {
                    console.error('[PaySlip] loadSlipNo failed:', res.message);
                    this.paySlipNo.set('Error');
                    this.errorMessage.set(res.message || 'Failed to fetch pay slip number');
                }
            },
            error: (err: any) => {
                this.isLoadingSlipNo = false;
                console.error('[PaySlip] loadSlipNo error:', err);
                this.paySlipNo.set('Error');
                this.errorMessage.set(err?.error?.message || 'Failed to fetch pay slip number');
            }
        });
    }

    loadFormData(): void {
        const branchId = this.branchId();
        this.api.getPaySlipFormData(branchId || undefined).subscribe({
            next: (res: any) => {
                const data = res?.data || {};

                const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
                this.labourCodes.set(vehicles.map((v: any) => ({
                    ...v,
                    labour_title: (v.stock_item_name || '').toString().trim(),
                    labour_code: (v.stock_item_code || '').toString().trim()
                })));

                const executives = Array.isArray(data.executives) ? data.executives : [];
                this.advisers.set(executives.map((a: any) => ({
                    ...a,
                    e_first_name: (a.e_first_name || a.name || '').toString().trim(),
                    name: (a.e_first_name || a.name || '').toString().trim()
                })));

                const financeOptions = Array.isArray(data.financeOptions) ? data.financeOptions : [];
                this.insuranceCompanies.set(financeOptions
                    .map((name: any) => (name || '').toString().trim())
                    .filter((name: string) => !!name && name.toLowerCase() !== 'by cash')
                    .map((name: string) => ({ icompany_name: name })));

                if (this.vehicleName()) this.onVehicleSelect();
                if (this.adviserId()) this.onAdviserChange();
            },
            error: () => {
                this.loadAdvisers();
                this.loadLabourCodes();
                this.loadInsuranceCompanies();
            }
        });
    }

    onSlipNoChange(val: string): void {
        const trimmed = (val || '').toString().trim();
        if (trimmed && this.slipNumbers().includes(trimmed)) {
            this.api.getPaySlipByNo(trimmed).subscribe({
                next: (res: any) => {
                    if (res.success && res.data) {
                        this.loadPaySlipIntoForm(res.data);
                        this.currentId = res.data.payslip_id || null;
                    }
                }
            });
        }
    }

    private loadPaySlipIntoForm(d: any): void {
        this.paySlipNo.set(d.pay_slip_no || '');
        this.paySlipDate.set(d.pay_slip_date ? new Date(d.pay_slip_date).toISOString().substr(0, 10) : '');
        this.customerName.set(d.pay_cus_name || '');
        this.vehicleName.set(d.pay_slip_reference || '');
        this.remarks.set(d.pay_remarks || '');
        this.financeCash.set(d.pay_finance || '');
        this.vehicleType.set(d.pay_vehil_type || '');
        this.payStatus.set(d.pay_status || 1);

        this.branchName.set(d.branch_name || 'Select Branch');
        this.branchId.set(String(d.pay_branch_id || ''));

        const exName = (d.pay_regn || '').toString().trim();
        this.adviserName.set(exName);
        const foundAdv = this.advisers().find(a => (a.e_first_name || a.name || '').toString().trim() === exName);
        if (foundAdv) {
            this.adviserId.set(foundAdv.emp_id);
        } else {
            this.adviserId.set(null);
        }

        if (this.labourCodes().length && this.vehicleName()) {
            this.onVehicleSelect();
        }

        this.vehicleAmount.set(this.toNumber(d.pay_vehile_amt));
        this.roadTax.set(this.toNumber(d.pay_road_tax));
        this.insurance.set(this.toNumber(d.pay_insurance));
        this.regnFee.set(this.toNumber(d.pay_regn_fee));
        this.vpCharges.set(this.toNumber(d.pay_vp_charge));
        this.extendedWarranty.set(this.toNumber(d.pay_exted_wanty));
        this.serviceStamp.set(this.toNumber(d.pay_service_chrge));
        this.fittingsAmt.set(this.toNumber(d.pay_fitting_amt));
        this.bflInsOthers.set(this.toNumber(d.pay_others) || this.toNumber(d.pay_bfl));
        this.advanceEMI.set(this.toNumber(d.pay_advan_install));
        this.rsaAmount.set(this.toNumber(d.pay_rsa_amt));
        this.ownershipAmt.set(this.toNumber(d.pay_ownership_amt));

        this.financeAmount.set(this.toNumber(d.pay_dcc));
        this.advanceCash.set(this.toNumber(d.pay_advance));
        this.bankTransfer.set(this.toNumber(d.pay_bank_transfer));
        this.swipe.set(this.toNumber(d.pay_swipe_amt));
        this.exchange.set(this.toNumber(d.pay_exchange));
        this.discount.set(this.toNumber(d.pay_discount));
        this.bflDiscount.set(this.toNumber(d.pay_bfl));
        this.specialDiscount.set(this.toNumber(d.pay_special_discnt));
        this.duesAmt.set(this.toNumber(d.pay_dues));
        this.gpay.set(this.toNumber(d.pay_gpay));
        this.others1.set(this.toNumber(d.pay_others1_amt));
        this.others2.set(this.toNumber(d.pay_others2_amt));
        this.others3.set(this.toNumber(d.pay_others3_amt));
    }

    loadAdvisers(): void {
        const branchName = (this.branchName() || '').toString().trim();
        this.api.getAdvisers(branchName || undefined).subscribe({
            next: (res: any) => {
                if (res.success) {
                    const list = (res.data || []).map((a: any) => ({
                        ...a,
                        e_first_name: (a.e_first_name || a.name || '').toString().trim(),
                        name: (a.e_first_name || a.name || '').toString().trim()
                    }));
                    this.advisers.set(list);

                    // Re-sync ID if name was already loaded from Pay Slip (Edit mode)
                    if (this.adviserName() && !this.adviserId()) {
                        const name = this.adviserName().toLowerCase();
                        const found = list.find((a: any) =>
                            (a.e_first_name || a.name || '').toString().trim().toLowerCase() === name
                        );
                        if (found) this.adviserId.set(found.emp_id);
                    }
                }
            },
            error: () => { this.advisers.set([]); }
        });
    }

    loadLabourCodes(): void {
        this.api.getAllLabourCodes().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.labourCodes.set(res.data || []);
                    if (this.vehicleName()) {
                        this.onVehicleSelect();
                    }
                }
            },
            error: () => { this.labourCodes.set([]); }
        });
    }

    loadInsuranceCompanies(): void {
        this.api.getInsuranceCompanies().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.insuranceCompanies.set(res.data || []);
                }
            },
            error: () => { this.insuranceCompanies.set([]); }
        });
    }

    onAdviserChange(): void {
        const id = this.adviserId();
        const name = this.adviserName().toString().trim().toLowerCase();

        if (id) {
            const adv = this.advisers().find(a => a.emp_id == id);
            if (adv) this.adviserName.set(adv.e_first_name || adv.name || '');
        } else if (name) {
            const found = this.advisers().find(a =>
                (a.e_first_name || a.name || '').toString().trim().toLowerCase() === name
            );
            if (found) this.adviserId.set(found.emp_id);
        }
    }

    onCustomerInput(val: string): void {
        this.customerSearch$.next(val);
    }

    onVehicleSelect(): void {
        const vn = this.vehicleName();
        const chosen = this.labourCodes().find(l => l.labour_title === vn || l.labour_code === vn);
        if (chosen) {
            this.vehicleType.set(chosen.labour_title || this.vehicleType());
        }
    }

    onVehicleInput(val: string): void {
        this.vehicleName.set(val || '');
        this.onVehicleSelect();
    }

    loadPaySlip(id: number): void {
        this.api.getPaySlip(id).subscribe({
            next: (res: any) => {
                if (res.success && res.data) {
                    this.loadPaySlipIntoForm(res.data);
                    this.currentId = id;
                }
            },
            error: (err) => { this.errorMessage.set(err?.error?.message || 'Failed to load pay slip'); }
        });
    }

    onSave(): void {
        this.enforceMaxDate();
        this.onAdviserChange();
        const branchIdForSave = this.branchId();

        const missingFields: string[] = [];
        if (!this.paySlipNo()) missingFields.push('Pay slip number');
        if (!this.paySlipDate()) missingFields.push('Date');
        if (!this.adviserId()) missingFields.push('Executive');
        if (!this.financeCash()) missingFields.push('Finance/Cash');
        if (!branchIdForSave) missingFields.push('Branch');

        if (missingFields.length) {
            this.errorMessage.set(missingFields.join(', ') + ' required.');
            alert(this.errorMessage());
            return;
        }

        if (this.paySlipDate() > this.todayIso) {
            this.errorMessage.set('Date cannot be greater than today.');
            alert(this.errorMessage());
            return;
        }

        if (!this.isSaveConfirmed()) {
            this.errorMessage.set('Please check "Are you sure want to save?" before saving.');
            alert(this.errorMessage());
            return;
        }

        this.onAdviserChange();

        this.isSaving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const payload: any = {
            paySlipNo: this.paySlipNo(),
            branchId: branchIdForSave,
            paySlipDate: this.paySlipDate(),
            customerName: this.customerName(),
            vehicleName: this.vehicleName(),
            vehicleType: this.vehicleType(),
            executiveName: this.adviserName(),
            executiveId: this.adviserId(),
            remarks: this.remarks(),
            financeType: this.financeCash(),
            vehicleAmount: this.vehicleAmount().toString(),
            roadTax: this.roadTax().toString(),
            insuranceAmount: this.insurance().toString(),
            regnFee: this.regnFee().toString(),
            vpCharges: this.vpCharges().toString(),
            extendedWarranty: this.extendedWarranty().toString(),
            serviceStampCharges: this.serviceStamp().toString(),
            fittingsAmt: this.fittingsAmt().toString(),
            bflInsOthers: this.bflInsOthers().toString(),
            advanceEmi: this.advanceEMI().toString(),
            rsaAmount: this.rsaAmount().toString(),
            ownershipAmt: this.ownershipAmt().toString(),
            financeAmount: this.financeAmount().toString(),
            advanceCash: this.advanceCash().toString(),
            bankTransfer: this.bankTransfer().toString(),
            swipe: this.swipe().toString(),
            exchange: this.exchange().toString(),
            discount: this.discount().toString(),
            bflDiscount: this.bflDiscount().toString(),
            specialDiscount: this.specialDiscount().toString(),
            duesAmt: this.duesAmt().toString(),
            gpay: this.gpay().toString(),
            others1: this.others1().toString(),
            others2: this.others2().toString(),
            others3: this.others3().toString(),
            payStatus: this.payStatus(),

            pay_finance: this.financeCash(),
            pay_slip_reference: this.vehicleName(),
            pay_regn: this.adviserName(),
            pay_regn_fee: this.regnFee().toString(),
            pay_cus_name: this.customerName(),
            pay_vehil_type: this.vehicleType(),
            pay_vehile_amt: this.vehicleAmount().toString(),
            pay_remarks: this.remarks(),
            pay_vp_charge: this.vpCharges().toString(),
            pay_insurance: this.insurance().toString(),
            pay_road_tax: this.roadTax().toString(),
            pay_dcc: this.financeAmount().toString(),
            pay_exchange: this.exchange().toString(),
            pay_discount: this.discount().toString(),
            pay_bfl: this.bflDiscount().toString(),
            pay_advance: this.advanceCash().toString(),
            pay_dues: this.duesAmt().toString(),
            pay_exted_wanty: this.extendedWarranty().toString(),
            pay_service_chrge: this.serviceStamp().toString(),
            pay_others: this.bflInsOthers().toString(),
            pay_advan_install: this.advanceEMI().toString(),
            pay_rsa_amt: this.rsaAmount().toString(),
            pay_ownership_amt: this.ownershipAmt().toString(),
            pay_bank_transfer: this.bankTransfer().toString(),
            pay_swipe_amt: this.swipe().toString(),
            pay_special_discnt: this.specialDiscount().toString(),
            pay_fitting_amt: this.fittingsAmt().toString(),
            pay_others1_amt: this.others1().toString(),
            pay_others2_amt: this.others2().toString(),
            pay_others3_amt: this.others3().toString(),
            pay_gpay: this.gpay().toString(),
            pay_add_total: this.leftTotal().toString(),
            pay_less_total: this.rightTotal().toString(),
            pay_grand_tot: (this.balanceAmount()).toString(),
            pay_status: this.payStatus(),
            adviserId: this.adviserId(),
            adviserName: this.adviserName()
        };

        const request = this.currentId
            ? this.api.updatePaySlip(this.currentId, payload)
            : this.api.savePaySlip(payload);

        request.subscribe({
            next: (res: any) => {
                this.isSaving.set(false);
                if (res.success) {
                    this.successMessage.set(this.currentId ? 'Pay slip updated' : 'Pay slip saved');
                    alert(this.successMessage());
                    this.resetForm();
                    this.navigate('/previous-pay-slip');
                    // if (this.currentId) {
                    //     this.api.getPaySlip(this.currentId).subscribe({
                    //         next: (savedRes: any) => {
                    //             if (savedRes.success && savedRes.data) {
                    //                 this.loadPaySlipIntoForm(savedRes.data);
                    //             }
                    //         }
                    //     });
                    // }
                } else {
                    this.errorMessage.set(res.message || 'Save failed');
                    alert(this.errorMessage());
                }
            },
            error: (err: any) => {
                this.isSaving.set(false);
                this.errorMessage.set(err?.error?.message || 'Server error');
                alert(this.errorMessage());
            }
        });
    }

    isEditing(): boolean {
        return this.currentId !== null;
    }

    deleteSlip(): void {
        if (!this.currentId) return;
        const confirmMsg = `Delete Pay Slip ${this.paySlipNo() || ''}?`;
        if (!window.confirm(confirmMsg)) return;
        this.isSaving.set(true);
        this.api.deletePaySlip(this.currentId).subscribe({
            next: (res) => {
                this.isSaving.set(false);
                if (res.success) {
                    alert('Pay slip deleted');
                    this.resetForm();
                    this.navigate('/previous-pay-slip');
                } else {
                    this.errorMessage.set(res.message || 'Failed to delete pay slip');
                }
            },
            error: (err) => {
                this.isSaving.set(false);
                this.errorMessage.set(err?.error?.message || 'Failed to delete pay slip');
            }
        });
    }

    resetForm(): void {
        this.currentId = null;
        this.customerName.set('');
        this.vehicleName.set('');
        this.adviserId.set(null);
        this.adviserName.set('');
        this.remarks.set('');
        this.financeCash.set('');
        this.vehicleType.set('');
        this.payStatus.set(1);

        // Reset numeric signals
        this.vehicleAmount.set(0);
        this.roadTax.set(0);
        this.insurance.set(0);
        this.regnFee.set(0);
        this.vpCharges.set(0);
        this.extendedWarranty.set(0);
        this.serviceStamp.set(0);
        this.fittingsAmt.set(0);
        this.bflInsOthers.set(0);
        this.advanceEMI.set(0);
        this.rsaAmount.set(0);
        this.ownershipAmt.set(0);

        this.financeAmount.set(0);
        this.advanceCash.set(0);
        this.bankTransfer.set(0);
        this.swipe.set(0);
        this.exchange.set(0);
        this.discount.set(0);
        this.bflDiscount.set(0);
        this.specialDiscount.set(0);
        this.duesAmt.set(0);
        this.gpay.set(0);
        this.others1.set(0);
        this.others2.set(0);
        this.others3.set(0);

        this.paySlipNo.set('');
        this.loadSlipNo();

        // Uncheck confirmation checkbox
        const checkbox = document.querySelector('.confirm input[type="checkbox"]') as HTMLInputElement | null;
        if (checkbox) checkbox.checked = false;
    }
}
