import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogHelpComponent } from '../dialog-help/dialog-help.component';
import { DialogLegalComponent } from '../dialog-legal/dialog-legal.component';
import { SidenavService } from 'src/app/shared/services/sidenav.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { SearchService } from './../../shared/services/search.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Subscription } from 'rxjs';
import { set } from '@angular/fire/database';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnDestroy, OnInit {

  sidenavOpen: boolean = true;
  userProfileOpen: boolean = false;

  // Subscriptions
  sidenavSub!: Subscription;


  constructor(
    public dialog: MatDialog,
    public asService: AngularFireAuth,
    private sidenavService: SidenavService,
    public channelService: ChannelService,
    public searchService: SearchService,
    private authService: AuthService
  ) { }


  ngOnInit(): void {
    this.sidenavSub = this.sidenavService.openSidenav.subscribe((response) => {
      this.sidenavOpen = response;
    });
  }


  ngOnDestroy(): void {
    console.log('ToolbarComponent destroyed');
    this.sidenavSub.unsubscribe();
  }


  /**
   * Transfers the search term to the search service.
   * @param searchTerm as string.
   */
  onSearchText(searchTerm: string): void {
    const searchResults = [searchTerm];
    this.searchService.setSearchResults(searchResults);
  }


  openDialogHelp() {
    const dialogRef = this.dialog.open(DialogHelpComponent);

    dialogRef.afterClosed().subscribe(result => {

    });
  }


  openDialogLegal() {
    const dialogRef = this.dialog.open(DialogLegalComponent);

    dialogRef.afterClosed().subscribe(result => {

    });
  }


  openUserProfile() {
    this.sidenavService.openUserProfile.emit(!this.userProfileOpen);
  }


  toggleSidenav() {
    this.sidenavService.openSidenav.emit(!this.sidenavOpen);
  }


  logoutUser() {
    this.channelService.unsubscribe(); // Unsubscribe form Change-Listener to prevent memory leaks.
    if (this.channelService.channelSub != undefined) {
      this.channelService.channelSub.unsubscribe(); // Part of Change-Listener
    }
    if (this.channelService.channelSub2 != undefined) {
      this.channelService.channelSub2.unsubscribe(); // Part of Change-Listener
    }
    this.authService.logout();
  }

}
