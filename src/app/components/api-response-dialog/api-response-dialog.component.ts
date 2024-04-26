import { Component, Inject, Input } from '@angular/core';
import { MaterialModule } from '../../../material-module';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MyFormsModule } from '../../../forms-module';
import { ShowComponent } from '../show/show.component';

@Component({
  selector: 'app-api-response-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    MyFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    ShowComponent,
  ],
  templateUrl: './api-response-dialog.component.html',
  styleUrl: './api-response-dialog.component.scss',
})
export class ApiResponseDialogComponent {
  animal: string = '';

  constructor(
    public dialogRef: MatDialogRef<ApiResponseDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { icon: string; title: string; buildingInsights: any }
  ) {}
  onNoClick() {
    this.dialogRef.close();
  }
  closeDialog() {
    this.dialogRef.close();
  }
}
