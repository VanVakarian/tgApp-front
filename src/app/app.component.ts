import { Component } from '@angular/core';
import { AuthTgComponent } from './auth-tg/auth-tg.component';
import { MainComponent } from './main/main.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AuthTgComponent, MainComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  public title = 'cryptoapp-front';

  constructor() {}
}
