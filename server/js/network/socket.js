/* global module */

var cls = require('../lib/class');

/**
 * Abstract Class for Socket
 */

module.exports = Socket = cls.Class.extend({

    init: function(port) {
        this.port = port;
    },

    addConnection: function(connection) {
        this._connections[connection.id] = connection;
    },

    removeConnection: function(id) {
        delete this._connections[id];
    },

    getConnection: function(id) {
        return this._connections[id];
    }
});