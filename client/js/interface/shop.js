define(['jquery', './container/container'], function($, Container) {

    return Class.extend({

        init: function(game, intrface) {
            var self = this;

            self.game = game;

            self.body = $('#shop');
            self.shop = $('#shopContainer');
            self.inventory = $('#shopInventorySlots');

            self.player = game.player;
            self.interface = intrface;

            self.container = null;

            self.openShop = -1;

            self.items = [];
            self.counts = [];

        },

        buy: function(event) {
            var self = this,
                id = event.currentTarget.id.substring(11);

            self.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Buy, id]);
        },

        sell: function() {
            var self = this;


        },

        resize: function() {
            var self = this,
                list = self.getShopList().find('li');

            for (var i = 0; i < list.length; i++) {
                var item = $(list[i]).find('#shopItemImage' + i),
                    slot = self.container.slots[i];

                if (!slot.string) {
                    log.error('Couldn\'nt find string for slot at index: ' + i);
                    continue;
                }

                if (self.game.app.isMobile())
                    item.css('background-size', '600%');
                else
                    item.css('background-image', self.container.getImageFormat(self.getScale(), slot.string))
            }
        },

        update: function(data) {
            var self = this;

            self.reset();

            self.container = new Container(data.strings.length);

            for (var i = 0; i < self.container.size; i++) {
                var shopItem = $('<div id="shopItem' + i + '" class="shopItem"></div>'),
                    string = data.strings[i],
                    name = data.names[i],
                    count = data.counts[i],
                    itemImage, itemCount, itemName, itemBuy;

                if (!string || !name || !count)
                    continue;

                itemImage = $('<div id="shopItemImage' + i + '" class="shopItemImage"></div>');
                itemCount = $('<div id="shopItemCount' + i + '" class="shopItemCount"></div>');
                itemName = $('<div id="shopItemName' + i + '" class="shopItemName"></div>');
                itemBuy = $('<div id="shopItemBuy' + i + '" class="shopItemBuy"></div>');

                itemImage.css('background-image', self.container.getImageFormat(self.getScale(), string));
                itemCount.html(count);
                itemName.html(name);

                self.container.setSlot(i, {
                    string: string,
                    count: count
                });

                // Bind the itemBuy to the local buy function.
                itemBuy.click(function(event) {
                    self.buy(event);
                });

                var listItem = $('<li></li>');

                shopItem.append(itemImage, itemCount, itemName);

                listItem.append(shopItem);

                self.getShopList().append(listItem);
            }

            var inventoryItems = self.interface.bank.getInventoryList(),
                inventorySize = self.interface.inventory.getSize();

            for (var j = 0; j < inventorySize; j++) {
                var item = $(inventoryItems[j]).clone(),
                    slot = item.find('#bankInventorySlot' + j);

                self.getInventoryList().append(slot);
            }
        },

        reset: function() {
            var self = this;

            self.items = [];
            self.counts = [];

            self.container = null;

            self.getShopList().empty();
            self.getInventoryList().empty();
        },

        open: function(id) {
            var self = this;

            if (!id)
                return;

            self.openShop = id;

            self.body.fadeIn('slow');
        },

        hide: function() {
            var self = this;

            self.openShop = -1;

            self.body.fadeOut('fast');
        },

        getScale: function() {
            return this.game.renderer.getDrawingScale();
        },

        isVisible: function() {
            return this.body.css('display') === 'block';
        },

        isShopOpen: function(shopId) {
            return this.isVisible() && this.openShop === shopId;
        },

        getShopList: function() {
            return this.shop.find('ul');
        },

        getInventoryList: function() {
            return this.inventory.find('ul');
        }

    });


});
