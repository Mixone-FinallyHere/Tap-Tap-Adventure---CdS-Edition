define(['jquery', './container/container'], function($, Container) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;

            self.body = $('#shop');
            self.shop = $('#shopContainer');
            self.inventory = $('#shopInventorySlots');

            self.player = game.player;

            self.container = null;

            self.openShop = -1;

            self.items = [];
            self.counts = [];

        },

        update: function(data) {
            var self = this;

            self.reset();

            self.container = new Container(data.strings.length);

            for (var i = 0; i < self.container.size; i++) {
                var shopItem = $('<div id="shopItem"' + i + ' class="shopItem"></div>'),
                    string = data.strings[i],
                    name = data.names[i],
                    count = data.counts[i];



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

        show: function(id) {
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