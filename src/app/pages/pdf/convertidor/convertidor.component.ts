import { Component, Input, OnChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PdfFile } from '../upload/upload.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type ConversionFormat = 'excel' | 'word' | 'power point';

@Component({
  selector: 'app-convertidor',
  standalone: true,
  templateUrl: './convertidor.component.html',
  styleUrls: ['./convertidor.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class ConvertidorComponent implements OnChanges {

  @Input() file: PdfFile | null = null;
  @Input() allFiles: PdfFile[] = [];

  selectedFormat: ConversionFormat | null = null;
  processing = false;
  successMessage = '';
  errorMessage = '';
  conversionProgress = 0;

  constructor(private http: HttpClient) {}

  ngOnChanges() {
    if (!this.file) {
      this.errorMessage = '⚠️ No se recibió archivo válido para convertir.';
      return;
    }

    console.log("📄 Archivo recibido en convertidor:", this.file);

    if (!(this.file as any).file) {
      console.warn("⚠️ Advertencia: el archivo recibido NO contiene el File real.");
    }
  }

  selectFormat(format: ConversionFormat) {
    if (!this.processing) {
      this.selectedFormat = format;
      this.clearMessages();
    }
  }

  resetSelection() {
    this.selectedFormat = null;
    this.clearMessages();
    this.conversionProgress = 0;
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getFormatLabel(format: ConversionFormat): string {
    const labels = {
      'excel': 'Excel',
      'word': 'Word',
      'power point': 'PowerPoint'
    };
    return labels[format];
  }

  convertFile() {
  console.log("✔ Archivo recibido para convertir:", this.file);
  console.log("✔ Formato seleccionado:", this.selectedFormat);

  if (!this.file || !this.selectedFormat) {
    this.errorMessage = '⚠️ Archivo o formato no válido.';
    return;
  }

  // Ya no necesitas el File real, solo el ID
  if (!this.file.id) {
    this.errorMessage = '❌ No se encontró el ID del archivo.';
    return;
  }

  this.processing = true;
  this.conversionProgress = 0;
  this.clearMessages();

  const progressInterval = setInterval(() => {
    if (this.conversionProgress < 90) {
      this.conversionProgress += Math.random() * 20;
    }
  }, 300);

  // Enviar el ID del archivo en lugar del File
  const body = {
    file_id: this.file.id,  // ID del archivo en memoria
    tipo: this.selectedFormat
  };

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  this.http.post(
    `${environment.apiUrl2}/convertir/convertir`, 
    body,  // JSON en lugar de FormData
    { headers, responseType: 'blob' }
  ).subscribe({
    next: (response: Blob) => {
      clearInterval(progressInterval);
      this.conversionProgress = 100;

      setTimeout(() => {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.getFileNameWithoutExt()}.${this.getExtension(this.selectedFormat!)}`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.successMessage = '¡Conversión completada! 🎉';
        this.processing = false;
        this.conversionProgress = 0;

        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      }, 500);
    },

    error: (err) => {
      clearInterval(progressInterval);
      console.error('❌ Error en la conversión:', err);
      this.errorMessage = '❌ Error al convertir el archivo.';
      this.processing = false;
      this.conversionProgress = 0;
    }
  });
}

  getExtension(format: ConversionFormat): string {
    const map = {
      'excel': 'xlsx',
      'word': 'docx',
      'power point': 'pptx'
    };
    return map[format] || 'pdf';
  }

  getFileNameWithoutExt(): string {
    if (!this.file?.name) return 'archivo_convertido';
    return this.file.name.replace(/\.[^/.]+$/, '');
  }
}
