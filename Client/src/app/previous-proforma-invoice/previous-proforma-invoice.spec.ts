import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousProformaInvoice } from './previous-proforma-invoice';

describe('PreviousProformaInvoice', () => {
  let component: PreviousProformaInvoice;
  let fixture: ComponentFixture<PreviousProformaInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousProformaInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousProformaInvoice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
