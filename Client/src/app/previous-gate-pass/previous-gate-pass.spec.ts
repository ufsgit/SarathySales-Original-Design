import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousGatePass } from './previous-gate-pass';

describe('PreviousGatePass', () => {
  let component: PreviousGatePass;
  let fixture: ComponentFixture<PreviousGatePass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousGatePass]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousGatePass);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
