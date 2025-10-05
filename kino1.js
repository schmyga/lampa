(function() {
    'use strict';

    try {
        console.log('SerPlay Kinoger plugin started at ' + new Date().toLocaleTimeString());

        if (typeof Lampa === 'undefined') {
            console.error('Lampa API not loaded at ' + new Date().toLocaleTimeString());
            return;
        }

        // Компонент для choice-view (балансер Kinoger)
        function component(object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var filter = new Lampa.Filter(object);
            var movie = object.movie; // Данные фильма из full-view

            this.start = function() {
                console.log('SerPlay Kinoger start at ' + new Date().toLocaleTimeString());
                filter.onSearch = function(value) {
                    Lampa.Activity.replace({ search: value, clarification: true });
                }.bind(this);
                filter.onBack = function() {
                    Lampa.Activity.back();
                }.bind(this);
                filter.render().find('.filter--sort span').text('Балансер: Kinoger');
                scroll.body().addClass('torrent-list');
                Lampa.Controller.enable('content');
                this.searchMovieOnKinoger();
            }.bind(this);

            this.initialize = function() {
                console.log('SerPlay Kinoger initialize at ' + new Date().toLocaleTimeString());
                scroll.body().append(Lampa.Template.get('lampac_content_loading'));
                this.start();
            }.bind(this);

            this.searchMovieOnKinoger = function() {
                var search_url = 'https://kinoger.com/stream/search/' + encodeURIComponent(movie.title);
                console.log('Searching movie on Kinoger:', search_url);

                network.silent(search_url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'https://kinoger.com/'
                    }
                }, function(html) {
                    this.extractStream(html);
                    this.append();
                }.bind(this), function(error) {
                    console.error('Search error:', error);
                    Lampa.Noty.show('Фильм не найден на Kinoger (403 — попробуйте позже).');
                    this.reset();
                }.bind(this));
            }.bind(this);

            this.extractStream = function(html) {
                var video_url = '';
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');

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
                    this.object.results = [{
                        title: movie.title,
                        url: video_url,
                        quality: 'Auto',
                        direct: true
                    }];
                } else {
                    this.object.results = [];
                    Lampa.Noty.show('HLS-поток не найден на Kinoger.');
                }
                console.log('Stream extracted, URL:', video_url);
            }.bind(this);

            this.append = function() {
                scroll.clear();
                if (this.object.results.length) {
                    this.object.results.forEach(function(item) {
                        var elem = Lampa.Template.get('online_modal', item);
                        elem.on('hover:enter', function() {
                            Lampa.Player.play({
                                url: item.url,
                                title: item.title,
                                quality: { 'Auto': item.url }
                            });
                        });
                        scroll.append(elem);
                    });
                } else {
                    scroll.append('<div>Нет доступных потоков на Kinoger</div>');
                }
            }.bind(this);

            this.reset = function() {
                console.log('SerPlay Kinoger reset at ' + new Date().toLocaleTimeString());
                scroll.clear();
                if (filter.reset) filter.reset(); // Проверка на существование метода
            }.bind(this);

            this.destroy = function() {
                console.log('SerPlay Kinoger destroyed at ' + new Date().toLocaleTimeString());
                if (scroll.destroy) scroll.destroy();
                if (filter.destroy) filter.destroy();
                Lampa.Controller.toggle('content');
            }.bind(this);
        }

        Lampa.Component.add('serplay_kinoger', component);

        // Добавление кнопки "SerPlay" в full-view (карточка с описанием фильма)
        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                // Удаляем дефолтную кнопку "Смотреть", чтобы избежать конфликта
                e.object.activity.render().find('.full-start__button.view--online').remove();

                var btn = $('<div class="full-start__button selector view--online serplay--button"><span>SerPlay</span></div>');
                btn.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: '',
                        title: 'SerPlay Kinoger',
                        component: 'serplay_kinoger',
                        movie: e.data.movie,
                        page: 1
                    });
                });
                e.object.activity.render().find('.view--torrent').after(btn);
                console.log('SerPlay button added in full-view at ' + new Date().toLocaleTimeString());
            }
        });

        console.log('SerPlay Kinoger plugin registered at ' + new Date().toLocaleTimeString());

    } catch (e) {
        console.error('SerPlay Kinoger plugin error at ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
