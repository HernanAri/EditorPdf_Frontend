import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PdfFile } from '../upload/upload.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { firstValueFrom } from 'rxjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

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
  currentBlobUrl: string | null = null;
  selectedFileIndex = 0;

  newOrder = '';
  rotationPage: number | null = null;

  errorMessage = '';
  successMessage = '';
  processing = false;
  loadingPreview = false;
  pageRangeInput: string = '';
  showPageSelector = false;
  totalPages: number[] = [];
  selectedPagesCheckboxes: Record<number, boolean> = {};
  extractPageRangeInput: string = ''; // NUEVO input para extraer páginas
  showExtractPageSelector: boolean = false;


  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['file'] && this.file) {
      this.clearMessages();

      try {
        // Caso 1: viene desde input con File
        if (this.file.file) {
          const pageCount = await this.getPdfPageCount(this.file.file);
          this.file.pages = pageCount;
        }
        // Caso 2: solo hay id -> obtener blob del backend y contar
        else if (this.file.id) {
          const blob = await firstValueFrom(
            this.http.get(`${environment.apiUrl}/pdf-file/obtener/${this.file.id}`, { responseType: 'blob' })
          );
          const pageCount = await this.getTotalPages(blob);
          this.file.pages = pageCount;
        }

        // Inicialización de páginas para UI
        if (this.file.pages && this.file.pages > 0) {
          this.totalPages = Array.from({ length: this.file.pages }, (_, i) => i + 1);
          this.selectedPagesCheckboxes = {};
          this.totalPages.forEach(p => (this.selectedPagesCheckboxes[p] = true));
        } else {
          // Fallback para evitar UI vacía
          this.totalPages = [];
          this.selectedPagesCheckboxes = {};
        }

        // Cargar preview si hay id
        if (this.file.id) {
          this.loadPdfPreview(this.file.id);
        }
      } catch (err) {
        console.error('❌ Error al calcular páginas', err);
        this.errorMessage = 'No se pudo calcular el número de páginas';
      }
    }
  }

  private loadPdfPreview(fileId: string): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http
      .get(`${environment.apiUrl}/pdf-file/preview/${fileId}`, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        },
        error: () => {
          this.errorMessage = '❌ No se pudo cargar la vista previa';
        }
      });
  }

  ngOnDestroy() {
    if (this.previewUrl) {
      const url = (this.previewUrl as any).changingThisBreaksApplicationSecurity;
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
  }

  changePreview(file: PdfFile, index: number): void {
    this.file = file;
    this.selectedFileIndex = index;
    if (file.id) {
      this.loadPdfPreview(file.id);
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
    if (!this.file?.id) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http
      .get(`${environment.apiUrl}/pdf-file/obtener/${this.file.id}`, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.file?.name || 'archivo.pdf';
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.errorMessage = '❌ Error al descargar el archivo';
        }
      });
  }

  mergeFiles(): void {
    this.unirPDFs();
  }

  unirPDFs(): void {
    if (!this.allFiles.length || this.allFiles.length < 2) {
      this.errorMessage = '⚠️ Se necesitan al menos 2 archivos para unir';
      return;
    }

    this.processing = true;
    this.clearMessages();

    const fileIds = this.allFiles.map(f => f.id);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });

    this.http
      .post(`${environment.apiUrl3}/unir`, { archivos: fileIds }, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'pdf_unido.pdf';
          link.click();
          window.URL.revokeObjectURL(url);

          this.successMessage = '✅ PDFs unidos y descargados correctamente';
          this.processing = false;
        },
        error: err => {
          this.errorMessage = err.error?.detail || '❌ Error al unir los PDFs';
          this.processing = false;
        }
      });
  }

  async getPdfPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  }

  private async getTotalPages(blob: Blob): Promise<number> {
    const arrayBuffer = await blob.arrayBuffer();
    const pdfDoc: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdfDoc.numPages;
  }

  private parsePageRange(rangeStr: string, totalPages: number): number[] {
    const pages: number[] = [];
    const parts = rangeStr.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = Number(startStr);
        const end = Number(endStr);

        if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) pages.push(i);
            }
        }
        } else {
        const num = Number(part);
        if (!isNaN(num) && num >= 1 && num <= totalPages) pages.push(num);
        }
    }

  // Elimina duplicados y ordena
  return Array.from(new Set(pages)).sort((a, b) => a - b);
}

  // ===============================================================
  // ABRE LA VENTANA CON TODOS LOS CHECKBOX
  // ===============================================================
  splitFile() {
    if (!this.file) return;

    this.clearMessages();

    if (!this.file.pages || this.file.pages <= 0) {
        this.errorMessage = 'No se pudo detectar el número de páginas del PDF';
        return;
    }

    this.pageRangeInput = ''; // limpiar cada vez que se abre
    this.showPageSelector = true;
  }


  // ===============================================================
  // ENVÍA AL BACKEND Y RECIBE PDF (blob)
  // ===============================================================
  confirmPages() {
    if (!this.file) return;

    this.processing = true;
    this.clearMessages();

    const selectedPages = this.parsePageRange(this.pageRangeInput, this.file.pages!);

    if (selectedPages.length === 0) {
        this.errorMessage = 'Ingresa al menos una página válida';
        this.processing = false;
        return;
    }

    // ENVIAMOS TODAS LAS PÁGINAS SELECCIONADAS DENTRO DE UN SOLO SUBARRAY
    const paginasPayload = [selectedPages];

    const payload = {
        archivo_id: this.file.id,
        paginas: paginasPayload
    };

    const headers = new HttpHeaders({
        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });

    this.http
        .post(`${environment.apiUrl3}/dividir-seleccion`, payload, { headers, responseType: 'blob' })
        .subscribe({
        next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'resultado.zip'; // Este zip contendrá los PDFs generados
            link.click();
            window.URL.revokeObjectURL(url);

            this.successMessage = 'PDF dividido correctamente';
            this.showPageSelector = false;
            this.processing = false;
            this.pageRangeInput = '';
        },
        error: err => {
            console.error('Error al dividir:', err);
            this.errorMessage = 'Error al dividir el PDF';
            this.processing = false;
        }
        });
    }



  cancelPages() {
    this.showPageSelector = false;
    this.totalPages.forEach(p => (this.selectedPagesCheckboxes[p] = true));
  }

  rotateFile(degrees: number): void {
    this.rotationPage = 1;
    this.girarPagina();
  }

  girarPagina(): void {
    if (!this.file?.id || !this.rotationPage) return;

    this.processing = true;
    this.clearMessages();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http
      .post(
        `${environment.apiUrl}/pdf-editor/girar`,
        { fileId: this.file.id, pagina: this.rotationPage },
        { headers }
      )
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

  deletePages(): void {
    this.eliminarPaginas();
  }

  eliminarPaginas(): void {
    if (!this.file?.id || !this.selectedPagesCheckboxes) return;

    const selectedPages = Object.entries(this.selectedPagesCheckboxes)
      .filter(([_, checked]) => checked)
      .map(([page]) => Number(page));

    this.processing = true;
    this.clearMessages();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http
      .post(
        `${environment.apiUrl}/pdf-editor/eliminar`,
        { fileId: this.file.id, paginas: selectedPages },
        { headers }
      )
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

  reorderPages(): void {
    this.reorganizarPaginas();
  }

  reorganizarPaginas(): void {
    if (!this.file?.id || !this.newOrder) return;

    this.processing = true;
    this.clearMessages();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http
      .post(
        `${environment.apiUrl}/pdf-editor/reorganizar`,
        { fileId: this.file.id, nuevoOrden: this.newOrder },
        { headers }
      )
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

  extractPages(): void {
  if (!this.file) return;

  this.processing = true;
  this.clearMessages();

  const selectedPages = this.parsePageRange(this.extractPageRangeInput, this.file.pages!);

  if (selectedPages.length === 0) {
    this.errorMessage = 'Ingresa al menos una página válida';
    this.processing = false;
    return;
  }

  const payload = {
    archivo_id: this.file.id,
    paginas: selectedPages
  };

  const headers = new HttpHeaders({
    Authorization: `Bearer ${sessionStorage.getItem('token')}`
  });

  this.http
    .post(`${environment.apiUrl3}/extraer-paginas`, payload, { headers, responseType: 'blob' })
    .subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.file!.name}_extraido.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.successMessage = 'PDF extraído correctamente';
        this.showExtractPageSelector = false;
        this.processing = false;
        this.extractPageRangeInput = '';
      },
      error: err => {
        console.error('Error al extraer páginas:', err);
        this.errorMessage = 'Error al extraer páginas';
        this.processing = false;
      }
    });
}

  openExtractPages() {
  if (!this.file) return;

  this.clearMessages();

  if (!this.file.pages || this.file.pages <= 0) {
    this.errorMessage = 'No se pudo detectar el número de páginas del PDF';
    return;
  }

  this.extractPageRangeInput = ''; // limpiar input al abrir modal
  this.showExtractPageSelector = true; // nueva variable booleana
}


}
