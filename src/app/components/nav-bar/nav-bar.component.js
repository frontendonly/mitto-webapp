Element({
    selector: 'mitto-nav-bar',
    props: ['userInfo', 'isAuthenticated'],
    templateUrl: './nav-bar.component.html',
    styleUrl: './nav-bar-element.scss'
})
export function NavBarElement() {
    this.barIsVisible = false;
    this.isAuthenticated = false;
    this.notif = {};
    this.appName = "Mitto";
    this.openMenu = false;
}