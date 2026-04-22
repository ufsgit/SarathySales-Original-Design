import { Injectable } from '@angular/core';

export interface TaxCalculationParams {
  taxableAmount: number;
  cgstPer: number;
  sgstPer: number;
  cessPer: number;
}

export interface TaxCalculationResult {
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  grandTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {

  constructor() { }

  /**
   * Calculates CGST, SGST, and CESS based on percentages.
   * Uses 2 decimal rounding for final amounts.
   */
  calculateTax(params: TaxCalculationParams): TaxCalculationResult {
    const { taxableAmount, cgstPer, sgstPer, cessPer } = params;

    const cgst = this.roundToTwo(taxableAmount * (cgstPer / 100));
    const sgst = this.roundToTwo(taxableAmount * (sgstPer / 100));
    const cess = this.roundToTwo(taxableAmount * (cessPer / 100));

    const totalTax = this.roundToTwo(cgst + sgst + cess);
    const grandTotal = this.roundToTwo(taxableAmount + totalTax);

    return { cgst, sgst, cess, totalTax, grandTotal };
  }

  /**
   * Calculates active percentages from tbl_labour_code amounts or tax slab id.
   * Uses 4 decimal precision for percentages.
   */
  calculateAutoPercentages(labourData: any, taxSlabs: any[] = []): { cgstPer: number; sgstPer: number; cessPer: number } {
    // 1. Priority: Lookup by Tax Slab ID if available in data and master list
    const slabId = labourData?.id_tax_slab;
    if (slabId && taxSlabs && taxSlabs.length > 0) {
      const slab = taxSlabs.find(s => s.id_tax_slab == slabId);
      if (slab) {
        return {
          cgstPer: this.toNum(slab.CGST),
          sgstPer: this.toNum(slab.SGST),
          cessPer: this.toNum(slab.CESS)
        };
      }
    }

    // 2. Fallback: Calculate ratios from stored amounts (useful for legacy data)
    const salePrice = this.toNum(labourData?.sale_price);
    if (salePrice <= 0) {
      return { cgstPer: 0, sgstPer: 0, cessPer: 0 };
    }

    const cgstAmt = this.toNum(labourData?.cgst);
    const sgstAmt = this.toNum(labourData?.sgst);
    const cessAmt = this.toNum(labourData?.cess);

    return {
      cgstPer: this.roundToFour((cgstAmt / salePrice) * 100),
      sgstPer: this.roundToFour((sgstAmt / salePrice) * 100),
      cessPer: this.roundToFour((cessAmt / salePrice) * 100)
    };
  }

  private toNum(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const n = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  private roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  private roundToFour(num: number): number {
    return Math.round((num + Number.EPSILON) * 10000) / 10000;
  }
}
