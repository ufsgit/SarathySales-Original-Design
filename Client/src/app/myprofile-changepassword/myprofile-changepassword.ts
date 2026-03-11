import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserNav } from '../user-nav/user-nav';
import { UserFooter } from '../user-footer/user-footer';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-myprofile-changepassword',
    standalone: true,
    imports: [CommonModule, FormsModule, UserNav, UserFooter, RouterLink],
    templateUrl: './myprofile-changepassword.html',
    styleUrls: ['./myprofile-changepassword.css']
})
export class MyProfileChangePassword {
    oldPassword = '';
    newPassword = '';
    verifyNewPassword = '';
    loading = false;
    isAdmin = computed(() => {
        const user = this.api.getCurrentUser();
        return user?.role == 1 || user?.role_des === 'admin';
    });

    constructor(private api: ApiService, private router: Router) { }

    onSubmit() {
        if (!this.oldPassword || !this.newPassword || !this.verifyNewPassword) {
            alert('Please fill in all fields.');
            return;
        }

        if (this.newPassword !== this.verifyNewPassword) {
            alert('New passwords do not match!');
            return;
        }

        const user = this.api.getCurrentUser();
        if (!user || !user.login_id) {
            alert('User session not found. Please login again.');
            this.router.navigate(['/login']);
            return;
        }

        this.loading = true;
        this.api.changePassword(user.login_id, this.oldPassword, this.newPassword).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.success) {
                    alert('Password changed successfully!');
                    this.onReset();
                    // Optional: logout and redirect to login, or stay here.
                    // For now, let's just reset the form.
                } else {
                    alert(res.message || 'Failed to change password.');
                }
            },
            error: (err) => {
                this.loading = false;
                console.error('Change password error:', err);
                alert(err.error?.message || 'An error occurred while changing password.');
            }
        });
    }

    onReset() {
        this.oldPassword = '';
        this.newPassword = '';
        this.verifyNewPassword = '';
    }
}
