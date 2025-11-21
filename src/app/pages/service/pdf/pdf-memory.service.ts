// pdf-memory.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PdfMemoryService {

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });
  }

  /**
   * Obtener la lista de PDFs en memoria
   */
  listarPdfs(): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/pdf-file/listar`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener un PDF específico por su ID (para preview)
   */
  obtenerPdf(fileId: string): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/pdf-file/obtener/${fileId}`,
      { 
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    );
  }

  /**
   * Crear una URL temporal para preview
   */
  crearUrlPreview(fileId: string): string {
    return `${environment.apiUrl}/pdf-file/preview/${fileId}`;
  }
}