var cls = require('../../../../lib/class'),
Messages = require('../../../../network/messages'),
Packets = require('../../../../network/packets'),
Utils = require('../../../../util/utils');

module.exports = Party = cls.Class.extend({

    init: function(player, data) {
        var self = this;

        self.player = player;
        self.data = data;

        self.id = null; // ID of party we are currently in
        self.invite_id; // ID of the last party we were invited to join
    },


    /**
     * [kicks target_player from party]
     * @method
     * @param  {Player} target_player [Player object of player being kicked from group.]
     */
    kick: function(target_player) {
        var self = this;
        var party_id = self.player.party.id;
        var party = self.player.world.parties[party_id];
        var target_index = party.members.indexOf(target_player.username);

        // Target player is not in our party
        if (target_index < 0)
            return;

        // Player is not the party leader.
        if (party.leader !== self.player.username) {
            self.player.notify('Only the party leader can kick members.');
            return;
        }

        // Party leader kicked themselves from the party. Just force them to leave.
        if (target_player.username === self.player.username) {
            self.player.party.leave();
            return;
        }

        // Remove player from party
        party.members.splice(target_index, 1);
        target_player.party.id = null;
        target_player.send(new Messages.Party(Packets.PartyOpcode.Kick, target_player.username) );

        // Inform other party members of kicked player
        for (member of party['members']) {
            var player = self.player.world.getPlayerByName(member);

            player.send(new Messages.Party(Packets.PartyOpcode.Kick, target_player.username) );
            player.send(new Messages.Party(Packets.PartyOpcode.Update, [party['leader'], party['members'] ]) );
        }
    },

    /**
     * [decline party invite]
     * @method
     */
    decline: function() {
        var self = this;

        self.player.party.invite_id = null;
        self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, 'You have declined the invitation to join the party.'));
    },

    /**
     * [Send party invite to target_user]
     * @method
     * @param  {[type]} target_user [Player object to invite to party.]
     */
    invite: function(target_user) {
        var self = this;
        var party_id = self.player.party.id;

        // If the inviter is already in a party...
        if (party_id) {
            var party = self.player.world.parties[party_id];

            // Target player already in our party.
            if (party.members.indexOf(target_user) > -1) {
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `Player ${target_user} is already in the party.`));
                return;
            }

            // Player is the party leader, allow sending of invite.
            if (party && party.leader && party.leader === self.player.username ) {
                target_user.party.invite_id = party_id;
                target_user.send(new Messages.Party(Packets.PartyOpcode.Invite, self.player.username));
            } else {
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `You must be the party leader to invite members. ${party.leader} is currently your party leader.`));
                return;
            }

        } else {
            // Inviter has no party, create a new one then invite invitee
            var new_party_id = self.player.party.createParty();

            target_user.party.invite_id = new_party_id;
            target_user.send(new Messages.Party(Packets.PartyOpcode.Invite, self.player.username));

            self.player.notify('You have started a new party.');
        }

        self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `You have invited ${target_user.username} to join your party.`));
    },

    /**
     * [Accepts pending party invite, joining user to the party]
     * @method
     */
    accept: function() {
        var self = this;

        if (!self.player.party.invite_id) {
            self.player.notify('You have no party invites.');
            return;
        }

        var party_id = self.player.party.invite_id;

        if (self.player.party.id) {
            self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `You must first leave your current party before joining a new one. Type "/party leave" to leave this party.`));
            return;
        }

        self.player.party.id = party_id;
        self.player.party.invite_id = null;
        self.player.world.parties[party_id]['members'].push(self.player.username);

        // Inform other party members of new player joining party
        for (member of self.player.world.parties[party_id]['members']) {
            var player = self.player.world.getPlayerByName(member);
            player.send(new Messages.Party(Packets.PartyOpcode.Accept, self.player.username) );
            player.send(new Messages.Party(Packets.PartyOpcode.Update, [self.player.world.parties[party_id]['leader'], self.player.world.parties[party_id]['members'] ]) );
        }

    },

    /**
     * [Sends a list of the current party members to the invoking Player]
     * @method
     */
    list: function() {
        var self = this;
        var party_id = self.player.party.id;

        if (!party_id)
            return;

        self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `Leader: ${self.player.world.parties[party_id]['leader']}`));
        self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `Members: ${self.player.world.parties[party_id]['members'].join(' ')}`));
    },

    /**
     * [Removes player from their current party]
     * @method
     */
    leave: function() {
        var self = this;
        var party_id = self.player.party.id;

        if (!party_id) {
            self.player.notify('You are not in a party.');
            return;
        }

        var party = self.player.world.parties[party_id];
        var player_index = party.members.indexOf(self.player.username);

        // Remove player from party
        party.members.splice(player_index, 1);
        self.player.party.id = null;

        // Inform the leaving player that they have left the party
        self.player.send(new Messages.Party(Packets.PartyOpcode.Leave, self.player.username) );

        // party has no members left, so destroy it.
        if (party['members'].length < 1) {
            delete self.player.world.parties[party_id]
            return;
        }

        // If player was the leader then set a new leader
        if (party.leader === self.player.username)
        party.leader = party.members[0]

        // Inform other party members of player leaving
        for (member of party['members']) {
            var player = self.player.world.getPlayerByName(member);

            player.send(new Messages.Party(Packets.PartyOpcode.Leave, self.player.username) );
            player.send(new Messages.Party(Packets.PartyOpcode.Update, [party['leader'], party['members'] ]) );
        }

    },

    /**
     * [Creates a new party object with a unique ID within the 'world' object]
     * @method
     * @return {String} [The unique ID of the newly created party.]
     */
    createParty: function() {
        var self = this;
        var new_id = Utils.getCurrentEpoch();

        if (self.player.world.parties[new_id])
        return false;

        // Update global party
        self.player.world.parties[new_id] = {
            members: [ self.player.username ],
            leader: self.player.username
        }

        // Update player party attributes
        self.player.party.id = new_id;

        return new_id;
    },

    /**
     * [Joins current Player object to party based on party_id]
     * @method
     * @param  {[type]} party_id [The unique ID of the party to join the current player to.]
     */
    joinParty: function(party_id) {
        var self = this;

        // Party no longer exists. Clear invite.
        if (!self.player.world.parties[party_id]) {
            self.player.party.invite_id = null;
            return false;
        }

        self.player.party.id = party_id;
        self.player.party.invite_id = null;
        self.player.world.parties[party_id].members.append(self.player.username);
    },

    /**
     * [Sends a full update of the current Player's party to all party members]
     * @method
     */
    update: function() {
        var self = this;
        var party = self.player.world.parties[self.player.party.id];

        for (member of party['members']) {
            var player = self.player.world.getPlayerByName(member);
            player.send(new Messages.Party(Packets.PartyOpcode.Update, [party['leader'], party['members'] ]) );
        }
    }

});
