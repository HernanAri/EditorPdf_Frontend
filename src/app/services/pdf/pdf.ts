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

  /** Subir uno o varios PDFs al backend */
  uploadPdfs(files: File[]) {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    //URL del endpoint de subida 
    const url = `${this.BASE_URL}/api/pdf/upload`;

    return this.http.post(url, formData).pipe(
      catchError(this.handleError)
    );
  }

  /** Manejo de errores HTTP */
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('Error de red o cliente:', error.error.message);
    } else {
      console.error(`Backend retornó el código ${error.status}:`, error.error);
    }
    return throwError(() => new Error('Error al comunicarse con el servidor.'));
  }
}
