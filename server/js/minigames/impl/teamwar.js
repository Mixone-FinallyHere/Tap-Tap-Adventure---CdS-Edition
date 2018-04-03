var Minigame = require('../minigame'),
    Data = require('../../../data/minigames.json'),
    Messages = require('../../network/messages'),
    Packets = require('../../network/packets');

module.exports = TeamWar = Minigame.extend({

    init: function(world) {
        var self = this;

        self.world = world;

        self.data = Data['TeamWar'];

        self._super(self.data.id, self.data.name);

        self.lobby = {};

        self.redTeam = {};
        self.blueTeam = {};
    },

    add: function(team, player) {
        var self = this;

        if (self.inTeam(player, team))
            return;

        team[player.instance] = player;

        self.removeFromLobby(player);
    },

    addToLobby: function(player) {
        var self = this;


    },

    remove: function(player) {
        var self = this;

        /**
         * We are removing the player from the game.
         * Meaning we will have to push him into the lobby.
         */

        if (player.team === 'red')
            delete self.redTeam[player.instance];
        else
            delete self.blueTeam[player.instance];
    },

    removeFromLobby: function(player) {
        var self = this;

        if (!self.inLobby(player))
            return;

        delete self.lobby[player.instance];


    },

    inTeam: function(player, team) {
        return player.instance in team;
    },

    inGame: function(player) {
        return player.instance in this.redTeam || player.instance in this.blueTeam;
    },

    inLobby: function(player) {
        return player.instance in this.lobby;
    }

});
