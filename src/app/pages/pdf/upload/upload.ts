import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PdfService } from 'src/app/services/pdf/pdf';
imports: [CommonModule, HttpClientModule],

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

  constructor(private pdfService: PdfService) {}

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.errorMessages = []; // limpiar errores previos
    const validFiles: File[] = [];

    for (const file of Array.from(input.files)) {
      // Validar extensión
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        this.errorMessages.push(`❌ ${file.name} no es un archivo PDF válido.`);
        continue;
      }

      // Validar tamaño (opcional: 20 MB)
      if (file.size > 20 * 1024 * 1024) {
        this.errorMessages.push(`⚠️ ${file.name} excede el tamaño máximo de 20 MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      this.errorMessages.push('No se seleccionó ningún archivo válido.');
    }

    this.selectedFiles = validFiles;
  }

  removeFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.errorMessages = ['⚠️ Debes seleccionar al menos un archivo PDF.'];
      return;
    }

    this.pdfService.uploadPdfs(this.selectedFiles).subscribe({
      next: () => {
        this.errorMessages = [];
        alert('Archivos subidos correctamente ✅');
      },
      error: (err) => {
        this.errorMessages = [`Error al subir archivos: ${err.message}`];
      },
    });
  }
}
