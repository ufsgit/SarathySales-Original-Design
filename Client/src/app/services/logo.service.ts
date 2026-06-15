import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class LogoService {
    private readonly BASE_URL = environment.apiUrl;

    constructor(private http: HttpClient) { }

    private handleError(err: any): Observable<never> {
        return throwError(() => err);
    }

    listLogos(page = 1, limit = 10, search = ''): Observable<ApiResponse> {
        const q = search ? `&search=${encodeURIComponent(search)}` : '';
        return this.http.get<ApiResponse>(`${this.BASE_URL}/logo/list?page=${page}&limit=${limit}${q}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getLogoById(id: number | string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/logo/get/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    createLogo(formData: FormData): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/logo/create`, formData)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateLogo(id: number | string, data: { title: string, is_active?: number }): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/logo/update/${id}`, data)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateLogoWithImage(id: number | string, formData: FormData): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/logo/update-with-image/${id}`, formData)
            .pipe(catchError(err => this.handleError(err)));
    }

    deleteLogo(id: number | string): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.BASE_URL}/logo/delete/${id}`)
            .pipe(catchError(err => this.handleError(err)));
    }
}
