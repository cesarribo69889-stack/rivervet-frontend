import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from './constants';
import { desempaquetar } from './helpers';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}
  private params(p: any): HttpParams { let x = new HttpParams(); Object.entries(p ?? {}).forEach(([k,v]) => { if (v !== '' && v != null) x = x.set(k, String(v)); }); return x; }
  get(path: string, params?: any): Observable<any> { return this.http.get(`${API_URL}${path}`, { params: this.params(params) }).pipe(map(desempaquetar)); }
  post(path: string, body?: any): Observable<any> { return this.http.post(`${API_URL}${path}`, body ?? null).pipe(map(desempaquetar)); }
  put(path: string, body: any): Observable<any> { return this.http.put(`${API_URL}${path}`, body).pipe(map(desempaquetar)); }
  delete(path: string): Observable<any> { return this.http.delete(`${API_URL}${path}`).pipe(map(desempaquetar)); }
}
