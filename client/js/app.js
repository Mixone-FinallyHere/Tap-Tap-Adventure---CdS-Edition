
/* global Mob, Types, Item, log, _, TRANSITIONEND, Class */

define(['jquery', 'mob', 'item', 'mobdata', 'button2'], function($, Mob, Item, MobData, Button2) {

    var App = Class.extend({
        init: function() {
            this.window = window;
            this.rotation = null;
            this.currentPage = 1;
            this.blinkInterval = null;
            this.isParchmentReady = true;
            this.ready = false;
            this.watchNameInputInterval = setInterval(this.toggleButton.bind(this), 100);
            this.initFormFields();
            this.dropDialogPopuped = false;
            this.auctionsellDialogPopuped = false;

            this.inventoryNumber = 0;
            this.showChatLog = null;

            this.classNames = ["loadcharacter",
                "createcharacter",
                "changePassword"];
            this.frontPage = this.classNames[0];

        },

        setGame: function(game) {
            this.game = game;
            this.isMobile = this.game.renderer.mobile;
            this.isTablet = this.game.renderer.tablet;
            this.isDesktop = !(this.isMobile || this.isTablet);
            this.supportsWorkers = !!window.Worker;
            this.ready = true;
            this.rotation = this.window.orientation;
        },

        initFormFields: function() {
            var self = this;

            // Play button
            this.$play = $('.play');
            this.getPlayButton = function() { return this.getActiveForm().find('.play span'); };
            this.setPlayButtonState(true);

            // Login form fields
            this.$loginnameinput = $('#loginnameinput');
            this.$loginpwinput = $('#loginpwinput');
            this.loginFormFields = [this.$loginnameinput, this.$loginpwinput];

            // Create new character form fields
            this.$nameinput = $('#nameinput');
            this.$pwinput = $('#pwinput');
            this.$pwinput2 = $('#pwinput2');
            this.$email = $('#emailinput');
            this.createNewCharacterFormFields = [this.$nameinput, this.$pwinput, this.$pwinput2, this.$email];

            // Create change password form fields
            this.$pwnameinput = $('#cpnameinput');
            this.$pwinputold = $('#cppwinputold');
            this.$pwinputnew = $('#cppwinput');
            this.$pwinputnew2 = $('#cppwinput2');
            this.createNewPasswordFormFields = [this.$pwnameinput, this.$pwinputold, this.$pwinputnew, this.$pwinputnew2];

        },

        center: function() {
            window.scrollTo(0, 1);

        },

        canStartGame: function() {
            if(this.isDesktop) {
                return (this.game && this.game.map && this.game.map.isLoaded);
            } else {
                return this.game;
            }
        },

        tryStartingGame: function() {
            if(this.starting) return;        // Already loading

            var action = $('#parchment').attr("class");



            var self = this;

            if (action == this.classNames[0])
            {
                var username = this.$loginnameinput.attr('value');
                var userpw = this.$loginpwinput.attr('value');

                if(!this.validateLoginForm(username, userpw)) return;

                this.preStartGame(action, username, userpw);

            }
            else if (action == this.classNames[1])
            {
                var username = this.$nameinput.attr('value');
                var userpw = this.$pwinput.attr('value');
                var userpw2 = this.$pwinput2.attr('value');
                var email = this.$email.attr('value');
                var pClass = $('#selectClassSwitch2').val();

                if(!this.validateCreateForm(username, userpw, userpw2, email)) return;

                this.preStartGame(action, username, userpw, email, '', pClass);
            }
            else if (action == this.classNames[2])
            {
                var username = this.$pwnameinput.attr('value');
                var userpwold = this.$pwinputold.attr('value');
                var userpwnew = this.$pwinputnew.attr('value');
                var userpwnew2 = this.$pwinputnew2.attr('value');;

                if(!this.validateChangePasswordForm(username, userpwold, userpwnew, userpwnew2, email)) return;

                this.preStartGame(action, username, userpwold, '', userpwnew);
            }

            if (action == this.classNames[0] || action == this.classNames[1])
            {
            }

        },

        preStartGame: function (action, username, userpw, email, newpw, pClass) {
            var self = this;
            this.setPlayButtonState(false);

            if(!this.ready || !this.canStartGame()) {
                var watchCanStart = setInterval(function() {
                    log.debug("waiting...");
                    if(self.canStartGame()) {
                        clearInterval(watchCanStart);
                        self.startGame(action, username, userpw, email, newpw, pClass);
                    }
                }, 100);
            } else {

                this.startGame(action, username, userpw, email, newpw, pClass);
            }
        },

        startGame: function(action, username, userpw, email, newuserpw, pClass) {
            var self = this;

            if(username && !this.game.started) {
                var optionsSet = false,
                    config = this.config;
                this.useAPI = config.local ? config.useLocalAPI : config.useAPI;
                //>>includeStart("devHost", pragmas.devHost);
                if(config.local) {
                    log.debug("Starting game with local dev config.");
                    this.game.setServerOptions(config.local.host, config.local.port, username, userpw, email, newuserpw, pClass);
                } else {
                    log.debug("Starting game with default dev config.");
                    this.game.setServerOptions(config.dev.host, config.dev.port, username, userpw, email, newuserpw, pClass);
                }
                optionsSet = true;
                //>>includeEnd("devHost");

                //>>includeStart("prodHost", pragmas.prodHost);
                if(!optionsSet) {
                    log.debug("Starting game with build config.");
                    this.game.setServerOptions(config.build.host, config.build.port, username, userpw, email, newuserpw, pClass);
                }
                //>>includeEnd("prodHost");

                if(!self.isDesktop) {
                    // On mobile and tablet we load the map after the player has clicked
                    // on the login/create button instead of loading it in a web worker.
                    // See initGame in main.js.
                    self.game.loadMap();
                }

                this.center();
                this.game.run(action, function(result) {
                    if(result.success === true) {

                        self.start();
                    } else {

                        self.setPlayButtonState(true);

                        switch(result.reason) {

                            case "timeout":
                                self.addValidationError(null, "Timeout whilst attempting to establish connection to TTA servers.");
                                break;

                            case 'invalidlogin':
                                // Login information was not correct (either username or password)
                                self.addValidationError(null, 'The username or password you entered is incorrect.');
                                //self.getUsernameField().focus();
                                break;

                            case 'userexists':
                                // Attempted to create a new user, but the username was taken
                                self.addValidationError(null, 'The username you entered is not available.');
                                break;

                            case 'invalidusername':
                                // The username contains characters that are not allowed (rejected by the sanitizer)
                                self.addValidationError(null, 'The username you entered contains invalid characters.');
                                break;

                            case 'loggedin':
                                // Attempted to log in with the same user multiple times simultaneously
                                self.addValidationError(null, 'A player with the specified username is already logged in.');
                                break;

                            case 'ban':
                                self.addValidationError(null, 'You have been banned.');
                                break;

                            case 'full':
                                self.addValidationError(null, "All TTA gameservers are currently full.")
                                break;

                            case 'passwordChanged':
                                self.animateParchment('changePassword', 'loadcharacter');
                                break;

                            case 'failedattempts':
                                self.addValidationError(null, "");
                                break;

                            case 'cheating':
                                self.addValidationError(null, "Attempts to cheat the system will not be tolerated.");
                                break;

                            case 'errorconnecting':
                                self.addValidationError(null, "Unable to connect to the game server, please try again.");
                                break;

                            default:
                                self.addValidationError(null, 'Failed to launch the game: ' + (result.reason ? result.reason : '(unknown error)'));
                                break;
                        }
                    }
                });
            }
        },


        start: function() {
            this.hideIntro();
            $('body').addClass('started'); //ASKY Doesn't use this, look furhter into whether this is necessary or not.

            var $playButton = this.getPlayButton();
            $playButton.click(function () { self.tryStartingGame(); });
        },

        setPlayButtonState: function(enabled) {
            var self = this;
            var $playButton = this.getPlayButton();

            if(enabled) {
                this.starting = false;
                this.$play.removeClass('loading');
                $playButton.click(function () { self.tryStartingGame(); });
                if(this.playButtonRestoreText) {
                    $playButton.text(this.playButtonRestoreText);
                }
            } else {
                // Loading state
                this.starting = true;
                this.$play.addClass('loading');
                $playButton.unbind('click');
                this.playButtonRestoreText = $playButton.text();
                $playButton.text('Loading...');
            }


            $('#boardbutton').click(function(event){
                if(self.game && self.ready){
                    self.game.chathandler.hide();
                    self.game.boardhandler.show();
                }
            });
            $('#gamebutton').click(function(event){
                if(self.game && self.ready){
                    self.game.chathandler.show();
                    self.game.boardhandler.hide();
                }
            });

        },

        getActiveForm: function() {
            if(this.createNewCharacterFormActive()) {
                log.info("createcharacter");
                return $('#createcharacter');
            }
            else if(this.changePasswordFormActive()) {
                log.info("changePassword");
                return $('#changePassword');
            }
            else {
                log.info("loadcharacter");
                return $('#loadcharacter');
            }
        },

        loginFormActive: function() {
            return $('#parchment').hasClass("loadcharacter");
        },

        createNewCharacterFormActive: function() {
            return $('#parchment').hasClass("createcharacter");
        },

        changePasswordFormActive: function() {
            return $('#parchment').hasClass("changePassword");
        },

        /**
         * Performs some basic validation on the login / create new character forms (required fields are filled
         * out, passwords match, email looks valid). Assumes either the login or the create new character form
         * is currently active.
         */

        validateLoginForm: function(username, userpw) {
            this.clearValidationErrors();

            if(!username) {
                this.addValidationError(this.$loginnameinput, 'Please enter a username.');
                return false;
            }

            if(!userpw) {
                this.addValidationError(this.$loginpwinput, 'Please enter a password.');
                return false;
            }
            return true;
        },

        validateCreateForm: function(username, userpw, userpw2, email) {
            this.clearValidationErrors();

            if(!username) {
                this.addValidationError(this.$nameinput, 'Please enter a username.');
                return false;
            }

            if(!userpw) {
                this.addValidationError(this.$pwinput, 'Please enter a password.');
                return false;
            }

            if(!userpw2) {
                this.addValidationError(this.$pwinput2, 'Please confirm your password by typing it again.');
                return false;
            }

            if(userpw !== userpw2) {
                this.addValidationError(this.$pwinput2, 'The passwords you entered do not match. Please make sure you typed the password correctly.');
                return false;
            }

            // Email field is not required, but if it's filled out, then it should look like a valid email.
            if(email && !this.validateEmail(email)) {
                this.addValidationError(this.$email, 'The email you entered appears to be invalid. Please enter a valid email (or leave the email blank).');
                return false;
            }


            return true;
        },

        validateChangePasswordForm: function (username, passwordold, userpw, userpw2)
        {
            this.clearValidationErrors();

            if(!username) {
                this.addValidationError(this.$pwnameinput, 'Please enter a username.');
                return false;
            }

            if(!passwordold) {
                this.addValidationError(this.$pwinputold, 'Please enter your old password.');
                return false;
            }

            if(!userpw) {
                this.addValidationError(this.$pwinputnew, 'Please enter a new password.');
                return false;
            }

            if(!userpw2) {
                this.addValidationError(this.$pwinputnew2, 'Please confirm your password by typing it again.');
                return false;
            }

            if(userpw !== userpw2) {
                this.addValidationError(this.$pwinputnew2, 'The new password you entered do not match. Please make sure you typed the same.');
                return false;
            }

            return true;
        },

        validateEmail: function(email) {
            // Regex borrowed from http://stackoverflow.com/a/46181/393005
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        },

        addValidationError: function(field, errorText) {
            $('<span/>', {
                'class': 'validation-error blink',
                text: errorText
            }).appendTo('.validation-summary');

            if(field) {
                field.addClass('field-error').select();
                field.bind('keypress', function (event) {
                    field.removeClass('field-error');
                    $('.validation-error').remove();
                    $(this).unbind(event);
                });
            }
        },

        clearValidationErrors: function() {
            //var fields = this.loginFormActive() ? this.loginFormFields : this.createNewCharacterFormFields;
            var fields;
            if (this.loginFormActive())
                fields = this.loginFormFields;
            else if (this.createNewCharacterFormActive())
                fields = this.createNewCharacterFormFields;
            else if (this.changePasswordFormActive())
                fields = this.createNewPasswordFormFields;

            if (fields)
            {
                $.each(fields, function(i, field) {
                    if (field.hasClass('field-error'))
                        field.removeClass('field-error');
                });
                $('.validation-error').remove();
            }
        },

        getZoom: function() {
            var zoom = parseFloat($('body').css('zoom'));

            if (this.game.renderer.isFirefox)
            {
                var matrixRegex = /matrix\((-?\d*\.?\d+),\s*0,\s*0,\s*(-?\d*\.?\d+),\s*0,\s*0\)/,
                    matches = $('body').css('-moz-transform').match(matrixRegex);
                zoom = matches[1];
            }
            //log.info("ZOOM="+zoom);
            return zoom;
        },

        setMouseCoordinates: function(event) {
            var gamePos = $('#canvas').offset(),
            //scale = this.game.renderer.getScaleFactor(),
                width = this.game.renderer.getWidth(),
                height = this.game.renderer.getHeight(),
                mouse = this.game.mouse;

            //log.info(event.pageX+","+event.pageY);
            //log.info(~~(gamePos.left)+","+~~(gamePos.top));
            mouse.x = Math.round((event.pageX - gamePos.left) / this.getZoom());
            mouse.y = Math.round((event.pageY - gamePos.top) / this.getZoom());
            //mouse.x = event.pageX - gamePos.left - (this.isMobile ? 0 : 5 * scale);
            //mouse.y = event.pageY - gamePos.top - (this.isMobile ? 0 : 7 * scale);

            //log.info(mouse.x+","+mouse.y);

            if(mouse.x <= 0) {
                mouse.x = 0;
            } else if(mouse.x >= width) {
                mouse.x = width - 1;
            }

            if(mouse.y <= 0) {
                mouse.y = 0;
            } else if(mouse.y >= height) {
                mouse.y = height - 1;
            }
        },
        //Init the hud that makes it show what creature you are mousing over and attacking
        initTargetHud: function(){
            var self = this;
            var scale = self.game.renderer.getScaleFactor(),
                healthMaxWidth = $("#target .health").width() - (12 * scale),
                timeout;

            if (this.game.player) {
                this.game.player.onSetTarget(function(target, name, mouseover){
                    var el = '#target';
                    if(mouseover) el = '#inspector';
                    var sprite = target.sprite;
                    var x, y;
                    if (!self.game.renderer.isFirefox) {
                        if (ItemTypes.isItem(target.kind)) {
                            x = ((sprite.animationData['idle'].length - 1) * sprite.width),
                                y = ((sprite.animationData['idle'].row) * sprite.height);
                        } else if (MobData.Kinds[target.kind]) {
                            if (sprite.animationData['idle_down'])
                            {
                                x = ((sprite.animationData['idle_down'].length - 1) * sprite.width),
                                    y = ((sprite.animationData['idle_down'].row) * sprite.height);
                            }
                        } else {
                            return;
                        }
                    }
                    if (target.title)
                    {
                        $(el+' .name').text(target.title);
                    }
                    else
                    {
                        $(el+' .name').text(name);
                    }
                    $(el+' .name').css('text-transform', 'capitalize');



                    if(el === '#inspector')
                        $(el + ' .details').text(target instanceof Mob ? "Level - " + target.level : (target instanceof Item ? target.getInfoMsg() : "null"));

                    $(el+' .headshot div').height(sprite.height);
                    $(el+' .headshot div').width(sprite.width);
                    $(el+' .headshot div').css('margin-left', -sprite.width/2).css('margin-top', -sprite.height/2);
                    $(el+' .headshot div').css('background', 'url(img/1/'+(target instanceof Item ? 'item-'+name : name)+'.png) no-repeat -'+x+'px -'+y+'px');

                    if(target.healthPoints) {
                        $(el + " .health").css('width', Math.round(target.healthPoints / target.maxHp * 100) + '%');

                    } else{
                        $(el+" .health").css('width', '100%');
                    }

                    $(el).fadeIn('fast');
                    if(mouseover){
                        clearTimeout(timeout);
                        timeout = null;
                        timeout = setTimeout(function(){
                            $('#inspector').fadeOut('fast');
                            if (self.game.player) {
                                self.game.player.inspecting = null;
                            }
                        }, 2000);
                    }
                });
            }

            this.game.onUpdateTarget(function(target){

                $("#target .health").css('width', Math.ceil(target.healthPoints/target.maxHp*100) + "%");
                $("#target .life").text(target.healthPoints < 0 ? 0 : target.healthPoints + "/" + target.maxHp);
                $("#target .life").css('text-transform', 'capitalize');
                if(self.game.player.inspecting && self.game.player.inspecting.id === target.id) {
                    $("#inspector .health").css('width', Math.ceil(target.healthPoints/target.maxHp*100) + "%");

                }
            });

            if (this.game.player) {
                this.game.player.onRemoveTarget(function(targetId){
                    $('#target').fadeOut('fast');
                    if(self.game.player.inspecting && self.game.player.inspecting.id === targetId){
                        $('#inspector').fadeOut('fast');
                        self.game.player.inspecting = null;
                    }
                });
            }
        },
        initManaBar: function() {
            var maxWidth = $("#manabar").width() - (11 * scale);
            if (this.game.renderer) {
                if (this.game.renderer.mobile) {
                    var scale = 1;
                } else {
                    var scale = this.game.renderer.getScaleFactor();
                }
            } else {
                var scale = 2;
            }


            if (scale == 1) {
                maxWidth = 77;
            }
            this.game.onPlayerManaChange(function(mana, maxMana) {
                var barWidth = Math.round((maxWidth / maxMana) * (mana > 0 ? mana : 0));
                $('#mana').css('width', barWidth + "px");
                $('#manatext').html("<p>MP: " + mana + "/" + maxMana + "</p>");
            });
        },

        initExpBar: function(){
            var maxWidth = $("#expbar").width();

            //var rate = expInThisLevel/expForLevelUp;
            //$('#expbar').attr("title", "Exp: " + (rate*100).toFixed(3) + "%");
            //$('#expbar').html("Exp: " + (rate*100).toFixed(3) + "%");

            this.game.onPlayerExpChange(function(level, expInThisLevel, expForLevelUp){

                var rate = expInThisLevel/expForLevelUp;
                if(rate > 1){
                    rate = 1;
                } else if(rate < 0){
                    rate = 0;
                }
                $('#exp').css('width', (rate*maxWidth).toFixed(0) + "px");
                //if (self.game && self.game.ready && self.game.player) {
                $('#expbar').attr("title", "Level: "+level+", Exp: " + (rate*100).toFixed(3) + "%");
                $('#expbar').html("Level: "+level+", Exp: " + (rate*100).toFixed(3) + "%");
                //}
            });
        },

        initHealthBar: function() {

            if (this.game.renderer) {
                if (this.game.renderer.mobile) {
                    var scale = 1;
                } else {
                    var scale = this.game.renderer.getScaleFactor();
                }
            } else {
                var scale = 2;
            }

            var healthMaxWidth = $("#healthbar").width() - (11 * scale);
            if (scale == 1) {
                healthMaxWidth = 77;
            }

            this.game.onPlayerHealthChange(function(hp, maxHp) {
                var barWidth = Math.round((healthMaxWidth / maxHp) * (hp > 0 ? hp : 0));
                $("#health").css('width', barWidth + "px");
                $('#healthtext').html("<p>HP: " + hp + "/" + maxHp + "</p>");
            });

            this.game.onPlayerHurt(this.blinkHealthBar.bind(this));
        },


        blinkHealthBar: function() {
            var $hitpoints = $('#health');

            $hitpoints.addClass('white');
            setTimeout(function() {
                $hitpoints.removeClass('white');
            }, 500);
        },

        toggleButton: function() {
            var name = $('#parchment input').val(),
                $play = $('#createcharacter .play');

            if(name && name.length > 0) {
                $play.removeClass('disabled');
                $('#character').removeClass('disabled');
            } else {
                $play.addClass('disabled');
                $('#character').addClass('disabled');
            }
        },

        hideIntro: function() {
            clearInterval(this.watchNameInputInterval);
            $('body').removeClass('intro');
            setTimeout(function() {
                $('body').addClass('game');
            }, 500);
        },

        showChat: function() {
            if(this.game.started) {
                if (this.showChatLog) {
                    clearTimeout(this.showChatLog);
                    this.showChatLog = null;
                }

                $('#chatbox').addClass('active');
                $('#chatinput').focus();
                $('#chatbutton').addClass('active');
                $('#chatLog').css('visibility', 'visible');
            }
        },

        hideChat: function() {
            if(this.game.started) {
                $('#chatbox').removeClass('active');
                $('#chatinput').blur();
                $('#chatbutton').removeClass('active');
                this.showChatLog = setTimeout(function() {
                    $('#chatLog').css('visibility', 'hidden');
                }, 1000);
            }
        },


        showDropDialog: function(inventoryNumber) {
            if(this.game.started) {
                $('#dropDialog').addClass('active');
                $('#dropCount').focus();
                $('#dropCount').select();

                this.inventoryNumber = inventoryNumber;
                this.dropDialogPopuped = true;
            }
        },
        hideDropDialog: function() {
            if(this.game.started) {
                $('#dropDialog').removeClass('active');
                $('#dropCount').blur();

                this.dropDialogPopuped = false;
            }
        },


        showAuctionSellDialog: function(inventoryNumber) {
            if(this.game.started) {
                $('#auctionSellDialog').addClass('active');
                $('#auctionSellCount').focus();
                $('#auctionSellCount').select();

                this.inventoryNumber = inventoryNumber;
                this.auctionsellDialogPopuped = true;
            }
        },
        hideAuctionSellDialog: function() {
            if(this.game.started) {
                $('#auctionSellDialog').removeClass('active');
                $('#auctionSellCount').blur();

                this.auctionsellDialogPopuped = false;
            }
        },



        hideWindows: function() {

            if($('body').hasClass('credits')) {
                this.closeInGameScroll('credits');
            }
            if($('body').hasClass('legal')) {
                this.closeInGameScroll('legal');
            }
            if($('body').hasClass('about')) {
                this.closeInGameScroll('about');
            }

            if($('#achievements').hasClass('active')) {
                this.toggleAchievements();
                $('#achievementsbutton').removeClass('active');
            }
            this.game.closeItemInfo();
        },

        resetPage: function() {
            var self = this,
                $achievements = $('#achievements');

            if($achievements.hasClass('active')) {
                $achievements.bind(TRANSITIONEND, function() {
                    $achievements.removeClass('page' + self.currentPage).addClass('page1');
                    self.currentPage = 1;
                    $achievements.unbind(TRANSITIONEND);
                });
            }
        },

        toggleInstructions: function() {
            if($('#achievements').hasClass('active')) {
                this.toggleAchievements();
                $('#achievementsbutton').removeClass('active');
            }
            $('#instructions').toggleClass('active');
        },

        toggleAchievements: function() {
            if($('#instructions').hasClass('active')) {
                this.toggleInstructions();
                $('#helpbutton').removeClass('active');
            }
            this.resetPage();
            $('#achievements').toggleClass('active');
        },

        toggleScrollContent: function(content) {
            var currentState = $('#parchment').attr('class');

            if(this.game.started) {
                $('#parchment').removeClass().addClass(content);

                $('body').removeClass('credits legal about').toggleClass(content);

                if(!this.game.player) {
                    $('body').toggleClass('death');
                }

                if(content !== 'about') {
                    $('#helpbutton').removeClass('active');
                }
            } else {
                if(currentState !== 'animate') {
                    if(currentState === content) {
                        this.animateParchment(currentState, this.frontPage);
                    } else {
                        this.animateParchment(currentState, content);
                    }
                }
            }
        },

        showAchievementNotification: function(id, name) {
            var $notif = $('#achievement-notification'),
                $name = $notif.find('.name'),
                $button = $('#achievementsbutton');

            $notif.removeClass().addClass('active achievement' + id);
            $name.text(name);
            if(this.game.storage.getAchievementCount() === 1) {
                this.blinkInterval = setInterval(function() {
                    $button.toggleClass('blink');
                }, 500);
            }
            setTimeout(function() {
                $notif.removeClass('active');
                $button.removeClass('blink');
            }, 5000);
        },

        displayUnlockedAchievement: function(id) {
            var $achievement = $('#achievements li.achievement' + id);

            var achievement = this.game.getAchievementById(id);
            if(achievement && achievement.hidden) {
                this.setAchievementData($achievement, achievement.name, achievement.desc);
            }
            $achievement.addClass('unlocked');
        },

        unlockAchievement: function(id, name) {
            this.showAchievementNotification(id, name);
            this.displayUnlockedAchievement(id);

            var nb = parseInt($('#unlocked-achievements').text());
            $('#unlocked-achievements').text(nb + 1);
        },

        initAchievementList: function(achievements) {
            var self = this,
                $lists = $('#lists'),
                $page = $('#page-tmpl'),
                $achievement = $('#achievement-tmpl'),
                page = 0,
                count = 0,
                $p = null;

            _.each(achievements, function(achievement) {
                count++;

                var $a = $achievement.clone();
                $a.removeAttr('id');
                $a.addClass('achievement' + count);
                self.setAchievementData($a, achievement.name, achievement.desc);
                $a.find('.twitter').attr('href', '');
                $a.show();
                $a.find('a').click(function() {
                    var url = $(this).attr('href');

                    self.openPopup('twitter', url);
                    return false;
                });

                if((count - 1) % 4 === 0) {
                    page++;
                    $p = $page.clone();
                    $p.attr('id', 'page'+page);
                    $p.show();
                    $lists.append($p);
                }
                $p.append($a);
            });

            $('#total-achievements').text($('#achievements').find('li').length);
        },

        initUnlockedAchievements: function(ids) {
            var self = this;

            _.each(ids, function(id) {
                self.displayUnlockedAchievement(id);
            });
            $('#unlocked-achievements').text(ids.length);
        },

        setAchievementData: function($el, name, desc) {
            $el.find('.achievement-name').html(name);
            $el.find('.achievement-description').html(desc);
        },

        closeInGameScroll: function(content) {
            $('body').removeClass(content);
            $('#parchment').removeClass(content);
            if(!this.game.player) {
                $('body').addClass('death');
            }
            if(content === 'about') {
                $('#helpbutton').removeClass('active');
            }
        },

        togglePopulationInfo: function() {
            $('#population').toggleClass('visible');
        },

        openPopup: function(type, url) {
            var h = $(window).height(),
                w = $(window).width(),
                popupHeight,
                popupWidth,
                top,
                left;

            switch(type) {
                case 'twitter':
                    popupHeight = 450;
                    popupWidth = 550;
                    break;
                case 'facebook':
                    popupHeight = 400;
                    popupWidth = 580;
                    break;
            }

            top = (h / 2) - (popupHeight / 2);
            left = (w / 2) - (popupWidth / 2);

            newwindow = window.open(url,'name','height=' + popupHeight + ',width=' + popupWidth + ',top=' + top + ',left=' + left);
            if (window.focus) {newwindow.focus();}
        },

        animateParchment: function(origin, destination) {
            var self = this,
                $parchment = $('#parchment'),
                duration = 1;

            if(this.isMobile) {
                $parchment.removeClass(origin).addClass(destination);
            } else {
                if(this.isParchmentReady) {
                    if(this.isTablet) {
                        duration = 0;
                    }
                    this.isParchmentReady = !this.isParchmentReady;

                    $parchment.toggleClass('animate');
                    $parchment.removeClass(origin);

                    setTimeout(function() {
                        $('#parchment').toggleClass('animate');
                        $parchment.addClass(destination);
                    }, duration * 1000);

                    setTimeout(function() {
                        self.isParchmentReady = !self.isParchmentReady;
                    }, duration * 1000);
                }
            }
        },

        animateMessages: function() {
            var $messages = $('#notifications div');

            $messages.addClass('top');
        },

        resetMessagesPosition: function() {
            var message = $('#message2').text();

            $('#notifications div').removeClass('top');
            $('#message2').text('');
            $('#message1').text(message);
        },

        showMessage: function(message) {
            var $wrapper = $('#notifications div'),
                $message = $('#notifications #message2');

            this.animateMessages();
            $message.text(message);
            if(this.messageTimer) {
                this.resetMessageTimer();
            }

            this.messageTimer = setTimeout(function() {
                $wrapper.addClass('top');
            }, 5000);
        },

        resetMessageTimer: function() {
            clearTimeout(this.messageTimer);
        },

        resizeUi: function() {
            log.info("Rescaling..");
            if(this.game) {
                if(this.game.started) {
                    this.game.resize();
                    this.initHealthBar();
                    this.initTargetHud();
                    this.initExpBar();
                    this.game.updateBars();
                } else {
                    var newScale = this.game.renderer.getScaleFactor();

                    this.game.renderer.rescale(newScale);
                }
            }
        }
    });

    return App;
});
