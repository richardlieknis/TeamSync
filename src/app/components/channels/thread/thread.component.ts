import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { getAuth } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { EditorChangeContent, EditorChangeSelection } from 'ngx-quill';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { UserService } from 'src/app/shared/services/user.service';
import { Channel } from 'src/models/channel.class';
import { Message } from 'src/models/message.class';
import { Thread } from 'src/models/thread.class';
import { User } from 'src/models/user.class';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})
export class ThreadComponent implements OnInit, OnDestroy {

  @ViewChild('chatContainer') chatContainer!: ElementRef;


  collectedContent!: any;

  users!: User[];
  user!: User;
  thread!: Thread;
  threadId!: string;
  messageIds!: string[];
  messages!: Message[];
  channel!: Channel;

  // Subscriptions
  userSub!: Subscription;
  paramsSub!: Subscription;

  config = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['emoji'],
      ['link'],
      ['image'],
    ],
    'emoji-toolbar': true,
    'emoji-textarea': false,
    'emoji-shortname': true,
    keyboard: {
      bindings: {
        short_enter: {
          key: 13,
          shortKey: true,
          handler: () => {
            this.sendMessage();
          },
        },
      },
    },
  };


  constructor(
    private userService: UserService,
    public channelService: ChannelService,
    private route: ActivatedRoute,
    private router: Router
  ) {

  }


  ngOnInit(): void {
    // Loading the logged user
    this.userService.getSingleUserSnapshot(this.loggedUser()).then((onSnapshot) => {
      this.user = onSnapshot.data() as User;
    });

    this.paramsSub = this.route.params.subscribe(async (params) => {
      if (params['id']) {
        this.threadId = params['id'];
        this.loadThread(this.threadId);
      }
    });

    this.userSub = this.userService.allUsers$.subscribe(users => {
      this.users = users;
    });
  }


  ngOnDestroy(): void {
    console.log('ThreadComponent destroyed');
    this.paramsSub.unsubscribe();
    this.userSub.unsubscribe();
  }


  async loadThread(threadId: string) {
    this.channelService.getThread(threadId).then(thread => {
      this.thread = thread.data() as Thread;
      this.messageIds = this.thread.messages;
      console.log("Thread: " + this.thread.threadId + " has messages: " + this.messageIds);
      this.loadMessages();
    });
  }


  async loadMessages() {
    this.channelService.getMessagesForThread(this.messageIds).then(messages => {
      this.messages = messages.docs.map(doc => doc.data() as Message).sort((a, b) => a.creationDate.seconds - b.creationDate.seconds);
      console.log("Messages: ", this.messages);
    });
  }


  getChannel(channel: Channel) {
    console.log("Channel: " + channel.name);
    this.channel = channel;
    return channel.name;
  }

  /**
   * Filles collectedContent with the current content in the editor.
   * @param event 
   */
  async collectContent(event: EditorChangeContent | EditorChangeSelection) {
    event.event === 'text-change' ? this.collectedContent = event.html : null;
  }


  async sendMessage() {
    if (this.collectedContent != null && this.collectedContent != '') {
      let now = new Date().getTime() / 1000;
      let message = new Message({ messageId: '', creatorId: this.loggedUser(), creationDate: new Timestamp(now, 0), text: this.collectedContent });
      console.log("Adding message: " + message.messageId + " to thread: " + this.threadId)
      await this.channelService.setMessage(message, undefined ,this.thread);
      var element = document.getElementsByClassName("ql-editor");
      element[0].innerHTML = "";
      this.scrollDown(); // Scroll down to the latest message
    }
  }

  /**
   * Returns either the logged user or a default user id.
   * @returns the logged user id.
   */
  loggedUser() {
    const auth = getAuth();
    if (auth.currentUser) {
      return auth.currentUser.uid;
    } else {
      return 'Zta41sUcC7rLGHbpMmn4';
    }
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


  getUserProfile(message: Message) {
    let user = this.users.find(user => user.userId === message.creatorId);
    return user?.profilePicture != '' ? user?.profilePicture : '/../../assets/img/profile.png';
  }


  scrollDown() {
    setTimeout(() => {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }, 500);
  }


  closeThread() {
    this.router.navigate([`dashboard/channel/${this.channelService.channelId}`]);
  }
}
