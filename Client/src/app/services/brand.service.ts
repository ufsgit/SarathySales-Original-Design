import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface BrandConfig {
  brand_id: number;
  brand_name: string;
  brand_color: string;
  brand_status: number;
}

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private readonly BASE_URL = environment.apiUrl;
  
  // Reactive Signal representing the active brand config globally
  readonly activeBrand = signal<BrandConfig | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Loads the active brand configuration from the backend.
   * Angular waits for the returned Promise to resolve before booting.
   */
  async loadBrandConfig(): Promise<void> {
    try {
      console.log('🔄 Loading brand configuration via provideAppInitializer...');
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: BrandConfig }>(`${this.BASE_URL}/brand/active`)
      );

      if (response && response.success && response.data) {
        const brand = response.data;
        brand.brand_color = (brand.brand_color || '').trim();
        
        this.activeBrand.set(brand);
        console.log('✅ Frontend active brand loaded successfully:', brand);
        
        this.applyBrandColors(brand.brand_color);
      } else {
        console.warn('⚠️ No active brand returned, using default style');
        this.applyBrandColors('#f36f21'); // Fallback orange
      }
    } catch (error) {
      console.error('❌ Failed to fetch brand config:', error);
      this.applyBrandColors('#f36f21'); // Fallback orange
    }
  }

  /**
   * Returns current active brand state
   */
  getBrandConfig(): BrandConfig | null {
    return this.activeBrand();
  }

  /**
   * Applies the hex color to document element styles.
   */
  private applyBrandColors(hexColor: string): void {
    if (!hexColor) return;
    document.documentElement.style.setProperty('--primary-brand-color', hexColor);
  }
}
