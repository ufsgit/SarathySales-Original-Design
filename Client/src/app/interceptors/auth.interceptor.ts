import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private apiService: ApiService,
        private router: Router
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.apiService.getToken();

        // 1. Attach token if available
        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        // 2. Handle responses
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Ignore 401 alerts for the login request itself
                const isLoginRequest = request.url.includes('/auth/login');
                if (error.status === 401 && !isLoginRequest) {
                    // Session expired or invalid token
                    alert('Session expired. Please login again.');
                    this.apiService.logout();
                    this.router.navigate(['/']);
                }
                return throwError(() => error);
            })
        );
    }
}
