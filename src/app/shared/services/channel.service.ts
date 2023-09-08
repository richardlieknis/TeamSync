import { Injectable } from '@angular/core';
import { Firestore, Timestamp, collection, collectionData, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from '@angular/fire/firestore';
import { Observable, Subscriber, map } from 'rxjs';
import { Unsubscribe } from '@angular/fire/auth';

import { Channel } from 'src/models/channel.class';
import { Message } from 'src/models/message.class';
import { Thread } from 'src/models/thread.class';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {

  private threadRef = collection(this.firestore, 'threads');
  private messageRef = collection(this.firestore, 'messages');
  private channelRef = collection(this.firestore, 'channels');
  allChannels$ = collectionData(this.channelRef) as Observable<Channel[]>;

  threads: Thread[] = [];
  messages: Message[] = [];

  threadMessages$!: Observable<Message[]>;

  channelId!: string;


  // Setting up the query to listen for changes in the user collection.
  private qChannel = query(this.channelRef);
  private qThread = query(this.threadRef);
  unsubscribeChannel!: Unsubscribe;
  unsubscribeThread!: Unsubscribe;


  constructor(
    private firestore: Firestore,
  ) {
   }

  /**
  * Subscribes to the channel collection and listens for changes.
  * If a change occurs, the change is processed.
  */
  startListening() {
    this.unsubscribeChannel = onSnapshot(this.qChannel, (snapshot: { docChanges: () => any[]; }) => {
      snapshot.docChanges().forEach((change) => {
        change.type === "added" ? this.addNewChannel(change.doc.data()) : null;
        change.type === "modified" ? this.modifyChannel(change.doc.data()) : null;
      });
    });
    this.unsubscribeThread = onSnapshot(this.qThread, (snapshot: { docChanges: () => any[]; }) => {
      snapshot.docChanges().forEach((change) => {
        change.type === "modified" ? this.modifyThread(change.doc.data()) : null;
      });
    });
  }

  /**
   * Adds a new channel to the allChannels$ Observable.
   * @param change as any.
   */
  private async addNewChannel(change: any) {
    this.channelId === change.channelId ? await this.refreshChannelData(change.channelId, 'channelServiceIsAksing') : null;
    this.allChannels$.pipe(map(channels => {
      return [...channels, new Channel(change)]
    }));
  };

  /**
   * Updates a channel in the allChannels$ Observable.
   * @param change as any.
   */
  private async modifyChannel(change: any) {
    this.channelId === change.channelId ? await this.refreshChannelData(change.channelId, 'channelServiceIsAksing') : null;
    this.allChannels$.pipe(map(channels => {
      return channels.map(channel => {
        if (channel.channelId === change.channelId) {
          return change;
        }
        return channel;
      })
    }));
  }

  private async modifyThread(change: any) {
    this.getMessagesForThread(change.messages);
  }

  /**
   * Sets the active channelId.
   * @param channelId as string.
   */
  setChannelId(channelId: string) {
    this.channelId = channelId;
  }

  /**
   * Creates a new channel in the database.
   * @param channelName as string.
   */
  async setChannel(channel: Channel) {
    const docRef = doc(this.channelRef);

    channel.channelId = docRef.id;

    setDoc(docRef, channel.toJSON()).then(() => {
    }).catch((error) => {
      console.error('Error adding document: ', error);
    }
    );
  }

  /**
   * Main function for refreshing data from Local Storage or Firestore.
   * @param channelId as string.
   * @param whoIsAsking as string (either Channel or ChannelService.
   */
  async refreshChannelData(channelId: string, whoIsAsking: string) {
    if (this.isChannelAskingForNewChannel(channelId, whoIsAsking)) {
      this.refreshNewChannel(channelId);
    } else if (this.isChannelAskingForLocalStorage(channelId, whoIsAsking)) {
      this.loadFromLocalStorage(channelId);
    } else if (whoIsAsking == 'channelServiceIsAksing') {
      this.refreshOldChannel(channelId);
    }
  }


  isChannelAskingForNewChannel(channelId: string, whoIsAsking: string) {
    return localStorage.getItem(channelId) != channelId && whoIsAsking == 'channelIsAsking';
  }


  isChannelAskingForLocalStorage(channelId: string, whoIsAsking: string) {
    return localStorage.getItem(channelId) == channelId && whoIsAsking == 'channelIsAsking';
  }

  /**
   * If there is no corresponding Channel in LocalStorage, then data will be requested from Firestore and stored in LS.
   * @param channelId as string.
   */
  async refreshNewChannel(channelId: string) {
    this.threads = []; // If Channel has no messages yet, then arrays must be cleared to prevent displaying old channel's messages/threads.
    this.messages = [];
    localStorage.setItem(channelId, channelId);
    let channel = (await this.getChannel(channelId)).data() as Channel;
    if (channel.threads.length > 0) {
      this.threads = (await this.getThreads(channel.threads)).docs.map(doc => doc.data() as Thread).sort((a, b) => a.creationDate.seconds - b.creationDate.seconds);
      localStorage.setItem('threads/' + channelId, JSON.stringify(this.threads));
    } else {
      localStorage.setItem('threads/' + channelId, JSON.stringify([]));
      localStorage.setItem('messages/' + channelId, JSON.stringify([]));
    }
  }

  /**
   * If the Channel already exists in LocalStorage, then the data therein will be loaded.
   * @param channelId as string.
   */
  async loadFromLocalStorage(channelId: string) {
    this.threads = JSON.parse(localStorage.getItem('threads/' + channelId) || '[]').map((thread: Thread) => new Thread(thread).toJSON());
    this.messages = JSON.parse(localStorage.getItem('messages/' + channelId) || '[]').map((message: Message) => new Message(message).toJSON());
  }

  /**
   * If the ChannelService is asking, then a refresh from Firestore will be requested and updated in LS.
   * @param channelId as string.
   */
  async refreshOldChannel(channelId: string) {
    localStorage.setItem(channelId, channelId);
    let channel = (await this.getChannel(channelId)).data() as Channel;
    this.threads = (await this.getThreads(channel.threads)).docs.map(doc => doc.data() as Thread).sort((a, b) => a.creationDate.seconds - b.creationDate.seconds);
    localStorage.setItem('threads/' + channelId, JSON.stringify(this.threads));
  }


  async getChannel(channelId: string) {
    const docRef = doc(this.channelRef, channelId);
    return getDoc(docRef);
  }

  /**
   * Returns all threads for a given array of threadIds and loads the messages for each thread.
   * @param threadIds as string[].
   * @returns threads as QuerySnapshot.
   */
  async getThreads(threadIds: string[]) {
    if (threadIds.length <= 0) {
      return getDocs(query(this.threadRef)); //TODO: This is a workaround for a firestore error that occurs when a channel is created and no thread is created with it.
    }
    const q = query(this.threadRef, where('threadId', 'in', threadIds));
    await this.getMessages((await getDocs(q)).docs.map(doc => doc.data() as Thread).map(thread => thread.messages).flat());
    return getDocs(q);
  }


  async getMessages(messageIds: string[]) {
    const q = query(this.messageRef, where('messageId', 'in', messageIds));
    this.messages = (await getDocs(q)).docs.map(doc => doc.data() as Message).sort((a, b) => a.creationDate.seconds - b.creationDate.seconds);
    localStorage.setItem('messages/' + this.channelId, JSON.stringify(this.messages));
    return getDocs(q);
  }


  getThread(threadId: string) {
    const docRef = doc(this.threadRef, threadId);
    return getDoc(docRef);
  }


  async getMessagesForThread(messageIds: string[]) {
    const q = query(this.messageRef, where('messageId', 'in', messageIds));
    let values = (await getDocs(q)).docs.map(doc => doc.data() as Message).sort((a, b) => a.creationDate.seconds - b.creationDate.seconds);
    this.threadMessages$ = new Observable<Message[]>(Subscriber => {
      Subscriber.next(values);
    });
    return getDocs(q);
  }

  /**
   * For creating a new message a message text is required. Either a channel or a thread can be provided, depending on where the message is created.
   * If a channel is provided, a new thread will be created for the message. If a thread is provided, the message will be added to the thread.
   * @param message as string.
   * @param channel as Channel (optional).
   * @param thread as Thread (optional).
   */
  async setMessage(message: Message, channel?: Channel, thread?: Thread) {
    const docRef = doc(this.messageRef);
    message.messageId = docRef.id;

    setDoc(docRef, message.toJSON()).then(() => {
      channel ? this.setThread(new Thread({ messages: [message.messageId], creationDate: Timestamp.now() }), channel) : null; // If the message is created inside a channel, create a thread for it
      thread ? this.addMessageToThread(message.messageId, thread) : null; // If the message is created inside a thread, add it to the thread
    }).catch((error) => {
      console.error('Error adding document: ', error);
    });
  }


  async setThread(thread: Thread, channel?: Channel) {
    const docRef = doc(this.threadRef);
    thread.threadId = docRef.id;

    setDoc(docRef, thread.toJSON()).then(() => {
      channel ? this.addThreadToChannel(thread.threadId, channel) : null; // If the thread is created inside a channel, add it to the channel
    }).catch((error) => {
      console.error('Error adding document: ', error);
    });
  }


  async addMessageToThread(messageId: string, thread: Thread) {
    const docRef = doc(this.firestore, 'threads/' + thread.threadId);
    setDoc(docRef, { messages: [...thread.messages, messageId] }, { merge: true }).then(() => {
    }).catch((error) => {
      console.error('Error adding document: ', error);
    });
  }


  async addThreadToChannel(threadId: string, channel: Channel) {
    const docRef = doc(this.firestore, 'channels/' + channel.channelId);
    setDoc(docRef, { threads: [...channel.threads, threadId] }, { merge: true }).then(() => {
    }).catch((error) => {
      console.error('Error adding document: ', error);
    });
  }


  async updateChannel(channel: Channel) {
    const docRef = doc(this.firestore, 'channels/' + channel.channelId);

    setDoc(docRef, channel, { merge: true }).then(() => {
    }).catch((error) => {
      console.error('Error adding document: ', error);
    });
  }
}