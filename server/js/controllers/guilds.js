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

    },

    create: function(name, owner) {
        var self = this;

        if (exists) {
            owner.notify('This guild already exists');
            return;
        }

    },

    disband: function(name) {
        var self = this;


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

    /**
     * We have to make use of the `GuildData` requirement when we are modifying Guilds
     * as that is the data that gets saved upon any alteration done to it.
     */

    remove: function(player, guild) {
        var self = this,
            index;

        if (guild.members.length !== guild.ranks.length) {
            log.error('Guild member size mismatch.');
            return;
        }

        if (!self.hasMember(player.username))
            return;

        index = guild.members.indexOf(player.username.toLowerCase());

        if (!index || index < 0)
            return;

        GuildData[guild.name].members.splice(index, 1);
        GuildData[guild.name].ranks.splice(index, 1);

        self.save();

    },

    rename: function(guild, newName) {
        var self = this;

        if (newName.length > 18)
            return;


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

    getGuildFromName: function(name) {
        var self = this,
            guildName = name.toLowerCase();

        if (self.exists(guildName))
            return GuildData[guildName];

        return null;
    },

    save: function() {
        var self = this,
            directory = 'server/data/guilds.json';

        fs.writeFile(directory, JSON.stringify(GuildData), function(error) {
            if (error) {
                log.info(error);
                log.error('An error has encountered whilst updating guild data.');
                return;
            }

            log.info('Guild data has been successfully saved.');
        });
    },

    exists: function(name) {
        return name.toLowerCase() in GuildData;
    },

    hasMember: function(guild, member) {
        var self = this;

        if (!self.exists(guild.name))
            return;

        return GuildData[guild.name].members.indexOf(member.toLowerCase()) > -1;
    },

    getOwner: function(guild) {
        return this.world.getPlayerByName(guild.owner);
    },

    forEachGuild: function(callback) {
        _.each(GuildData, function(guild) {
            callback(guild);
        });
    }

});
