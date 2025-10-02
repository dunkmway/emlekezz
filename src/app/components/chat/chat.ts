import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-chat',
  imports: [MatFormFieldModule, MatInputModule, TextFieldModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {}
