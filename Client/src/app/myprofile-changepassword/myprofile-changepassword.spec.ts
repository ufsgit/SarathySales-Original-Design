import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyProfileChangePassword } from './myprofile-changepassword';
import { RouterTestingModule } from '@angular/router/testing';

describe('MyProfileChangePassword', () => {
    let component: MyProfileChangePassword;
    let fixture: ComponentFixture<MyProfileChangePassword>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MyProfileChangePassword, RouterTestingModule]
        })
            .compileComponents();

        fixture = TestBed.createComponent(MyProfileChangePassword);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
