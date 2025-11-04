import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `
        <div class="layout-footer">
            <div class="flex justify-center">
                <a class="layout-topbar-logo" routerLink="/">
                    <img src="assets/images/logo_emergia2.png" width="120" alt="">
                </a>
            </div>
        </div>`
})
export class AppFooter {}
