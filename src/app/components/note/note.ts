import { TextFieldModule } from '@angular/cdk/text-field';
import { Component, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { currentNoteTab, TabOptions, Tabs } from '../tabs/tabs';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-note',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
    Tabs,
    MarkdownComponent,
  ],
  templateUrl: './note.html',
  styleUrl: './note.scss',
})
export class Note {
  readonly tabs = signal<TabOptions[]>([
    {
      id: '1',
      name: 'This really has content',
      content: `# Markdown syntax guide

## Headers

# This is a Heading h1
## This is a Heading h2
###### This is a Heading h6

## Emphasis

*This text will be italic*  
_This will also be italic_

**This text will be bold**  
__This will also be bold__

_You **can** combine them_

## Lists

### Unordered

* Item 1
* Item 2
* Item 2a
* Item 2b
    * Item 3a
    * Item 3b

### Ordered

1. Item 1
2. Item 2
3. Item 3
    1. Item 3a
    2. Item 3b

## Images

![This is an alt text.](/image/sample.webp "This is a sample image.")

## Links

You may be using [Markdown Live Preview](https://markdownlivepreview.com/).

## Blockquotes

> Markdown is a lightweight markup language with plain-text-formatting syntax, created in 2004 by John Gruber with Aaron Swartz.
>
>> Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.

## Tables

| Left columns  | Right columns |
| ------------- |:-------------:|
| left foo      | right foo     |
| left bar      | right bar     |
| left baz      | right baz     |
`,
    },
    {
      id: '2',
      name: "Manager's Moment",
      content: 'No content',
    },
    {
      id: '3',
      name: 'Random Notes',
      content: 'No content',
    },
  ]);

  protected currentNoteTab = currentNoteTab;
  protected selectedTab = signal<TabOptions>(currentNoteTab);

  protected handleKeydown(event: KeyboardEvent) {
    const key = event.key;
    const target = event.target as HTMLInputElement;
    const selectionStart = target.selectionStart!;
    const selectionEnd = target.selectionEnd!;

    if (key === 'Tab') {
      event.preventDefault();
      target.value =
        target.value.substring(0, selectionStart) +
        '\t' +
        target.value.substring(selectionEnd);
      target.selectionStart = target.selectionEnd = selectionStart + 1;
    } else if (key === 'b' && event.ctrlKey) {
      event.preventDefault();
      target.value =
        target.value.substring(0, selectionStart) +
        '**' +
        target.value.substring(selectionStart, selectionEnd) +
        '**' +
        target.value.substring(selectionEnd);
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    } else if (key === 'i' && event.ctrlKey) {
      event.preventDefault();
      target.value =
        target.value.substring(0, selectionStart) +
        '*' +
        target.value.substring(selectionStart, selectionEnd) +
        '*' +
        target.value.substring(selectionEnd);
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    }
  }
}
