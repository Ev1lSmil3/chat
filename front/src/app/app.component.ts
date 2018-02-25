import { NgModule, Component, HostListener } from '@angular/core';
import { Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Response } from '@angular/http';
import { Injectable } from '@angular/core';
declare var $: any;
import * as io from 'socket.io-client';
import { SimpleNotificationsComponent } from 'angular2-notifications';
import { NotificationsService } from 'angular2-notifications';
import { PushNotificationComponent } from 'ng2-notifications/ng2-notifications';
import { PushNotificationsService } from 'ng-push';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  items;
  user: any;
  name: any;
  authState;
  msgVal;
  room;
  api_url = 'http://localhost:3000';
  chatUrl = `${this.api_url}/api/chat`;
  private socket;

  constructor(
    private http: HttpClient,
    private _service: NotificationsService,
    private _pushNotifications: PushNotificationsService
  ) {
    const self = this;
    _pushNotifications.requestPermission();
    this.socket = io.connect(this.chatUrl);
    this.socket.on('chat message', (data) => {
      if (this.user !== data.name) {
        this._pushNotifications.create(data.name, { body: data.message, icon: 'assets/Kolyan.png' }).subscribe(
          res => console.log(res),
          err => console.log(err)
        );
      }
      this.items.unshift(data);
    });
    this.socket.on('user entered chat', (data) => {
      self.user == data.name ? self._service.success('You', 'entered chat', { timeOut: 5000, showProgressBar: false }) : self._service.success(data.name, 'entered chat', { timeOut: 5000, showProgressBar: false });
      self.room.push(data);
    });
    this.socket.on('invalid value', (data) => {
      alert('Invalid value');
    });
    this.socket.on('disconnect', function (user) {
      self.room.splice(self.room.indexOf(self.room.find((el) => el.name == user)), 1);
      self.user ? self._service.error(user, 'ran like a Pussy!', { timeOut: 5000, showProgressBar: false }) : null;
    });
    this.socket.on('user typing', (user) => {
      self.room.find((el) => el.name == user);
      if (!self.room.find((el) => el.name == user).typing) {
        self.room.find((el) => el.name == user).typing = true;
        var timeout = setTimeout(() => { self.room.find((el) => el.name == user).typing = false }, 2000);
      } else {
        clearTimeout(timeout);
        timeout;
      }
    });
    this.http.get(`${this.chatUrl}/getUsers`).subscribe(data => { this.room = data; console.log(this.room, 'get from server') });
    this.http.get(`${this.chatUrl}/getPosts`).subscribe(data => { this.items = data; this.items.reverse(); console.log(data, 'items') });
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler(event) {
    const self = this;
    this.socket.emit('user disconnected', self.user);
  }

  isTyping() {
    this.socket.emit('user typing', this.user);
  }

  setUser(user) {
    if (!/[^A-Za-z0-9]+$/.test(user)) {
      this.user = user;
      let tmpObject = { name: user, typing: false };
      this.socket.emit('user entered chat', tmpObject);
    } else {
      alert('Invalid value');
    }
  }


  chatSend(theirMessage: string) {
    if (theirMessage.trim() !== '' && theirMessage.length < 200) {
      let nowDate = new Date();
      let msg = {
        name: this.user,
        message: theirMessage,
        date: `${nowDate.getHours()}:${nowDate.getMinutes() < 10 ? `0${nowDate.getMinutes()}` : nowDate.getMinutes()} ${nowDate.getDate() < 10 ? `0${nowDate.getDate()}` : nowDate.getDate()}.${nowDate.getMonth() < 10 ? `0${nowDate.getMonth() + 1}` : nowDate.getMonth()}.${nowDate.getFullYear()}`
      }
      this.socket.emit('chat message', msg);
      this.msgVal = '';
    } else {
      alert('Invalid value');
    }
  }

}



