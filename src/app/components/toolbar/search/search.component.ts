import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SearchService } from 'src/app/shared/services/search.service';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  searchTerm: string = ''; // linked to input
  @Output() searchEvent: EventEmitter<string> = new EventEmitter<string>(); // EventEmitter requires Output
  placeholder: string = 'react';

  constructor(
    private route: Router,
    private searchServie: SearchService) {}

  /**
   * The search-Function is triggered when the user types in the search input field.
   * It emits the 'searchTerm'-value using the 'searchEvent'-emitter.
   * The parent component ('toolbar') can then listen to this event and handle the search functionality accordingly.
   */

  search(): void {
    this.searchEvent.emit(this.searchTerm);
  }

  getPlaceholder(): string {
    const currentRoute = this.route.url;
    const routeName = currentRoute.split('/')[1];
    return `Search in #${routeName}`;
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchEvent.emit('');
  }
}
