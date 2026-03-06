import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousBranchTransfer } from './previous-branch-transfer';

describe('PreviousBranchTransfer', () => {
  let component: PreviousBranchTransfer;
  let fixture: ComponentFixture<PreviousBranchTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousBranchTransfer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousBranchTransfer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
