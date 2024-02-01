import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
    @Input() currentPage!: number;
    @Input() numberOfPages!: number;
    @Output() pageChange = new EventEmitter<number>();
    @Output() nextPageClick = new EventEmitter<void>();
    @Output() previousPageClick = new EventEmitter<void>();
  
    nextPage(): void {
      this.nextPageClick.emit();
    }
  
    previousPage(): void {
      this.previousPageClick.emit();
    }

    onPageChange(pageNumber: number): void {
        this.pageChange.emit(pageNumber);
    }

    get pages(): number[] {
        return Array.from({ length: this.numberOfPages }, (_, i) => i + 1);
    }
}
