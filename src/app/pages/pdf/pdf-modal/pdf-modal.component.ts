import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray,DragDropModule } from '@angular/cdk/drag-drop';

export type ModalAction = 'merge' | 'split' | 'rotate' | 'delete' | 'reorder' | 'extract';

export interface ModalConfig {
  action: ModalAction;
  totalPages: number;
  fileName: string;
}

export interface ModalResult {
  action: ModalAction;
  data: any;
}

@Component({
  selector: 'app-pdf-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './pdf-modal.component.html',
  styleUrls: ['./pdf-modal.component.scss']

})
export class PdfModalComponent implements OnInit {
  @Input() config!: ModalConfig;
  @Output() confirm = new EventEmitter<ModalResult>();
  @Output() cancel = new EventEmitter<void>();

  // Campos del formulario
  pageRangeInput: string = '';
  rotationDegrees: number = 90;
  newOrder: string = '';
  selectedPages: Record<number, boolean> = {};
  totalPagesArray: number[] = [];
  reorderPages: number[] = [];

  // UI
  errorMessage: string = '';
i: any;

  ngOnInit(): void {
    if (this.config.totalPages > 0) {
      this.totalPagesArray = Array.from(
        { length: this.config.totalPages },
        (_, i) => i + 1
      );

      // Inicializar todos los checkboxes como seleccionados
      this.selectedPages = {};
      this.totalPagesArray.forEach(p => (this.selectedPages[p] = true));
    }

    // Valores por defecto según la acción
    if (this.config.action === 'reorder' && this.config.totalPages > 0) {
      this.newOrder = this.totalPagesArray.join(',');
    }
    if (this.config.action === 'reorder') {
    this.reorderPages = [...this.totalPagesArray]; // copia del array de páginas
}
  }

  getTitle(): string {
    const titles = {
      merge: 'Unir PDFs',
      split: 'Dividir PDF',
      rotate: 'Rotar Páginas',
      delete: 'Eliminar Páginas',
      reorder: 'Reorganizar Páginas',
      extract: 'Extraer Páginas'
    };
    return titles[this.config.action];
  }

  getDescription(): string {
    const descriptions = {
      merge: 'Los archivos se unirán en el orden mostrado',
      split: 'Ingresa las páginas que deseas mantener en el nuevo PDF',
      rotate: 'Selecciona el ángulo de rotación para las páginas',
      delete: 'Desmarca las páginas que deseas eliminar',
      reorder: 'Arrastra las páginas para reordenarlas',
      extract: 'Ingresa las páginas que deseas extraer'
    };
    return descriptions[this.config.action];
  }

  onConfirm(): void {
    this.errorMessage = '';
    let result: ModalResult | null = null;

    try {
      switch (this.config.action) {
        case 'merge':
          result = {
            action: 'merge',
            data: { confirmed: true }
          };
          break;

        case 'split':
            const groups: number[][] = [];

            for (const r of this.splitRanges) {
                const parsed = this.parsePageRange(r);

                if (parsed.length === 0) {
                this.errorMessage = 'Todos los rangos deben ser válidos';
                return;
                }

                groups.push(parsed);
            }

            result = {
                action: 'split',
                data: { paginas: groups }
            };
            break;


        case 'rotate':
          const rotatePages = this.parsePageRange(this.pageRangeInput);
          if (rotatePages.length === 0) {
            this.errorMessage = 'Ingresa al menos una página válida';
            return;
          }
          result = {
            action: 'rotate',
            data: {
              pages: rotatePages,
              degrees: this.rotationDegrees
            }
          };
          break;

        case 'delete':
          const pagesToKeep = Object.entries(this.selectedPages)
            .filter(([_, checked]) => checked) // Páginas MARCADAS = mantener
            .map(([page]) => Number(page));

          const pagesToDelete = Object.entries(this.selectedPages)
            .filter(([_, checked]) => !checked) // Páginas DESMARCADAS = eliminar
            .map(([page]) => Number(page));

          console.log('🔍 Modal - Páginas a mantener:', pagesToKeep);
          console.log('🔍 Modal - Páginas a eliminar:', pagesToDelete);

          if (pagesToDelete.length === 0) {
            this.errorMessage = 'Desmarca al menos una página para eliminar';
            return;
          }

          if (pagesToKeep.length === 0) {
            this.errorMessage = 'No puedes eliminar todas las páginas';
            return;
          }

          result = {
            action: 'delete',
            data: {
              pagesToDelete: pagesToDelete,
              pagesToKeep: pagesToKeep
            }
          };

          console.log('📤 Modal enviando resultado:', result);
          break;

        case 'reorder':
          if (this.reorderPages.length !== this.config.totalPages) {
              this.errorMessage = 'El orden está incompleto.';
              return;
          }

          result = {
              action: 'reorder',
              data: { order: this.reorderPages }
          };
          break;


        case 'extract':
          const extractPages = this.parsePageRange(this.pageRangeInput);
          if (extractPages.length === 0) {
            this.errorMessage = 'Ingresa al menos una página válida';
            return;
          }
          result = {
            action: 'extract',
            data: { pages: extractPages }
          };
          break;
      }

      if (result) {
        this.confirm.emit(result);
      }
    } catch (error) {
      this.errorMessage = 'Error al procesar los datos';
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  toggleAllPages(checked: boolean): void {
    this.totalPagesArray.forEach(p => (this.selectedPages[p] = checked));
  }

  private parsePageRange(rangeStr: string): number[] {
    if (!rangeStr.trim()) return [];

    const pages: number[] = [];
    const parts = rangeStr.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = Number(startStr);
        const end = Number(endStr);

        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= this.config.totalPages) {
              pages.push(i);
            }
          }
        }
      } else {
        const num = Number(part);
        if (!isNaN(num) && num >= 1 && num <= this.config.totalPages) {
          pages.push(num);
        }
      }
    }

    return Array.from(new Set(pages)).sort((a, b) => a - b);
  }

  getSelectedCount(): number {
    return Object.values(this.selectedPages).filter(v => v).length;
  }

  // CAMPOS NUEVOS PARA MULTI-RANGOS
splitRanges: string[] = [''];

addRange() {
  this.splitRanges.push('');
}

removeRange(index: number) {
  if (this.splitRanges.length > 1) {
    this.splitRanges.splice(index, 1);
  }
}
trackByIndex(index: number, item: any): number {
  return index;
}

onDrop(event: CdkDragDrop<number[]>) {
  moveItemInArray(this.reorderPages, event.previousIndex, event.currentIndex);
}

}
