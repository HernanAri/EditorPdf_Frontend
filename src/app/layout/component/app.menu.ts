import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    constructor(private router: Router) {}

    ngOnInit() {
        this.model = [
            {
                label: 'Inicio',
                items: [
                    { 
                        label: 'Subir PDFs', 
                        icon: 'pi pi-fw pi-upload', 
                        routerLink: ['/pdf/workflow'] 
                    },
                    {
                        label: 'Editar PDFs', 
                        icon: 'pi pi-fw pi-pencil', 
                        command: () => {

                            this.router.navigate(['/pdf/workflow'], { 
                                queryParams: { tool: 'editor' } 
                            });
                        }
                    },
                    { 
                        label: 'Convertir PDFs', 
                        icon: 'pi pi-fw pi-sync', 
                        command: () => {

                            this.router.navigate(['/pdf/workflow'], { 
                                queryParams: { tool: 'convertidor' } 
                            });
                        }
                    }
                ]
            }
        ];
    }
}