import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  private readonly BASE_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Subir uno o varios PDFs */
  uploadPdfs(files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    const url = `${this.BASE_URL}/api/pdf/upload`;

    return this.http.post(url, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Convertir PDFs a formato deseado
   * type puede ser:
   *   - "word"
   *   - "excel"
   *   - "ppt"
   *   - "images"
   */
  convertPdfs(type: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    const url = `${this.BASE_URL}/api/pdf/convert/${type}`;

    return this.http.post(url, formData, {
      responseType: 'blob',  // ⬅️ recibimos un archivo binario del backend
    }).pipe(
      catchError(this.handleError)
    );
  }

  /** Manejo de errores */
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('Error en el cliente:', error.error.message);
    } else {
      console.error(`Error en el servidor (${error.status}):`, error.error);
    }
    return throwError(() => new Error('Error al comunicarse con el servidor.'));
  }
}
