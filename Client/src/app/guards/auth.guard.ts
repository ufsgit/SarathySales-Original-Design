import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ApiService } from '../services/api.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const apiService = inject(ApiService);
  const router = inject(Router);

  if (apiService.isLoggedIn()) {
    const user = apiService.getCurrentUser();
    
    // Check if the route is an admin route
    const isAdminRoute = state.url.startsWith('/admin-') || 
                        route.data?.['role'] === 'admin';

    if (isAdminRoute) {
      if (user && (user.role === 1 || user.role_des === 'admin')) {
        return true;
      } else {
        // Not an admin, redirect to home or access denied
        router.navigate(['/user-home']);
        return false;
      }
    }

    return true;
  }

  // Not logged in, redirect to login page with return url
  router.navigate(['/']);
  return false;
};
