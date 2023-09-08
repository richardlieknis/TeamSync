import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Channel } from 'src/models/channel.class';
import { SidenavService } from 'src/app/shared/services/sidenav.service';
import { UserService } from 'src/app/shared/services/user.service';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatDrawer;
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any) {
    this.updateDrawerMode(event.target.innerWidth);
  }

  updateDrawerMode(windowWidth: any) {
    console.log(this.drawer);
    if (windowWidth < 950){
      this.drawer.mode = 'over';
      this.drawer.open();
    } else {
      this.drawer.mode = 'side';
      this.drawer.open();}
  }
  width!: number;
  leftSidenavOpen: boolean = true;

  toggleDrawer(test: any) {
    this.drawer.toggle();
  }

  /**
   * HostListener listens to the resize event on the window. If innerWidth is less than 768px,
   * then the left sidenav is hidden automatically. Otherwise the left sidenav is shown (again). 
   **/
  // @HostListener('window:resize', ['$event'])
  // onResize(event: any) {
  //   if (event.target.innerWidth < 768) {
  //     this.width = event.target.innerWidth;
  //     this.sidenavService.openSidenav.emit(false);
  //   } else {
  //     this.width = event.target.innerWidth;
  //     this.sidenavService.openSidenav.emit(true);
  //   }
  // }

  activeChannel!: Channel;
  placeholder!: string;


  constructor(
    public sidenavService: SidenavService,
    private channelService: ChannelService,
    private userService: UserService
    ) { }


  ngOnInit(): void {
    this.sidenavService.openSidenav.subscribe((response) => {
      this.leftSidenavOpen = response;
    });
    // Change Listeners must be loaded after Login otherwise no permission to query the database.
    this.channelService.startListening();
    this.userService.startListening();
  }


  ngOnDestroy(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateDrawerMode(window.innerWidth);
    }, 0)
  }


  setActiveChannel(event: Channel) {
    this.activeChannel = event;
    this.placeholder = `Type your message here in ${this.activeChannel.name}...`;
  }
    
}
