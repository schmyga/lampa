(function() {
    'use strict';
    try {
        console.log('Kinoger v9 script started at ' + new Date().toLocaleTimeString());

        if (typeof Lampa === 'undefined') {
            console.error('Lampa API not loaded at ' + new Date().toLocaleTimeString());
            return;
        }

        function component() {
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var filter = new Lampa.Filter(this.object);

            this.initialize = function() {
                console.log('Kinoger v9 component initialized at ' + new Date().toLocaleTimeString());
                filter.onSearch = function(value) {
                    Lampa.Activity.replace({ search: value, clarification: true });
                };
                filter.onBack = function() {
                    this.start();
                };
                filter.render().find('.filter--sort span').text('Источник: Kinoger');
                scroll.body().addClass('torrent-list');
                scroll.body().append(Lampa.Template.get('lampac_content_loading'));
                Lampa.Controller.enable('content');
                this.find();
            };

            this.destroy = function() {
                console.log('Kinoger v9 component destroyed at ' + new Date().toLocaleTimeString());
                scroll.destroy();
                filter.destroy();
                Lampa.Controller.toggle('content');
            };

            this.find = function() {
                var url = 'https://kinoger.com/stream/';
                console.log('Fetching catalog from Kinoger:', url);

                Lampa.Network.silent(url, function(html) {
                    this.extractData(html);
                    this.append();
                }.bind(this), function(error) {
                    console.error('Network error:', error);
                    this.noConnectToServer();
                }.bind(this));
            };

            this.extractData = function(html) {
                var items = [];
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');

                var elements = doc.querySelectorAll('.movie-item, .film-card, .card, .item');
                elements.forEach(function(el) {
                    var title = el.querySelector('.title, h2, h3, .name')?.textContent.trim() || 'Без названия';
                    var poster = el.querySelector('img')?.src || '';
                    var link = el.querySelector('a')?.href || '';
                    var year = el.querySelector('.year, .release')?.textContent.trim() || '';

                    if (title && link) {
                        items.push({ title, year, poster, url: link, type: 'movie' });
                    }
                });

                this.object.results = items;
                console.log('Parsed items count:', items.length);
            };

            this.append = function() {
                scroll.clear();
                this.object.results.forEach(function(item) {
                    var elem = Lampa.Template.get('online_prestige_folder', item);
                    elem.on('hover:enter', function() {
                        this.stream(item);
                    }.bind(this));
                    scroll.append(elem);
                }.bind(this));
            };

            this.stream = function(element) {
                var movie_url = element.url;
                console.log('Fetching stream from Kinoger:', movie_url);

                Lampa.Network.silent(movie_url, function(html) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');
                    var video_url = '';

                    var iframe = doc.querySelector('iframe[src*=".m3u8"]');
                    if (iframe) video_url = iframe.src;

                    if (!video_url) {
                        var scripts = doc.querySelectorAll('script');
                        scripts.forEach(function(script) {
                            var content = script.textContent;
                            if (content.includes('.m3u8')) {
                                var match = content.match(/https?:\/\/[^\s'"]+\.m3u8[^\s'"]*/);
                                if (match) video_url = match[0];
                            }
                        });
                    }

                    if (video_url) {
                        Lampa.Player.play({
                            url: video_url,
                            title: element.title,
                            quality: { 'Auto': video_url }
                        });
                    } else {
                        Lampa.Noty.show('HLS-поток не найден на Kinoger.');
                    }
                }, function() {
                    Lampa.Noty.show('Ошибка загрузки страницы фильма.');
                });
            };

            this.reset = function() {
                scroll.clear();
                filter.reset();
            };

            this.noConnectToServer = function() {
                Lampa.Noty.show('Не удалось подключиться к Kinoger.');
            };

            this.start = function() {
                Lampa.Activity.replace();
            };
        }

        console.log('Starting Kinoger v9 plugin at ' + new Date().toLocaleTimeString());
        Lampa.Component.add('kinoger_test_v9', component);
        Lampa.Menu.add('kinoger_test_menu_v9', {
            title: 'Kinoger Test Menu v9',
            url: 'plugin/kinoger_test_v9',
            type: 'catalog'
        });
        console.log('Kinoger v9 plugin registered at ' + new Date().toLocaleTimeString());

    } catch (e) {
        console.error('Kinoger v9 error at ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
