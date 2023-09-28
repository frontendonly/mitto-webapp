Service({
    name: 'routeDBService',
    DI: ['jDB', '$promise', 'Auth']
}, routeDBService);
/**
 * 
 * @param {*} j 
 * @param {*} $p 
 */
function routeDBService(jdb, $p, auth) {
    this.resolve = function() {
        var defer = new $p();
        return defer.until(function() {
            return !!jdb.tx;
        });
    }
}