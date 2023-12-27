import { EventEmitter } from '@jeli/core';

Element({
    selector: 'app-menu',
    props: ['userInfo', 'isAuthenticated'],
    events: ['onMenuClicked:emitter'],
    templateUrl: './app-menu.component.html'
})
export function AppMenuElement() {
    this.isAuthenticated = false;
    this.onMenuClicked = new EventEmitter();
    this.menu = {
        others: [{ 'label': 'Add Friends', action: 'openPage', pageId: 'addFriends', iconClass: 'person-plus' },
        { 'label': 'Coins', action: 'openPage', pageId: 'coins', iconClass: 'coin' },
        { 'label': 'Profile', action: 'openPage', pageId: 'settings.profile', iconClass: 'person-fill-gear' },
        { 'label': 'Privacy', action: 'openPage', pageId: 'settings.privacy', iconClass: 'person-fill-lock' },
        { 'label': 'Blocked Users', action: 'openPage', pageId: 'blockedUsers', iconClass: 'person-fill-slash' }],
        main: [{ 'label': 'Visitors', action: 'openPage', badge: 'visitors', pageId: 'visitors', iconClass: 'eye-fill' },
        { 'label': 'Likes', action: 'openPage', badge: 'likes', pageId: 'likes', iconClass: 'heart-fill' },
        { 'label': 'Interest', action: 'openPage', badge: 'favorites', pageId: 'interest', iconClass: 'star-fill' }],
        bottom: [{ 'label': 'Logout', action: 'logout', iconClass: 'person-exclamation' },
        { 'label': 'Change Password', action: 'openPage', pageId: 'settings.password', iconClass: 'key-fill' },
        { 'label': 'Pause Account', action: 'hide', iconClass: 'pause-fill' },
        { 'label': 'Deactivate Account', action: 'del', iconClass: 'person-fill-x' }]
    }
}