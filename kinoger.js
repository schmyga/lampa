(function() {
    'use strict';

    function component(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var filter = new Lampa.Filter(object);
        var last;
        var balanser = 'kinoger'; // Фиксированный балансер для Kinoger

        var filter_translate = {
            voice: Lampa.Lang.translate('torrent_parser_voice'),
            source: Lampa.Lang.translate('settings_rest_source')
        };

        var filter_find = { voice: [] };

        this.initialize = function() {
            console.log('Kinoger plugin initializing');
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
            filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser1'));
            scroll.body().addClass('torrent-list');
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            Lampa.Controller.enable('content');
            this.search();
        };

        this.search = function() {
            this.reset();
            this.find();
        };

        this.find = function() {
            var url = 'https://kinoger.com/stream/';
            console.log('Fetching catalog from Kinoger:', url);

            network.silent(url, function(html) {
                this.extractData(html);
                this.append();
            }.bind(this), function() {
                this.noConnectToServer();
            }.bind(this));
        };

        this.extractData = function(html) {
            var items = [];
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');

            // Гибкие селекторы для элементов каталога
            var selectors = ['.movie-item', '.film-card', '.card', '.item', '.movie', '[data-movie]'];
            var elements = [];
            selectors.forEach(function(sel) {
                var els = doc.querySelectorAll(sel);
                if (els.length > 0) {
                    elements = Array.from(els);
                    console.log('Found elements with selector:', sel, 'Count:', els.length);
                }
            });

            if (elements.length === 0) {
                console.warn('No elements found, adding test item');
                items.push({
                    title: 'Тестовый фильм Kinoger',
                    year: '2024',
                    poster: 'https://via.placeholder.com/200x300?text=Kinoger Test',
                    url: 'https://kinoger.com/stream/filmy/2024/venom-3-2024/', // Пример URL фильма
                    type: 'movie'
                });
            } else {
                elements.forEach(function(el) {
                    var titleSelectors = ['.title', 'h2', 'h3', '.name', '.movie-title'];
                    var title = '';
                    titleSelectors.forEach(function(tsel) {
                        var tel = el.querySelector(tsel);
                        if (tel && !title) title = tel.textContent.trim();
                    });

                    var poster = el.querySelector('img')?.src || '';
                    var linkEl = el.querySelector('a');
                    var link = linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : 'https://kinoger.com' + linkEl.href) : '';

                    var yearSelectors = ['.year', '.release', '[class*="year"]'];
                    var year = '';
                    yearSelectors.forEach(function(ysel) {
                        var yel = el.querySelector(ysel);
                        if (yel && !year) year = yel.textContent.trim();
                    });

                    if (title && link) {
                        items.push({
                            title: title,
                            year: year,
                            poster: poster,
                            url: link,
                            type: 'movie'
                        });
                    }
                });
            }

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

                var iframe = doc.querySelector('iframe[src*=".m3u8"], iframe');
                if (iframe && iframe.src.includes('.m3u8')) {
                    video_url = iframe.src;
                }

                if (!video_url) {
                    var scripts = doc.querySelectorAll('script');
                    scripts.forEach(function(script) {
                        var content = script.textContent || script.innerHTML;
                        if (content.includes('.m3u8')) {
                            var match = content.match(/https?:\/\/[^\s'"]+\.m3u8[^\s'"]*/g);
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
                    Lampa.Player.runas('android'); // Для HLS на Android
                } else {
                    Lampa.Noty.show('HLS-поток не найден. Проверьте страницу фильма.');
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
            Lampa.Noty.show('Не удалось подключиться к Kinoger. Проверьте интернет.');
        };

        this.start = function() {
            Lampa.Activity.replace();
        };

        this.getChoice = function() {
            return Lampa.Storage.get('kinoger_choice', { voice: 0 });
        };

        this.saveChoice = function(choice) {
            Lampa.Storage.set('kinoger_choice', choice);
        };
    }

    function startPlugin() {
        window.kinoger_plugin = true;
        Lampa.Component.add('kinoger_stream', component);
        Lampa.Menu.add('kinoger', {
            title: 'Kinoger Stream',
            url: 'plugin/kinoger_stream',
            type: 'catalog'
        });

        var manifst = {
            title: 'Kinoger Plugin',
            description: 'Плагин для просмотра фильмов с Kinoger.com',
            version: '1.0.0',
            manifest_version: 2,
            icon: '',
            type: 'video',
            id: 'kinoger',
            categories: ['online']
        };

        Lampa.Manifest.plugins = manifst;

        function addButton(e) {
            if (e.render.find('.kinoger--button').length) return;
            var btn = $('<div class="full-start__button selector view--online"><svg style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="115.75" ry="115.75"></rect><path d="m377.25 0v512h-242.5V0h242.5zM338.5 448.75h-165V64.25h165v384.5z"></path></svg><span>Kinoger</span></div>');
            btn.on('hover:enter', function() {
                Lampa.Activity.push({
                    url: '',
                    title: 'Kinoger Stream',
                    component: 'kinoger_stream',
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

    if (!window.kinoger_plugin) startPlugin();
})();
