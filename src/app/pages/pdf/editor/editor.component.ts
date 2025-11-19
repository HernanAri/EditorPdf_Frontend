import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PdfFile } from '../upload/upload.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnChanges {

  @Input() file: PdfFile | null = null;
  @Input() allFiles: PdfFile[] = [];
  @Output() closePreview = new EventEmitter<void>();

  previewUrl: SafeResourceUrl | null = null;

  selectedFormat: 'excel' | 'word' | 'power point' | '' = '';
  selectedPages = '';
  newOrder = '';
  rotationPage: number | null = null;
  errorMessage = '';
  successMessage = '';
  processing = false;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.file?.tempPath) {
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.file.tempPath);
    }
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  close(): void {
    this.closePreview.emit();
  }

  downloadFile(): void {
    if (!this.file?.tempPath) return;
    const link = document.createElement('a');
    link.href = this.file.tempPath;
    link.download = this.file.name;
    link.click();
  }

  getExtension(format: string): string {
    const map = {
      excel: 'xlsx',
      word: 'docx',
      'power point': 'pptx'
    };
    return map[format] || 'pdf';
  }

  convertFile(): void {
    if (!this.file?.tempPath || !this.selectedFormat) {
      this.errorMessage = '⚠️ Archivo o formato no válido';
      return;
    }

    this.processing = true;
    this.clearMessages();

    fetch(this.file.tempPath)
      .then(res => res.blob())
      .then(blob => {
        const fileBlob = new File([blob], this.file!.name, { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', fileBlob);
        formData.append('tipo', this.selectedFormat);

        this.http.post(`${environment.apiUrl}/herramientas/convertir`,
          formData,
          { responseType: 'blob' }
        )
        .subscribe({
          next: (response: Blob) => {
            const url = window.URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.download = `convertido.${this.getExtension(this.selectedFormat)}`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.successMessage = '✅ Conversión exitosa';
            this.processing = false;
          },
          error: () => {
            this.errorMessage = '❌ Error en la conversión';
            this.processing = false;
          }
        });
      });
  }

  rotateFile(degrees: number): void {
    this.rotationPage = 1;
    this.girarPagina();
  }

  splitFile(): void {
    this.dividirPDF();
  }

  mergeFiles(): void {
    this.unirPDFs();
  }

  deletePages(): void {
    this.eliminarPaginas();
  }

  extractPages(): void {
    this.successMessage = '✅ Páginas extraídas (simulado)';
  }

  reorderPages(): void {
    this.reorganizarPaginas();
  }

  unirPDFs(): void {
    if (!this.file?.id) return;
    this.processing = true;
    this.clearMessages();

    this.http.post(`${environment.apiUrl}/pdf-editor/unir`, { fileId: this.file.id })
    .subscribe({
      next: () => {
        this.successMessage = '✅ PDFs unidos correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al unir los PDFs';
        this.processing = false;
      }
    });
  }

  dividirPDF(): void {
    if (!this.file?.id || !this.selectedPages) return;
    this.processing = true;
    this.clearMessages();

    this.http.post(`${environment.apiUrl}/pdf-editor/dividir`, {
      fileId: this.file.id,
      paginas: this.selectedPages
    })
    .subscribe({
      next: () => {
        this.successMessage = '✅ PDF dividido correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al dividir el PDF';
        this.processing = false;
      }
    });
  }

  girarPagina(): void {
    if (!this.file?.id || !this.rotationPage) return;
    this.processing = true;
    this.clearMessages();

    this.http.post(`${environment.apiUrl}/pdf-editor/girar`, {
      fileId: this.file.id,
      pagina: this.rotationPage
    })
    .subscribe({
      next: () => {
        this.successMessage = '✅ Página girada correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al girar la página';
        this.processing = false;
      }
    });
  }

  eliminarPaginas(): void {
    if (!this.file?.id || !this.selectedPages) return;
    this.processing = true;
    this.clearMessages();

    this.http.post(`${environment.apiUrl}/pdf-editor/eliminar`, {
      fileId: this.file.id,
      paginas: this.selectedPages
    })
    .subscribe({
      next: () => {
        this.successMessage = '✅ Páginas eliminadas correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al eliminar páginas';
        this.processing = false;
      }
    });
  }

  reorganizarPaginas(): void {
    if (!this.file?.id || !this.newOrder) return;
    this.processing = true;
    this.clearMessages();

    this.http.post(`${environment.apiUrl}/pdf-editor/reorganizar`, {
      fileId: this.file.id,
      nuevoOrden: this.newOrder
    })
    .subscribe({
      next: () => {
        this.successMessage = '✅ Páginas reorganizadas correctamente';
        this.processing = false;
      },
      error: () => {
        this.errorMessage = '❌ Error al reorganizar las páginas';
        this.processing = false;
      }
    });
  }
}
