import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserFooter } from './user-footer';

describe('UserFooter', () => {
  let component: UserFooter;
  let fixture: ComponentFixture<UserFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFooter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
