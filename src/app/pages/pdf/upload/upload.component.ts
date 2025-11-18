import { Component, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';

export interface PdfFile {
  id: string;
  name: string;
  pages: number;
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

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.errorMessage = '';
    }
  }

  uploadFile() {

    if (!this.selectedFile) {
      this.errorMessage = '⚠️ Selecciona un archivo PDF';
      return;
    }

    this.uploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post<any>(`${environment.apiUrl}/pdf-file/Subir`, formData, { headers})
      .subscribe({
        next: (response) => {
          this.fileUploaded.emit(response);
          this.uploading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = '❌ Error al subir el archivo';
          this.uploading = false;
        }
      });
  }
  
}
