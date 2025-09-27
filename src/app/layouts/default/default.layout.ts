import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-default-layout',
  imports: [RouterOutlet],
  templateUrl: './default.layout.html',
  styleUrl: './default.layout.scss',
})
export class DefaultLayout {}
