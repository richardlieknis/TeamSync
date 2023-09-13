import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { collection } from '@firebase/firestore';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchResults: string[] = [];
  searchResultsChanged: Subject<string[]> = new Subject<string[]>();
  channelColl: any;

  constructor(
    private fs: Firestore
  ) { 
    this.channelColl = collection(this.fs, 'channels');
  }


  /**
   * The setSearchResults() method allows other components to set the search results, ...
   * ... and the getSearchResults() method retrieves the search results.
   * @param results
   */
  setSearchResults(results: string[]): void {
    this.searchResults = results;

    // Feed the searchResultsChanged-Subject with the new search results.
    this.searchResultsChanged.next(results);
  }


  getSearchResults(): string[] {
    return this.searchResults;
  }

  //NOTE - not in use
  async getChannelName(channelId: string) {
    const docRef = doc(this.channelColl, channelId);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    return data?['name']: 'this Channel';
  };
}
