import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PdfService } from '../../../services/pdf/pdf';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.scss']
})

export class UploadComponent {
  selectedFiles: File[] = [];
  errorMessages: string[] = []; // para mostrar errores en pantalla
  filePreviews: SafeResourceUrl[] = [];


  constructor(private pdfService: PdfService, private http: HttpClient, private sanitizer: DomSanitizer) {}

onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;

  this.errorMessages = [];
  this.filePreviews = [];
  const validFiles: File[] = [];

  for (const file of Array.from(input.files)) {
    // Validar extensión PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.errorMessages.push(`❌ ${file.name} no es un archivo PDF válido.`);
      continue;
    }

    // Validar tamaño (20 MB)
    if (file.size > 20 * 1024 * 1024) {
      this.errorMessages.push(`⚠️ ${file.name} excede el tamaño máximo de 20 MB.`);
      continue;
    }

    validFiles.push(file);

    // Generar vista previa
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const url = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
      this.filePreviews.push(url); // Base64
    };
    reader.readAsDataURL(file);
  }

  if (validFiles.length === 0 && this.errorMessages.length === 0) {
    this.errorMessages.push('No se seleccionó ningún archivo válido.');
  }

  this.selectedFiles = validFiles;
}

removeFile(file: File) {
  const index = this.selectedFiles.indexOf(file);
  if (index !== -1) {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }
}


  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.errorMessages = ['❌ No hay archivos para subir.'];
      return;
    }
    const formData = new FormData();
    for (const file of this.selectedFiles){
      formData.append('file',file)
    }

    this.http.post( `${environment.apiUrl}/pdf-file/subir`, formData).subscribe({
      next: (response) => {
        console.log('Archivos subidos con éxito:', response);
        this.selectedFiles = []; // Limpiar selección tras subida exitosa
      },
      error: (error) => {
        console.error('Error al subir archivos:', error);
        this.errorMessages = ['❌ Error al subir los archivos. Por favor, intenta nuevamente.'];
      }
    });
  }

    isDragging = false;

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (!event.dataTransfer?.files) return;

    const fileList = event.dataTransfer.files;
    const fakeInput = { target: { files: fileList } } as unknown as Event;
    this.onFilesSelected(fakeInput);
  }
}
