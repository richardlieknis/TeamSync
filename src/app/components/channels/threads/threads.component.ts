import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { SearchService } from 'src/app/shared/services/search.service';
import { Channel } from 'src/models/channel.class';
import { Message } from 'src/models/message.class';
import { Thread } from 'src/models/thread.class';
import { User } from 'src/models/user.class';

@Component({
  selector: 'app-threads',
  templateUrl: './threads.component.html',
  styleUrls: ['./threads.component.scss']
})
export class ThreadsComponent {

  @Input() channel!: Channel;
  @Input() users!: User[];
  allMsgs: Message[] = [];

  // Subscriptions
  searchSub!: Subscription;

  searchResults!: string[];


  constructor(
    public channelService: ChannelService,
    private searchService: SearchService,
  ) {}


  async ngOnInit(): Promise<void> {
    this.allMsgs = await this.channelService.getAllMsgs();
    this.handleSearchbar();
  }


  ngOnDestroy(): void {
    this.searchSub.unsubscribe();
  }


  handleSearchbar() {
    // Search filter (import from searchService)
    this.searchResults = this.searchService.getSearchResults();
    this.searchSub = this.searchService.searchResultsChanged.subscribe((results: string[]) => {
      this.searchResults = results;
    });
  }

  /**
   * Finds the user displayName by the user id.
   * @param userId as string.
   * @returns a string with the user displayName.
   */
  getUserName(userId: string) {
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].userId === userId) {
        return this.users[i].displayName;
      }
    }
    return 'Unknown';
  }

  setReplyUserImg(msgId: string) {
    const msgCreator = this.getMsgCreator(msgId);
    const userImage = this.getUserImage(msgCreator[0]);
    return userImage;
  }

  getUserImage(userId: string) {
    let userImage: string[] = [];
    this.users.forEach(user => {
      if (user.userId === userId) {
        userImage.push(user.profilePicture);
      }
    });
    return userImage;
  }

  /**
   * Get pre saved message by message id.
   * @param msgId message id as string.
   * @returns id of the message creator as string.
   */
  getMsgCreator(msgId: string) {
    let msgCreator: string[] = [];
    this.allMsgs.forEach(msg => {
      if (msg.messageId === msgId) {
        msgCreator.push(msg.creatorId);
      };
    });
    return msgCreator;
  }


  openThread(thread: Thread) {
    return `/thread/${thread.threadId}`;
  }
}