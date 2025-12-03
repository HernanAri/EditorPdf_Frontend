import { Component, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';

export interface PdfFile {
  id: string;
  name: string;
  pages: number;
  size?: number;
  tempPath: string;
  file: File;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  imports: [CommonModule]
})
export class UploadComponent {

  @Output() fileUploaded = new EventEmitter<PdfFile[]>();

  selectedFiles: File [] = [];
  uploading = false;
  errorMessage = '';
  uploadProgress = 0;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      this.errorMessage = '';

      for (const file of Array.from(input.files)) {
        if (file.type !== 'application/pdf') {
          this.errorMessage = '⚠️ Solo se permiten archivos PDF';
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          this.errorMessage = '⚠️ Un archivo excede los 10 MB';
          continue;
        }

        this.selectedFiles.push(file);
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  uploadFile() {
    if (this.selectedFiles.length === 0) {
      this.errorMessage = '⚠️ Selecciona uno o más PDFs';
      return;
    }

    this.uploading = true;

    const formData = new FormData();
    this.selectedFiles.forEach(f => formData.append('file', f));

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post<any>(
      `${environment.apiUrlUpload}/Subir`,
      formData,
      { headers, reportProgress: true, observe: 'events' }
    ).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = event.total
            ? Math.round((100 * event.loaded) / event.total)
            : 0;
        }

        if (event.type === HttpEventType.Response) {
          const uploadedFiles: PdfFile[] = [];

          // ✅ Verificar que la respuesta tenga la estructura esperada
          if (!event.body?.data?.archivos_guardados) {
            this.errorMessage = '❌ Respuesta del servidor inválida';
            this.uploading = false;
            return;
          }

          event.body.data.archivos_guardados.forEach((saved: any, i: number) => {
            uploadedFiles.push({
              id: saved.saved_as || '',
              name: saved.filename || '',
              pages: 0,
              size: saved.size || 0,
              tempPath: '', // No se usa porque está en memoria
              file: this.selectedFiles[i]
            });
          });

          this.fileUploaded.emit(uploadedFiles);
          this.uploading = false;
          this.uploadProgress = 0;
          this.selectedFiles = [];
        }
      },

      error: (err) => {
        this.errorMessage = err.error?.message || '❌ Error al subir los archivos';
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  clearFile() {
    this.selectedFiles = [];
    this.errorMessage = '';
    this.uploadProgress = 0;
  }
}

