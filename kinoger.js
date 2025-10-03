(function() {
    'use strict';

    function component(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var filter = new Lampa.Filter(object);
        var last;
        var balanser = 'rezka';

        var filter_translate = {
            voice: Lampa.Lang.translate('torrent_parser_voice'),
            source: Lampa.Lang.translate('settings_rest_source')
        };

        var filter_find = { voice: [] };

        this.initialize = function() {
            console.log('Rezka plugin initializing');
            filter.onSearch = function(value) {
                Lampa.Activity.replace({ search: value, clarification: true });
            };
            filter.onBack = function() {
                this.start();
            };
            filter.onSelect = function(type, a, b) {
                if (type == 'filter') {
                    if (a.reset) {
                        this.reset();
                    } else {
                        var choice = this.getChoice();
                        choice[a.stype] = b.index;
                        this.saveChoice(choice);
                        this.reset();
                    }
                }
            };
            filter.render().find('.filter--sort span').text('Источник: Rezka');
            scroll.body().addClass('torrent-list');
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            Lampa.Controller.enable('content');
            this.find();
        };

        this.find = function() {
            var url = 'https://rezka.ag/films/';
            console.log('Fetching catalog from Rezka:', url);

            network.silent(url, function(html) {
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

            var elements = doc.querySelectorAll('.b-movie-item');
            elements.forEach(function(el) {
                var title = el.querySelector('.b-movie-item__title')?.textContent.trim() || 'Без названия';
                var poster = el.querySelector('img')?.src || '';
                var link = el.querySelector('a')?.href || '';
                var year = el.querySelector('.b-movie-item__year')?.textContent.trim() || '';

                if (title && link) {
                    items.push({ title, year, poster, url: link, type: 'movie' });
                }
            });

            object.results = items;
            console.log('Parsed items count:', items.length);
        };

        this.append = function() {
            scroll.clear();
            object.results.forEach(function(item) {
                var elem = Lampa.Template.get('online_prestige_folder', item);
                elem.on('hover:enter', function() {
                    this.stream(item);
                }.bind(this));
                scroll.append(elem);
            }.bind(this));
        };

        this.stream = function(element) {
            var movie_url = element.url;
            console.log('Fetching stream from:', movie_url);

            network.silent(movie_url, function(html) {
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
                    Lampa.Noty.show('Видео не найдено.');
                }
            }, function() {
                Lampa.Noty.show('Ошибка загрузки.');
            });
        };

        this.reset = function() {
            scroll.clear();
            filter.reset();
        };

        this.noConnectToServer = function() {
            Lampa.Noty.show('Не удалось подключиться к Rezka.');
        };

        this.start = function() {
            Lampa.Activity.replace();
        };
    }

    function startPlugin() {
        window.rezka_plugin = true;
        Lampa.Component.add('rezka', component);
        Lampa.Menu.add('rezka', {
            title: 'Rezka',
            url: 'plugin/rezka',
            type: 'catalog'
        });

        function addButton(e) {
            if (e.render.find('.rezka--button').length) return;
            var btn = $('<div class="full-start__button selector view--online"><span>Rezka</span></div>');
            btn.on('hover:enter', function() {
                Lampa.Activity.push({
                    url: '',
                    title: 'Rezka',
                    component: 'rezka',
                    movie: e.movie,
                    page: 1
                });
            });
            e.render.before(btn);
        }

        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                addButton({ render: e.object.activity.render().find('.view--torrent'), movie: e.data.movie });
            }
        });
    }

    if (!window.rezka_plugin) startPlugin();
})();
