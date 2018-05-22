/* global log */

var cls = require('../lib/class');

module.exports = Connection = cls.Class.extend({

    init: function(id, connection, server) {
        var self = this;

        self.id = id;
        self.socket = connection;
        self._server = server;
    },

    send: function() {
        throw 'Invalid initialization.'
    },

    sendUTF8: function() {
        throw 'Invalid initialization.'
    },

    close: function(reason) {
        if (reason)
            log.info(reason);

        this.socket.conn.close();
    }
});