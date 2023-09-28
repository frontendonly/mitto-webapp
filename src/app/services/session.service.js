Service({
    name: '$sesionSerivce',
    DI: ['jDB']
}, sesionSerivceFn);


function sesionSerivceFn(jDB) {
    var publicApi = function(definition) {
        this.definition = definition;
        this.check(noop, noop);
    };
    /**
     * @Method : check
     */
    publicApi.prototype.check = function(CBsuccess, CBerror) {
        var _def = this.definition;
        this.get(function(res) {
            if (!res.result.data) {
                jDB
                    .tx.api('POST', '/start/session', _def, null)
                    .then(CBsuccess, CBerror);
            } else {
                CBsuccess(res);
            }
        }, CBerror);

        return this;
    };

    /**
     * @Method : get
     */
    publicApi.prototype.get = function(CBsuccess, CBerror) {
        jDB
            .tx.api('GET', '/get/session', this.definition, null)
            .then(CBsuccess, CBerror);

        return this;
    };

    /**
     * @Method : put
     */
    publicApi.prototype.put = function(postData, CBsuccess, CBerror) {
        jDB
            .tx.api('PUT', '/store/session', extend(true, this.definition, { content: postData }), null)
            .then(CBsuccess, CBerror);

        return this;
    };

    /**
     * @Method : destroy
     */
    publicApi.prototype.destroy = function(CBsuccess, CBerror) {
        jDB
            .tx.api('DELETE', '/destroy/session', this.definition, null)
            .then(CBsuccess, CBerror);

        return this;
    };

    return publicApi;
}