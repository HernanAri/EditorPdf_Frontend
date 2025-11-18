import { Component, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';

export interface PdfFile {
  id: string;
  name: string;
  pages: number;
  size?: number;
  tempPath?: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  imports: [CommonModule]
})
export class UploadComponent {
  @Output() fileUploaded = new EventEmitter<PdfFile>();
  selectedFile: File | null = null;
  uploading = false;
  errorMessage = '';
  uploadProgress = 0;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      
      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      if (file.size > maxSize) {
        this.errorMessage = '⚠️ El archivo excede el tamaño máximo de 10 MB';
        this.selectedFile = null;
        return;
      }

      // Validar tipo
      if (file.type !== 'application/pdf') {
        this.errorMessage = '⚠️ Solo se permiten archivos PDF';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files?.length) {
      const file = files[0];
      
      // Validar tamaño
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.errorMessage = '⚠️ El archivo excede el tamaño máximo de 10 MB';
        return;
      }

      // Validar tipo
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        this.errorMessage = '';
      } else {
        this.errorMessage = '⚠️ Solo se permiten archivos PDF';
      }
    }
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.errorMessage = '⚠️ Selecciona un archivo PDF';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';
    this.uploadProgress = 0;
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post<any>(
      `${environment.apiUrl}/pdf-file/subir`, 
      formData, 
      { 
        headers,
        reportProgress: true,
        observe: 'events'
      }
    ).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Calcular progreso
          const progress = event.total 
            ? Math.round((100 * event.loaded) / event.total) 
            : 0;
          this.uploadProgress = progress;
        } else if (event.type === HttpEventType.Response) {
          // Upload completado
          this.fileUploaded.emit(event.body);
          this.uploading = false;
          this.selectedFile = null;
          this.uploadProgress = 0;
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message || '❌ Error al subir el archivo';
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  clearFile() {
    this.selectedFile = null;
    this.errorMessage = '';
    this.uploadProgress = 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}