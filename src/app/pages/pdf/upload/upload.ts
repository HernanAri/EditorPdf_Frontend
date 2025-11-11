import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { PdfService } from '../../../services/pdf/pdf';
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
  errorMessages: string[] = [];
  filePreviews: SafeResourceUrl[] = [];

  isDragging = false;
  isLoading = false;
  successMessage = '';

  constructor(
    private pdfService: PdfService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  // -------------------------------------------
  // MANEJO DE ARCHIVOS
  // -------------------------------------------
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.errorMessages = [];
    this.filePreviews = [];
    const validFiles: File[] = [];

    for (const file of Array.from(input.files)) {
      // Validar extensión
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        this.errorMessages.push(`❌ ${file.name} no es un archivo PDF válido.`);
        continue;
      }

      // Validar tamaño máximo de 20MB
      if (file.size > 20 * 1024 * 1024) {
        this.errorMessages.push(`⚠️ ${file.name} excede el límite de 20 MB.`);
        continue;
      }

      validFiles.push(file);

      // Vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const url = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
        this.filePreviews.push(url);
      };
      reader.readAsDataURL(file);
    }

    this.selectedFiles = validFiles;

    if (validFiles.length === 0 && this.errorMessages.length === 0) {
      this.errorMessages.push('No se seleccionó ningún archivo válido.');
    }
  }

  removeFile(file: File) {
    const index = this.selectedFiles.indexOf(file);
    if (index !== -1) {
      this.selectedFiles.splice(index, 1);
      this.filePreviews.splice(index, 1);
    }
  }

  // -------------------------------------------
  // SUBIR ARCHIVOS
  // -------------------------------------------
  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.errorMessages = ['❌ No hay archivos para subir.'];
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessages = [];

    this.pdfService.uploadPdfs(this.selectedFiles).subscribe({
      next: (response) => {
        this.successMessage = '✅ Archivos subidos correctamente.';
        this.selectedFiles = [];
        this.filePreviews = [];
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessages = ['❌ Error al subir archivos.'];
        this.isLoading = false;
      }
    });
  }

  // -------------------------------------------
  // DRAG & DROP
  // -------------------------------------------
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

  // -------------------------------------------
  // CONVERSIÓN DE ARCHIVOS
  // -------------------------------------------
  convertTo(type: string) {
    if (this.selectedFiles.length === 0) {
      this.errorMessages = ['❌ Selecciona al menos un PDF para convertir.'];
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessages = [];

    this.pdfService.convertPdfs(type, this.selectedFiles).subscribe({
      next: (blob) => {
        this.isLoading = false;

        const downloadName = `conversion_${type}.${type === 'images' ? 'zip' : type === 'word' ? 'docx' : type === 'excel' ? 'xlsx' : 'pptx'}`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        a.click();
        window.URL.revokeObjectURL(url);

        this.successMessage = '✅ Conversión completada.';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessages = ['❌ Error al convertir el archivo.'];
      }
    });
  }
}

