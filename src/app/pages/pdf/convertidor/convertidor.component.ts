import { Component, Input } from '@angular/core';
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
export class ConvertidorComponent {
  @Input() file: PdfFile | null = null;
  selectedFormat: ConversionFormat | null = null;
  processing = false;
  successMessage = '';
  errorMessage = '';
  conversionProgress = 0;

  constructor(private http: HttpClient) {}

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
    console.log('Archivo recibido:', this.file);
    console.log('Formato seleccionado:', this.selectedFormat);

    if (!this.file || !this.selectedFormat) {
      this.errorMessage = 'Archivo o formato no válido.';
      return;
    }

    // Verificar que el workflow envió el File real
    const realFile = (this.file as any).file;
    if (!realFile) {
      this.errorMessage = '❌ No se recibió el archivo original para convertir.';
      console.error("ERROR: faltó enviar el archivo real desde el workflow.");
      return;
    }

    this.processing = true;
    this.conversionProgress = 0;
    this.clearMessages();

    // Simular progreso
    const progressInterval = setInterval(() => {
      if (this.conversionProgress < 90) {
        this.conversionProgress += Math.random() * 15;
      }
    }, 300);

    const formData = new FormData();
    formData.append('file', realFile); // PDF real del navegador
    formData.append('tipo', this.selectedFormat!);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post(`${environment.apiUrl2}/convertir/convertir`, formData, {
      headers,
      responseType: 'blob'
    }).subscribe({
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

          this.successMessage = '¡Conversión completada!';
          this.processing = false;
          this.conversionProgress = 0;

          // Limpia el mensaje después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        }, 500);
      },

      error: (err) => {
        clearInterval(progressInterval);
        console.error('Error en la conversión:', err);
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

  ngOnChanges() {
    if (!this.file) {
      this.errorMessage = '⚠️ No se recibió archivo válido para convertir.';
    }
  }
}
