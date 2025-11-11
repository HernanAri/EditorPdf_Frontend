import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PdfOperationResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private apiUrl = `${environment.apiUrl}/pdf-file`;

  constructor(private http: HttpClient) {}

  // Subir archivos
  uploadFiles(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post(`${this.apiUrl}/subir`, formData);
  }

  // Rotar PDF
  rotatePdf(fileId: string, degrees: number): Observable<PdfOperationResponse> {
    return this.http.post<PdfOperationResponse>(`${this.apiUrl}/rotate`, {
      fileId,
      degrees
    });
  }

  // Dividir PDF
  splitPdf(fileId: string, pages: string): Observable<PdfOperationResponse> {
    return this.http.post<PdfOperationResponse>(`${this.apiUrl}/split`, {
      fileId,
      pages
    });
  }

  // Unir PDFs
  mergePdfs(fileIds: string[]): Observable<PdfOperationResponse> {
    return this.http.post<PdfOperationResponse>(`${this.apiUrl}/merge`, {
      fileIds
    });
  }

  // Eliminar páginas
  deletePages(fileId: string, pages: string): Observable<PdfOperationResponse> {
    return this.http.post<PdfOperationResponse>(`${this.apiUrl}/delete-pages`, {
      fileId,
      pages
    });
  }

  // Obtener información del PDF
  getPdfInfo(fileId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/info/${fileId}`);
  }

  // Descargar PDF procesado
  downloadPdf(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${fileId}`, {
      responseType: 'blob'
    });
  }

  // Limpiar archivos temporales
  cleanupTemp(fileId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/temp/${fileId}`);
  }
}