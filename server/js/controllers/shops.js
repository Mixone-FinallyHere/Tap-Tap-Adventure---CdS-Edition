var cls = require('../lib/class'),
    ShopData = require('../util/shops'),
    Items = require('../util/items'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets'),
    _ = require('underscore');

/**
 * The only data we will mutate is ShopsData.Data
 * This is when a player sells or buys items, which
 * overtime, regenerate.
 */

module.exports = Shops = cls.Class.extend({

    init: function(world) {
        var self = this;

        self.world = world;

        self.shopInterval = null;
        self.interval = 60000;

        self.load();
    },

    load: function() {
        var self = this;

        self.shopInterval = setInterval(function() {

            _.each(ShopData.Data, function(info) {

                for (var i = 0; i < info.count; i++)
                    if (info.count[i] < info.originalCount[i])
                        ShopData.increment(info.id, info.items[i], 1);

            });

        }, self.interval);
    },

    open: function(player, shopId) {
        var self = this;

        player.send(new Messages.Shop(Packets.ShopOpcode.Open, {
            instance: player.instance,
            npcId: shopId,
            shopData: self.getShopData(shopId)
        }));

    },

    buy: function(player, shopId, itemId, count) {
        var self = this,
            cost = ShopData.getCost(shopId, itemId, count),
            currency = self.getCurrency(shopId),
            stock = ShopData.getStock(shopId, itemId);

        //TODO: Make it so that when you have the exact coin count, it removes coins and replaces it with the item purchased.

        if (stock === 0) {
            player.notify('This item is currently out of stock.');
            return;
        }

        if (!player.inventory.contains(currency, cost)) {
            player.notify('You do not have enough money to purchase this.');
            return;
        }

        if (!player.inventory.hasSpace()) {
            player.notify('You do not have enough space in your inventory.');
            return;
        }

        if (count > stock)
            count = stock;

        player.inventory.remove(currency, cost);
        player.inventory.add(itemId, count);

        ShopData.decrement(shopId, itemId, count);

        self.refresh();
    },

    refresh: function(shopId) {
        var self = this;

        self.world.pushBroadcast(new Messages.Shop(Packets.ShopOpcode.Refresh, self.getShopData(shopId)));
    },

    getCurrency: function(id) {
        return ShopData.Ids[id].currency;
    },

    getShopData: function(id) {
        var self = this;

        if (!ShopData.isShopNPC(id))
            return;

        var items = ShopData.getItems(id),
            strings = [],
            names = [];

        for (var i = 0; i < items.length; i++) {
            strings.push(Items.idToString(items[i]));
            names.push(Items.idToName(items[i]));
        }

        return {
            id: id,
            strings: strings,
            names: names,
            counts: ShopData.getCount(id)
        }
    }


});