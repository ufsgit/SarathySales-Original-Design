import { Component, Input, Output, EventEmitter, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-branch-filter-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filter-wrapper">
      <label *ngIf="label" class="filter-label">{{ label }}</label>
      <div class="custom-select-container" (click)="$event.stopPropagation()">
        <div class="custom-select-trigger" (click)="toggleDropdown()">
          <span>{{ getSelectedBranchName() }}</span>
          <i class="fas fa-caret-down dropdown-arrow"></i>
        </div>
        <div class="custom-select-dropdown" *ngIf="isOpen()">
          <div class="dropdown-search-box">
            <input type="text"
                   [value]="searchTerm()"
                   (input)="onSearchInput($any($event.target).value)"
                   placeholder="SEARCH..."
                   (click)="$event.stopPropagation()">
          </div>
          <ul class="dropdown-options-list">
            <li (click)="onSelect('')">All</li>
            <li *ngFor="let b of filteredBranches()" (click)="onSelect(b.b_id)">
              {{b.branch_name}}
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-wrapper { display: flex; align-items: center; gap: 8px; }
    .filter-label { font-size: 13px; color: #555; }
    .custom-select-container { position: relative; width: 240px; font-family: sans-serif; }
    .custom-select-trigger { 
      padding: 6px 10px; border: 1px solid #ccc; border-radius: 3px; background: #fff;
      display: flex; justify-content: space-between; align-items: center; cursor: pointer;
      font-size: 13px; color: #333; min-height: 30px; box-sizing: border-box;
    }
    .custom-select-trigger .dropdown-arrow { font-size: 14px; color: #777; }
    
    .custom-select-dropdown { 
      position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #ccc;
      border-top: none; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
    }
    .dropdown-search-box { padding: 6px; }
    .dropdown-search-box input { 
      width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 2px; font-size: 12px; outline: none;
      box-sizing: border-box; color: #555;
    }
    .dropdown-search-box input::placeholder { color: #aaa; }
    
    .dropdown-options-list { margin: 0; padding: 0; list-style: none; max-height: 250px; overflow-y: auto; }
    .dropdown-options-list li { padding: 8px 10px; font-size: 13px; cursor: pointer; color: #444; }
    .dropdown-options-list li:hover { background-color: #f5f5f5; }
  `]
})
export class BranchFilterDropdownComponent {
  @Input() branches: any[] = [];
  @Input() selectedId: string | number = '';
  @Input() label: string = '';
  @Output() branchChange = new EventEmitter<string | number>();

  isOpen = signal(false);
  searchTerm = signal('');

  filteredBranches = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.branches.filter(b => b.branch_name?.toLowerCase().includes(term));
  });

  toggleDropdown() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.searchTerm.set('');
    }
  }

  onSearchInput(value: string) {
    this.searchTerm.set(value);
  }

  onSelect(id: string | number) {
    this.isOpen.set(false);
    this.branchChange.emit(id);
  }

  getSelectedBranchName(): string {
    if (!this.selectedId) return 'All';
    const branch = this.branches.find(b => b.b_id?.toString() === this.selectedId.toString());
    return branch ? branch.branch_name : 'All';
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isOpen.set(false);
  }
}
