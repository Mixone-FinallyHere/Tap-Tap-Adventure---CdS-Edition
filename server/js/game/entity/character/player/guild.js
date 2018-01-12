var cls = require('../../../../lib/class'),
    Messages = require('../../../../network/messages'),
    Packets = require('../../../../network/packets');

module.exports = Guild = cls.Class.extend({

    init: function(player, data) {
        var self = this;

        self.player = player;
        self.data = data;

    },

    join: function() {
        var self = this;


    },

    leave: function() {
        var self = this;

        if (self.data === null) {
            self.player.notify('You are not in a guild.');
            return;
        }

        self.getController().remove(self.player, self.data.string)

        self.data = null;
    },

    /*
     * We keep each player up to date with changes
     * to the guild.
     */

    update: function(data) {
        var self = this;

        // Do a server-sided update.
        self.data = data;

        // Do a client-sided update.
        self.player.send(new Messages.Guild(Packets.GuildOpcode.Update, data));
    },

    getController: function() {
        return this.player.world.guilds;
    }

});
