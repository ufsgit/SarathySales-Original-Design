import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousPaySlip } from './previous-pay-slip';

describe('PreviousPaySlip', () => {
  let component: PreviousPaySlip;
  let fixture: ComponentFixture<PreviousPaySlip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousPaySlip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousPaySlip);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
