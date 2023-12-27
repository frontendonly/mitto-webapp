


Service({
    name: 'GlobalService'
})
export function GlobalService() {
    this.modalElement;
}

GlobalService.prototype.isBlockedUser = function (user1, user2) {
    return (user2.blockedUser || []).includes(user1.uid) || (user1.blockedUser || []).includes(user2.uid);
};


GlobalService.prototype.getFlirtStyle = function (styleId) {
    return ['Traditional', 'Polite', 'Playful', 'Physical', 'Sincere'][styleId];
};