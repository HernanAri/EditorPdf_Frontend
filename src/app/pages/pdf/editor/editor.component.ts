import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PdfFile } from '../upload/upload.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { firstValueFrom } from 'rxjs';
import { PdfModalComponent, ModalConfig, ModalResult } from '../pdf-modal/pdf-modal.component';

const configurePdfWorker = () => {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch (error) {
    console.warn('⚠️ Worker local no disponible, usando CDN');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
};

configurePdfWorker();

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfModalComponent],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnChanges, OnDestroy {
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

  private blobUrls: string[] = []; // Para rastrear todos los blob URLs creados

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['file'] && this.file) {
      this.clearMessages();

      try {
        // Calcular páginas si no están definidas
        if (!this.file.pages || this.file.pages === 0) {
          await this.calculatePages();
        }

        // Cargar preview si tiene ID
        if (this.file.id) {
          this.loadPdfPreview(this.file.id);
        }
      } catch (err) {
        console.error('❌ Error al procesar archivo', err);
        this.errorMessage = 'No se pudo procesar el archivo';
        // Asignar valor por defecto
        if (this.file) {
          this.file.pages = 1;
        }
      }
    }
  }

  private async calculatePages(): Promise<void> {
    if (!this.file) {
      console.log('⚠️ No hay archivo para calcular páginas');
      return;
    }

    console.log('🔍 Iniciando cálculo de páginas para:', this.file.name);
    console.log('📋 Datos del archivo:', {
      hasFile: !!this.file.file,
      hasId: !!this.file.id,
      currentPages: this.file.pages
    });

    try {
      // Caso 1: Archivo desde input local (File object)
      if (this.file.file) {
        console.log('📁 Procesando archivo local...');
        const pageCount = await this.getPdfPageCount(this.file.file);
        this.file.pages = pageCount;
        console.log(`✅ Páginas calculadas (archivo local): ${pageCount}`);
        return;
      }

      // Caso 2: Archivo desde servidor (por ID)
      if (this.file.id) {
        console.log('🌐 Descargando archivo del servidor...');
        const blob = await this.fetchFileBlob(this.file.id);
        console.log('📦 Blob recibido, tamaño:', blob.size, 'tipo:', blob.type);
        const pageCount = await this.getTotalPages(blob);
        this.file.pages = pageCount;
        console.log(`✅ Páginas calculadas (servidor): ${pageCount}`);
        return;
      }

      // Si no hay ni file ni id, usar valor por defecto
      console.warn('⚠️ No se encontró ni File ni ID, usando valor por defecto');
      this.file.pages = 1;
    } catch (err) {
      console.error('❌ Error detallado al calcular páginas:', err);
      if (err instanceof Error) {
        console.error('  Mensaje:', err.message);
        console.error('  Stack:', err.stack);
      }
      this.file.pages = 1; // Valor por defecto en caso de error
      this.errorMessage = 'No se pudo calcular el número de páginas del PDF';
    }
  }

  private async fetchFileBlob(fileId: string): Promise<Blob> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    return await firstValueFrom(
      this.http.get(`${environment.apiUrlUpload}/pdf-file/obtener/${fileId}`, {
        responseType: 'blob',
        headers
      })
    );
  }

  private loadPdfPreview(fileId: string): void {
    this.loadingPreview = true;
    
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http
      .get(`${environment.apiUrlUpload}/pdf-file/preview/${fileId}`, { 
        headers, 
        responseType: 'blob' 
      })
      .subscribe({
        next: (blob: Blob) => {
          // Limpiar preview anterior
          this.revokeCurrentPreview();
          
          // Crear nuevo blob URL
          const url = URL.createObjectURL(blob);
          this.blobUrls.push(url); // Rastrear para limpieza posterior
          this.currentBlobUrl = url;
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.loadingPreview = false;
        },
        error: (err) => {
          console.error('❌ Error al cargar preview:', err);
          this.errorMessage = '❌ No se pudo cargar la vista previa';
          this.loadingPreview = false;
        }
      });
  }

  private revokeCurrentPreview(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  ngOnDestroy(): void {
    // Limpiar todos los blob URLs creados
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
    this.blobUrls = [];
    
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
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
    if (!this.file?.id) {
      this.errorMessage = 'No hay archivo para descargar';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http
      .get(`${environment.apiUrlUpload}/pdf-file/obtener/${this.file.id}`, { 
        headers, 
        responseType: 'blob' 
      })
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, this.file?.name || 'archivo.pdf');
        },
        error: (err) => {
          console.error('❌ Error al descargar:', err);
          this.errorMessage = '❌ Error al descargar el archivo';
        }
      });
  }

  private async getPdfPageCount(file: File): Promise<number> {
    console.log('📖 Leyendo archivo:', file.name, 'Tamaño:', file.size);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('✅ ArrayBuffer obtenido, tamaño:', arrayBuffer.byteLength);
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 // Reducir logs de pdf.js
      });
      
      console.log('⏳ Cargando documento PDF...');
      const pdf = await loadingTask.promise;
      
      console.log('✅ PDF cargado exitosamente');
      console.log('📄 Número de páginas:', pdf.numPages);
      
      return pdf.numPages;
    } catch (error) {
      console.error('❌ Error detallado en getPdfPageCount:', error);
      if (error instanceof Error) {
        console.error('  Tipo de error:', error.name);
        console.error('  Mensaje:', error.message);
        console.error('  Stack:', error.stack);
      }
      throw new Error(`No se pudo leer el archivo PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  private async getTotalPages(blob: Blob): Promise<number> {
    console.log('📦 Procesando blob:', blob.size, 'bytes, tipo:', blob.type);
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      console.log('✅ ArrayBuffer del blob obtenido, tamaño:', arrayBuffer.byteLength);
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0
      });
      
      console.log('⏳ Cargando documento PDF desde blob...');
      const pdfDoc: PDFDocumentProxy = await loadingTask.promise;
      
      console.log('✅ PDF cargado exitosamente desde blob');
      console.log('📄 Número de páginas:', pdfDoc.numPages);
      
      return pdfDoc.numPages;
    } catch (error) {
      console.error('❌ Error detallado en getTotalPages:', error);
      if (error instanceof Error) {
        console.error('  Tipo de error:', error.name);
        console.error('  Mensaje:', error.message);
      }
      throw new Error(`No se pudo leer el PDF desde blob: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
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
        if (!result.data.pagesToDelete || !Array.isArray(result.data.pagesToDelete)) {
          console.error('❌ pagesToDelete no válido:', result.data);
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

    const fileIds = this.allFiles.map(f => f.id).filter(id => id); // Filtrar IDs nulos
    
    if (fileIds.length < 2) {
      this.errorMessage = 'No hay suficientes archivos con ID para unir';
      this.processing = false;
      return;
    }

    const headers = this.getAuthHeaders();

    this.http
      .post(`${environment.apiUrlEditor}/unir`, 
        { archivos: fileIds }, 
        { headers, responseType: 'blob' }
      )
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, 'pdf_unido.pdf');
          this.successMessage = '✅ PDFs unidos correctamente';
          this.processing = false;
        },
        error: err => {
          console.error('Error al unir:', err);
          this.errorMessage = err.error?.detail || '❌ Error al unir los PDFs';
          this.processing = false;
        }
      });
  }

  private executeSplit(groups: number[][]): void {
    if (!this.file?.id) {
      this.errorMessage = 'No hay archivo seleccionado';
      return;
    }

    this.processing = true;

    const payload = {
      archivo_id: this.file.id,
      paginas: groups
    };

    const headers = this.getAuthHeaders();

    this.http
      .post(`${environment.apiUrlEditor}/dividir-seleccion`, 
        payload, 
        { headers, responseType: 'blob' }
      )
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
    if (!this.file?.id) {
      this.errorMessage = 'No hay archivo seleccionado';
      return;
    }

    this.processing = true;

    // Si no se especificaron páginas, rotar todas
    const pagesToRotate = pages.length > 0 
      ? pages 
      : Array.from({ length: this.file.pages! }, (_, i) => i + 1);

    const payload = {
      archivo_id: this.file.id,
      paginas: pagesToRotate,
      grados: degrees
    };

    const headers = this.getAuthHeaders();

    this.http
      .post(`${environment.apiUrlEditor}/rotar`, 
        payload, 
        { headers, responseType: 'blob' }
      )
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, this.file?.name || 'archivo_rotado.pdf');
          this.updatePreview(blob);
          this.successMessage = '✅ Páginas rotadas correctamente';
          this.processing = false;
        },
        error: err => {
          console.error('Error al rotar:', err);
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

    const headers = this.getAuthHeaders();

    this.http
      .post(`${environment.apiUrlEditor}/eliminar`, 
        payload, 
        { headers, responseType: 'blob' }
      )
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
          this.errorMessage = err.error?.detail || '❌ Error al eliminar páginas';
          this.processing = false;
        }
      });
  }

  private executeReorder(order: number[]): void {
    if (!this.file?.id) {
      this.errorMessage = 'No hay archivo seleccionado';
      return;
    }

    this.processing = true;

    const payload = {
      archivo_id: this.file.id,
      nuevo_orden: order
    };

    const headers = this.getAuthHeaders();

    this.http
      .post(`${environment.apiUrlEditor}/reorganizar`, 
        payload, 
        { headers, responseType: 'blob' }
      )
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, this.file?.name || 'archivo_reorganizado.pdf');
          this.updatePreview(blob);
          this.successMessage = '✅ Páginas reorganizadas correctamente';
          this.processing = false;
        },
        error: err => {
          console.error('Error al reorganizar:', err);
          this.errorMessage = '❌ Error al reorganizar páginas';
          this.processing = false;
        }
      });
  }

  // ==================== UTILIDADES ====================

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private updatePreview(blob: Blob): void {
    // Limpiar preview anterior
    this.revokeCurrentPreview();
    
    // Crear nuevo preview
    const url = URL.createObjectURL(blob);
    this.blobUrls.push(url);
    this.currentBlobUrl = url;
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}