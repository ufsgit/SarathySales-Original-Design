import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousMoneyReceipt } from './previous-money-receipt';

describe('PreviousMoneyReceipt', () => {
  let component: PreviousMoneyReceipt;
  let fixture: ComponentFixture<PreviousMoneyReceipt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousMoneyReceipt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousMoneyReceipt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
