import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminColor } from './admin-color';

describe('AdminColor', () => {
  let component: AdminColor;
  let fixture: ComponentFixture<AdminColor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminColor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminColor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
