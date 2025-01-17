import { AfterViewInit, Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { DialogAddChannelComponent } from '../../dialogs/dialog-add-channel/dialog-add-channel.component';
import { MatDialog } from '@angular/material/dialog';
import { Channel } from 'src/models/channel.class';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { SidenavService } from 'src/app/shared/services/sidenav.service';
import { Observable, Subscription } from 'rxjs';
import { MatDrawer } from '@angular/material/sidenav';
import { DashboardComponent } from '../../dashboard/dashboard.component';


@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  providers: [DashboardComponent]
})
export class sidenavComponent implements OnInit {
  @Output() drawer = new EventEmitter<boolean>();
  channelsCollapsed = false;
  messagesCollapsed = false;

  sidenavOpen: boolean = true;

  channel: Channel = new Channel();
  allChannels$!: Observable<Channel[]>;

  // Subscriptions
  channelSub!: Subscription;


  constructor(
    public dialog: MatDialog,
    public auth: AngularFireAuth,
    private channelService: ChannelService,
    public sidenavService: SidenavService,
    public dashboardComponent: DashboardComponent,
  ) { }


  ngOnInit(): void {
    this.loadChannels();
    this.handleSidenavVisibility();
  }

  toggleDrawer() {
    // this.sidenavOpen = !this.sidenavOpen;
    this.drawer.emit(this.sidenavOpen);
  }

  toggleMobileDrawer() {
    if (window.innerWidth < 950) {
      this.drawer.emit(this.sidenavOpen);
    }
  }


  /**
   * Loads all channels from the database as an observable. Then it pipes the response
   * of the promised observable in order to get the channel with the name 'Main' and
   * navigates to the dashboard/channel/:channelId route.
   */
  loadChannels() {
    this.allChannels$ = this.channelService.allChannels$;
  }


  handleSidenavVisibility() {
    this.sidenavService.openSidenav.subscribe((response) => {
      this.sidenavOpen = response;
    });
  }


  openDialog() {
    const dialogRef = this.dialog.open(DialogAddChannelComponent);

    dialogRef.afterClosed().subscribe(async (dialogData) => {
      if (dialogData && dialogData.name) {
        this.createChannel(dialogData.name);
      }
    });
  }


  async createChannel(dialogData: string) {
    // ggf noch den aktuellen User als Member hinzufügen
    this.channel = new Channel();
    this.channel.name = dialogData;
    this.channel.creatorId = await this.auth.currentUser.then((user) => user?.uid || '');
    this.channel.members.push(this.channel.creatorId);
    this.channelService.setChannel(this.channel);

  }


  toggleChannelsDropdown() {
    this.channelsCollapsed = !this.channelsCollapsed;
  }


  toggleMessagesDropdown() {
    this.messagesCollapsed = !this.messagesCollapsed;
  }


  /**
   * toggle the sidenav if the screen size is less than 768px
   */
  toggleSidenav() {
    if (window.innerWidth < 768) {
      this.sidenavService.openSidenav.emit(!this.sidenavOpen);
    }
  }
}
