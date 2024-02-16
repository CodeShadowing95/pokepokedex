import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
})
export class PaginationComponent implements OnInit {
    @Input() currentPage!: number;
    @Input() numberOfPages!: number;
    @Input() totalPages!: number;
    @Output() pageChange = new EventEmitter<number>();
    @Output() nextPageClick = new EventEmitter<void>();
    @Output() previousPageClick = new EventEmitter<void>();

    ngOnInit(): void {
        this.pageChange.emit(this.currentPage);
    }
  
    nextPage(): void {
        if(this.currentPage < this.numberOfPages) {
            this.currentPage++;
            // this.nextPageClick.emit();
            this.pageChange.emit(this.currentPage);
        }
    }
  
    previousPage(): void {
        if(this.currentPage > 1) {
            this.currentPage--;
            // this.previousPageClick.emit();
            this.pageChange.emit(this.currentPage);
        }
    }

    onPageChange(pageNumber: number): void {
        this.pageChange.emit(pageNumber);
    }

    get pages(): number[] {
        return Array.from({ length: this.numberOfPages }, (_, i) => i + 1);
    }
}
