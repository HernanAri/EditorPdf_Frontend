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
import { PdfModalComponent, ModalConfig, ModalResult } from '../pdf-modal/pdf-modal.component';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfModalComponent],
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

  errorMessage = '';
  successMessage = '';
  processing = false;
  loadingPreview = false;

  // Modal
  showModal = false;
  modalConfig: ModalConfig | null = null;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['file'] && this.file) {
      this.clearMessages();

      try {
        // Solo calcular páginas si aún no las tiene
        if (!this.file.pages || this.file.pages === 0) {
          // Caso 1: viene desde input con File
          if (this.file.file) {
            const pageCount = await this.getPdfPageCount(this.file.file);
            this.file.pages = pageCount;
          }
          // Caso 2: solo hay id -> obtener blob del backend y contar
          else if (this.file.id) {
            try {
              const blob = await firstValueFrom(
                this.http.get(`${environment.apiUrlUpload2}/pdf-file/obtener/${this.file.id}`, {
                  responseType: 'blob',
                  headers: new HttpHeaders({
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                  })
                })
              );
              const pageCount = await this.getTotalPages(blob);
              this.file.pages = pageCount;
            } catch (err) {
              console.error('Error al obtener páginas:', err);
              // Intentar con un valor por defecto
              this.file.pages = 1;
            }
          }
        }

        // Cargar preview si hay id
        if (this.file.id) {
          this.loadPdfPreview(this.file.id);
        }
      } catch (err) {
        console.error('❌ Error al calcular páginas', err);
        this.errorMessage = 'No se pudo calcular el número de páginas';
        // Asignar un valor por defecto para que no bloquee la UI
        if (this.file) {
          this.file.pages = 1;
        }
      }
    }
  }

  private loadPdfPreview(fileId: string): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http
      .get(`${environment.apiUrlUpload2}/pdf-file/preview/${fileId}`, { headers, responseType: 'blob' })
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
      .get(`${environment.apiUrlUpload2}/pdf-file/obtener/${this.file.id}`, { headers, responseType: 'blob' })
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

  // ==================== ABRIR MODALES ====================

  openMergeModal(): void {
    if (this.allFiles.length < 2) {
      this.errorMessage = '⚠️ Se necesitan al menos 2 archivos para unir';
      return;
    }

    this.modalConfig = {
      action: 'merge',
      totalPages: 0,
      fileName: 'Múltiples archivos'
    };
    this.showModal = true;
  }

  openSplitModal(): void {
    if (!this.file) {
      this.errorMessage = 'No hay archivo seleccionado';
      return;
    }

    const totalPages = this.file.pages && this.file.pages > 0 ? this.file.pages : 1;

    this.modalConfig = {
      action: 'split',
      totalPages: totalPages,
      fileName: this.file.name
    };
    this.showModal = true;
  }

  openRotateModal(): void {
    if (!this.file) {
      this.errorMessage = 'No hay archivo seleccionado';
      return;
    }

    const totalPages = this.file.pages && this.file.pages > 0 ? this.file.pages : 1;

    this.modalConfig = {
      action: 'rotate',
      totalPages: totalPages,
      fileName: this.file.name
    };
    this.showModal = true;
  }

  openDeleteModal(): void {
    if (!this.file) {
      this.errorMessage = 'No hay archivo seleccionado';
      return;
    }

    // Si no hay páginas calculadas, usar 1 como valor por defecto
    const totalPages = this.file.pages && this.file.pages > 0 ? this.file.pages : 1;

    console.log('🔍 Abriendo modal eliminar - Total páginas:', totalPages);

    this.modalConfig = {
      action: 'delete',
      totalPages: totalPages,
      fileName: this.file.name
    };
    this.showModal = true;
  }

  openReorderModal(): void {
    if (!this.file) {
      this.errorMessage = 'No hay archivo seleccionado';
      return;
    }

    const totalPages = this.file.pages && this.file.pages > 0 ? this.file.pages : 1;

    this.modalConfig = {
      action: 'reorder',
      totalPages: totalPages,
      fileName: this.file.name
    };
    this.showModal = true;
  }

  // ==================== MANEJAR CONFIRMACIÓN DEL MODAL ====================

  onModalConfirm(result: ModalResult): void {
    this.showModal = false;
    this.clearMessages();

    console.log('✅ Modal confirmado:', result);
    console.log('📋 Data recibida:', JSON.stringify(result.data, null, 2));

    switch (result.action) {
      case 'merge':
        this.executeMerge();
        break;
      case 'split':
        this.executeSplit(result.data.paginas);
        break;
      case 'rotate':
        this.executeRotate(result.data.pages, result.data.degrees);
        break;
      case 'delete':
        console.log('🗑️ Iniciando eliminación:', result.data);
        // Verificar que pagesToDelete existe
        if (!result.data.pagesToDelete || !Array.isArray(result.data.pagesToDelete)) {
          console.error('❌ pagesToDelete no está definido o no es un array:', result.data);
          this.errorMessage = 'Error: No se recibieron las páginas a eliminar';
          return;
        }
        this.executeDelete(result.data.pagesToDelete);
        break;
      case 'reorder':
        this.executeReorder(result.data.order);
        break;
    }
  }

  onModalCancel(): void {
    this.showModal = false;
  }

  // ==================== EJECUTAR OPERACIONES ====================

  private executeMerge(): void {
    this.processing = true;

    const fileIds = this.allFiles.map(f => f.id);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });

    this.http
      .post(`${environment.apiUrlEditor2}/unir`, { archivos: fileIds }, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, 'pdf_unido.pdf');
          this.successMessage = '✅ PDFs unidos correctamente';
          this.processing = false;
        },
        error: err => {
          this.errorMessage = err.error?.detail || '❌ Error al unir los PDFs';
          this.processing = false;
        }
      });
  }

  private executeSplit(groups: number[][]): void {
    if (!this.file?.id) return;

    this.processing = true;

    const payload = {
      archivo_id: this.file.id,
      paginas: groups
    };


    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`,
    });

    this.http
      .post(`${environment.apiUrlEditor2}/dividir-seleccion`, payload, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, 'resultado.zip');
          this.successMessage = '✅ PDF dividido correctamente';
          this.processing = false;
        },
        error: err => {
          console.error('Error al dividir:', err);
          this.errorMessage = '❌ Error al dividir el PDF';
          this.processing = false;
        }
      });
  }

  private executeRotate(pages: number[], degrees: number): void {
    if (!this.file?.id) return;

    this.processing = true;

    // Si no se especificaron páginas, rotar todas
    const pagesToRotate = pages.length > 0 ? pages : Array.from({ length: this.file.pages! }, (_, i) => i + 1);

    const payload = {
      archivo_id: this.file.id,
      paginas: pagesToRotate,
      grados: degrees
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });

    this.http
      .post(`${environment.apiUrlEditor2}/rotar`, payload, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, this.file?.name || 'archivo_rotado.pdf');
          this.updatePreview(blob);
          this.successMessage = '✅ Páginas rotadas correctamente';
          this.processing = false;
        },
        error: err => {
          this.errorMessage = '❌ Error al rotar páginas';
          this.processing = false;
        }
      });
  }

  private executeDelete(pagesToDelete: number[]): void {
    if (!this.file?.id) {
      this.errorMessage = 'No hay archivo seleccionado';
      return;
    }

    console.log('🗑️ Páginas a eliminar (input):', pagesToDelete);

    this.processing = true;

    // Convertir a base 0 (restar 1 a cada página)
    const paginasBase0 = pagesToDelete.map(p => p - 1);

    const payload = {
      archivo_id: this.file.id,
      paginas: paginasBase0
    };

    console.log('📤 Payload final:', JSON.stringify(payload, null, 2));

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });

    console.log('🚀 Enviando petición a:', `${environment.apiUrlEditor2}/eliminar`);

    this.http
      .post(`${environment.apiUrlEditor2}/eliminar`, payload, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          console.log('✅ Respuesta recibida, tamaño:', blob.size);
          this.downloadBlob(blob, this.file?.name || 'archivo_editado.pdf');
          this.updatePreview(blob);
          this.successMessage = `✅ ${pagesToDelete.length} página(s) eliminada(s) correctamente`;
          this.processing = false;
        },
        error: err => {
          console.error('❌ Error completo:', err);
          console.error('📋 Status:', err.status);
          console.error('📋 Error body:', err.error);
          this.errorMessage = err.error?.detail || '❌ Error al eliminar páginas';
          this.processing = false;
        }
      });
  }

  private executeReorder(order: number[]): void {
    if (!this.file?.id) return;

    this.processing = true;

    const payload = {
      archivo_id: this.file.id,
      nuevo_orden: order
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });

    this.http
      .post(`${environment.apiUrlEditor2}/reorganizar`, payload, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, this.file?.name || 'archivo_reorganizado.pdf');
          this.updatePreview(blob);
          this.successMessage = '✅ Páginas reorganizadas correctamente';
          this.processing = false;
        },
        error: err => {
          this.errorMessage = '❌ Error al reorganizar páginas';
          this.processing = false;
        }
      });
  }

  // ==================== UTILIDADES ====================

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private updatePreview(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
