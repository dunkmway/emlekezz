import { Component, inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';

type ConfirmationConfig =
  | {
      title?: string;
      action?: string;
      description?: never;
      buttons?: readonly string[];
    }
  | {
      title?: string;
      action?: never;
      description?: string;
      buttons?: readonly string[];
    };

type ConfirmationResult<C extends ConfirmationConfig | undefined> = C extends {
  buttons: readonly string[];
}
  ? C['buttons'][number]
  : boolean;

@Component({
  selector: 'fhss-confirmation',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirmation.dialog.html',
  styleUrl: './confirmation.dialog.scss',
})
class ConfirmationDialogContainer {
  protected readonly config: ConfirmationConfig | undefined =
    inject(MAT_DIALOG_DATA);
}

@Injectable({ providedIn: 'root' })
export class ConfirmationDialog {
  private readonly dialog = inject(MatDialog);

  open<C extends ConfirmationConfig | undefined>(config?: C) {
    const dialogRef = this.dialog.open<
      ConfirmationDialogContainer,
      ConfirmationConfig,
      ConfirmationResult<C>
    >(ConfirmationDialogContainer, {
      data: config,
    });

    return dialogRef;
  }
}
