var cls = require('../lib/class'),
    fs = require('fs'),
    GuildData = require('../../data/guilds.json'),
    _ = require('underscore');

/*
 * This has to be expanded to incoporate custom ranks.
 * Ensure case sensitivity is properly handled.
 */

module.exports = Guilds = cls.Class.extend({

    init: function(world) {
        var self = this;

        self.world = world;

        log.info('Guild controller initialized with ' + Object.keys(GuildData).length + ' guilds.');

        self.forEachGuild(function(guild) {
            log.info(guild);
            log.info(guild.key);
        });
    },

    update: function(guild) {
        var self = this,
            members = guild.members;

        _.each(members, function(member) {
            var player = self.world.getPlayerByName(member);

            if (player)
                player.guild.update(self.getData(guild));
        });
    },

    connect: function(player, guildName) {
        var self = this;

        if (!(guildName in GuildData)) {
            player.notify('The guild you are trying to join does not exist.');
            return;
        }

        if (player.hasGuild())
            player.leaveGuild();
    },

    getData: function(guild) {
        return {
            name: guild.name,
            owner: guild.owner,
            members: guild.members,
            ranks: guild.ranks,
            string: guild.key
        }
    },

    getGuildFromName: function(guildName) {
        var self = this,
            name = guildName.toLowerCase();

        if (name in GuildData)
            return GuildData[name];

        return null;
    },

    forEachGuild: function(callback) {
        _.each(GuildData, function(guild) {
            callback(guild);
        });
    }

});
