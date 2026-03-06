import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousPurchaseInvoice } from './previous-purchase-invoice';

describe('PreviousPurchaseInvoice', () => {
  let component: PreviousPurchaseInvoice;
  let fixture: ComponentFixture<PreviousPurchaseInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousPurchaseInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousPurchaseInvoice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
