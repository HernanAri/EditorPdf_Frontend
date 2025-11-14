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
    console.log('Temp path:', this.file?.tempPath);
    console.log('Formato seleccionado:', this.selectedFormat);
    console.log('Ejecutando conversión...');

    if (!this.file || !this.selectedFormat || !this.file.tempPath) {
      this.errorMessage = 'Archivo o formato no válido';
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

    fetch(this.file.tempPath)
      .then(res => res.blob())
      .then(blob => {
        const fileBlob = new File([blob], this.file!.name, { type: 'application/pdf' });
        formData.append('file', fileBlob);
        formData.append('tipo', this.selectedFormat!);

        const headers = new HttpHeaders({
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        });

        this.http.post(`${environment.apiUrl2}/herramientas/convertir`, formData, { headers, responseType: 'blob' },)
          .subscribe({
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

                // Auto-limpiar mensaje después de 5 segundos
                setTimeout(() => {
                this.successMessage = '';
              }, 5000);
            }, 500);
          },
          error: (err) => {
            clearInterval(progressInterval);
            console.error('Error en la conversión:', err);
            this.errorMessage = '❌ Error al convertir el archivo';
            this.processing = false;
            this.conversionProgress = 0;
          }
        });
    })
    .catch(err => {
      clearInterval(progressInterval);
      console.error('Error al obtener el archivo:', err);
      this.errorMessage = '❌ No se pudo acceder al archivo temporal';
      this.processing = false;
      this.conversionProgress = 0;
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
  if (!this.file?.tempPath) {
    this.errorMessage = '⚠️ No se recibió archivo válido para convertir';
  }
}
}