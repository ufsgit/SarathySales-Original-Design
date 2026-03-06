import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousSalesInvoice } from './previous-sales-invoice';

describe('PreviousSalesInvoice', () => {
  let component: PreviousSalesInvoice;
  let fixture: ComponentFixture<PreviousSalesInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousSalesInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousSalesInvoice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
