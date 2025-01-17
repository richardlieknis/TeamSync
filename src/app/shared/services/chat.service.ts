import { Injectable, OnInit } from '@angular/core';
import { CollectionReference, DocumentData, DocumentReference, Firestore, Timestamp, arrayUnion, collectionData, doc, docData, docSnapshots, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from '@angular/fire/firestore';
import { collection } from '@firebase/firestore';
import { UserService } from './user.service';
import { Chat } from 'src/models/chat.class';
import { update } from '@angular/fire/database';
import { Subject } from 'rxjs';
import { Message } from 'src/models/message.class';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  userChatCollection = collection(this.firestore, 'userChats');
  chatCollection = collection(this.firestore, 'chats');
  msgCollection = collection(this.firestore, 'messages');

  allChats$ = collectionData(this.chatCollection);
  chat!: Chat;
  currentUserId: any;
  userChatRef!: any;

  private chatContentSubject = new Subject<Chat>();

  constructor(
    private firestore: Firestore,
    private userService: UserService,
  ) { }

  returnCurrentUserChats(userId: string) {
    const docRef = doc(this.userChatCollection, userId);
    return docSnapshots(docRef);
  }

  async returnUserChatIds() {
    let chatIds: Array<any> = [];
    const querySnapshot = await getDocs(this.userChatCollection);
    querySnapshot.forEach((doc) => {
      chatIds.push(doc.id);
    })

    return chatIds;
  }

  /**
   * //TODO - check if this function is still needed
   * @param chatId as string
   * @returns chat object
   */
  startListeningToChat(chatId: string, callback: (chat: Chat) => any) {
    const docRef = doc(this.chatCollection, chatId);
    onSnapshot(docRef, (doc) => {
      this.chat = new Chat(doc.data());
      callback(this.chat);
    })
  }

  /** returns fs document data for a specific chat id */
  returnChatData(chatId: string) {
    const docRef = doc(this.chatCollection, chatId);
    return docData(docRef);
  }

  async returnQueryChatData(chatId: string) {
    let userChats: Array<any> = [];
    const snap = await getDocs(this.chatCollection);
    snap.forEach((doc) => {
      if (doc.id === chatId) {
        userChats.push(doc.data())
      }
    })
    return userChats;
  }

  /** After a new chat was created this function updates
   * and push chatIds into the document of current user
   */
  updateUserChatData(chatId: string) {
    this.userService.getCurrentUser().then((userId) => {
      this.currentUserId = userId;
      updateDoc(doc(this.userChatCollection, this.currentUserId),
        {
          chatIds: arrayUnion(chatId)
        })
    });
  }
  /** After a new chat was created but no chat already exists
   * this function sets a new doc
   * and push chatIds into the document of current user
   */
  setUserChatData(chatId: string) {
    this.userService.getCurrentUser().then((userId) => {
      this.currentUserId = userId;
      setDoc(doc(this.userChatCollection, this.currentUserId),
        {
          chatIds: arrayUnion(chatId)
        })
    });
  }

  setOtherUserChatData(chatId: string, users: any) {
    const addedUsers = this.extractMembers(users);
    addedUsers.forEach((userId: any) => {
      setDoc(doc(this.userChatCollection, userId), {
        chatIds: arrayUnion(chatId)
      });
    });
  }

  /** Set new Doc in 'chats' Collection with all
   * added members and current server time
   * @param chatId generated chatId as string
   * @param users selected users as Object
   */
  setChatData(chatId: string, users: any) {
    const docRef = doc(this.chatCollection, chatId);
    setDoc(docRef, {
      chatId: chatId,
      creationDate: Timestamp.now(),
      members: arrayUnion(...this.extractMembers(users)),
      messages: []
    })
  }

  async addMessageToChat(chat: Chat, messageId: string,) {
    const chatDocument = doc(this.chatCollection, chat.chatId);
    updateDoc(chatDocument, {
      messages: arrayUnion(messageId)
    })
  }

  extractMembers(users: any) {
    let members: any = [];
    users.forEach((user: any) => {
      members.push(user.userId)
    });
    return members;
  }
}