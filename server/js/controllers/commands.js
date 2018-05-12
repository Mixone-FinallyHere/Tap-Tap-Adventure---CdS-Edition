/* global log */

var cls = require('../lib/class'),
Messages = require('../network/messages'),
Packets = require('../network/packets'),
_ = require('underscore');

module.exports = Commands = cls.Class.extend({

    init: function(player) {
        var self = this;

        self.world = player.world;
        self.player = player;
    },

    parse: function(rawText) {
        var self = this,
            blocks = rawText.substring(1).split(' ');

        if (blocks.length < 1)
            return;

        var command = blocks.shift();

        self.handlePlayerCommands(command, blocks);

        if (self.player.rights > 0)
            self.handleModeratorCommands(command, blocks);

        if (self.player.rights > 1)
            self.handleAdminCommands(command, blocks);
    },

    handlePlayerCommands: function(command, blocks) {
        var self = this;

        switch(command) {

            case 'party':
            var command = blocks.shift();

            if (command === 'invite') {
                var targetName = blocks.join(' ');

                if (!self.world.playerInWorld(targetName)) {
                    self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'Player "'+targetName+'" is not online.'));
                    return;
                }

                var invitee = self.world.getPlayerByName(targetName);
                self.player.party.invite(invitee)

            } else if (command === 'decline') {

                self.player.party.decline();

            } else if (command === 'accept') {

                var targetName = blocks.join(' ');
                var inviter = self.world.getPlayerByName(targetName);

                self.player.party.accept();

            } else if (command === 'leave') {

                self.player.party.leave()

            } else if (command == 'list') {

                self.player.party.list()

            } else if (command === 'kick') {
                var party_id = self.player.party.id
                var targetName = blocks.shift();

                // We not in a party, or target is not in our party
                if (!party_id || self.world.parties[party_id].members.indexOf(targetName) < 0)
                return;

                var victim = self.world.getPlayerByName(targetName);

                self.player.party.kick(victim)
                // self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'You have kicked ' +victim+ ' from the party.'));
            } else {
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `Party Commands:`));
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `  /party - Shows this message`));
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `  /party invite <player> - Invites player to party`));
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `  /party accept - Accept a party invitation`));
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `  /party decline - Decline a party invitation`));
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `  /party leave - Leave the current party`));
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `  /party kick <player> - Kicks a player from the party`));
                self.player.send(new Messages.Party(Packets.PartyOpcode.Chat, `  /party list - Lists all the current party members`));

            }

            // self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'There are currently ' + self.world.getPopulation() + ' online.'));

            break;

            case 'players':

                self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'There are currently ' + self.world.getPopulation() + ' online.'));

                break;

            case 'tutstage':

                log.info(self.player.getTutorial().stage);

                break;

            case 'coords':

                self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'x: ' + self.player.x + ' y: ' + self.player.y));

                break;

            case 'progress':

                var tutorialQuest = self.player.getTutorial();

                self.player.send(new Messages.Quest(Packets.QuestOpcode.Progress, {
                    id: tutorialQuest.id,
                    stage: tutorialQuest.stage
                }));

                break;

            case 'global':

                self.world.pushBroadcast(new Messages.Chat({
                    name: self.player.username,
                    text: blocks.join(' '),
                    isGlobal: true,
                    withBubble: false,
                    colour: 'rgba(191, 191, 63, 1.0)'
                }));

                break;

        }
    },

    handleModeratorCommands: function(command, blocks) {
        var self = this;

        switch (command) {

            case 'mute':
            case 'ban':

                var duration = blocks.shift(),
                    targetName = blocks.join(' '),
                    user = self.world.getPlayerByName(targetName);

                if (!user)
                    return;

                if (!duration)
                    duration = 24;

                var timeFrame = new Date().getTime() + duration * 60 * 60;

                if (command === 'mute')
                    user.mute = timeFrame;
                else if (command === 'ban') {
                    user.ban = timeFrame;
                    user.save();

                    user.sendUTF8('ban');
                    user.connection.close('banned');
                }

                user.save();

                break;

            case 'unmute':

                var uTargetName = blocks.join(' '),
                    uUser = self.world.getPlayerByName(uTargetName);

                if (!uTargetName)
                    return;

                uUser.mute = new Date().getTime() - 3600;

                uUser.save();

                break;

        }

    },

    handleAdminCommands: function(command, blocks) {
        var self = this;

        switch (command) {

            case 'spawn':

                var spawnId = parseInt(blocks.shift()),
                    count = parseInt(blocks.shift()),
                    ability = parseInt(blocks.shift()),
                    abilityLevel = parseInt(blocks.shift());

                if (!spawnId || !count)
                    return;

                self.player.inventory.add({
                    id: spawnId,
                    count: count,
                    ability: ability ? ability : -1,
                    abilityLevel: abilityLevel ? abilityLevel : -1
                });

                return;

            case 'maxhealth':

                self.player.notify('Max health is ' + self.player.hitPoints.getMaxHitPoints());

                break;

            case 'ipban':

                return;

            case 'drop':

                var id = parseInt(blocks.shift()),
                    dCount = parseInt(blocks.shift());

                if (!id)
                    return;

                if (!dCount)
                    dCount = 1;

                self.world.dropItem(id, dCount, self.player.x, self.player.y);

                return;

            case 'ghost':

                self.player.equip('ghost', 1, -1, -1);

                return;

            case 'notify':

                self.player.notify('Hello!!!');

                break;

            case 'teleport':

                var x = parseInt(blocks.shift()),
                    y = parseInt(blocks.shift());

                if (x && y)
                    self.player.teleport(x, y);

                break;

            case 'teletome':

                var username = blocks.join(' '),
                    player = self.world.getPlayerByName(username);

                if (player)
                    player.teleport(self.player.x, self.player.y);

                break;

            case 'nohit':

                log.info('invincinil');

                self.player.invincible = !self.player.invincible;

                break;

            case 'mob':

                var npcId = parseInt(blocks.shift());

                self.world.spawnMob(npcId, self.player.x, self.player.y);

                break;

            case 'pointer':

                var posX = parseInt(blocks.shift()),
                    posY = parseInt(blocks.shift());

                if (!posX || !posY)
                    return;

                self.player.send(new Messages.Pointer(Packets.PointerOpcode.Location, {
                    id: self.player.instance,
                    x: posX,
                    y: posY
                }));

                break;

            case 'teleall':

                _.each(self.world.players, function(player) {
                    player.teleport(self.player.x, self.player.y);
                });

                break;

            case 'attackaoe':

                var radius = parseInt(blocks.shift());

                if (!radius)
                    radius = 1;

                self.player.combat.dealAoE(radius);

                break;

            case 'addexp':

                var exp = parseInt(blocks.shift());

                if (!exp)
                    return;

                self.player.addExperience(exp);

                break;

        }

    }

});
