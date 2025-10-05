(function() {
    'use strict';

    try {
        console.log('SerPlay Multi-Source plugin started');

        if (typeof Lampa === 'undefined') {
            console.error('Lampa API not loaded');
            return;
        }

        // Балансер с несколькими источниками
        function component(object) {
            var network = new Lampa.Request();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var filter = new Lampa.Filter(object);
            var movie = object.movie;
            
            // Список источников
            this.sources = [
                {
                    name: 'Kinoger',
                    url: 'https://kinoger.com',
                    search: function(title) {
                        return 'https://kinoger.com/stream/search/' + encodeURIComponent(title);
                    },
                    parser: this.parseKinoger.bind(this)
                },
                {
                    name: 'Cine.to', 
                    url: 'https://cine.to',
                    search: function(title) {
                        return 'https://cine.to/search?q=' + encodeURIComponent(title);
                    },
                    parser: this.parseCineTo.bind(this)
                },
                {
                    name: 'BS.to',
                    url: 'https://bs.to',
                    search: function(title) {
                        return 'https://bs.to/search?q=' + encodeURIComponent(title);
                    },
                    parser: this.parseBS.bind(this)
                }
            ];

            this.currentSource = 0;
            this.results = [];

            this.start = function() {
                console.log('SerPlay Multi-Source started');
                
                filter.onSearch = function(value) {
                    Lampa.Activity.replace({ search: value, clarification: true });
                };
                
                filter.onBack = function() {
                    Lampa.Activity.back();
                };

                // Добавляем переключатель источников в фильтр
                this.addSourceSelector();
                
                filter.render().find('.filter--sort span').text('Выбор источника');
                scroll.body().addClass('torrent-list');
                Lampa.Controller.enable('content');
                
                this.searchCurrentSource();
            }.bind(this);

            this.initialize = function() {
                console.log('SerPlay initializing');
                scroll.body().append(Lampa.Template.get('lampac_content_loading'));
                this.start();
            }.bind(this);

            // Добавляем переключатель источников
            this.addSourceSelector = function() {
                var sourceSelector = $('<div class="filter--source-selector" style="margin: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;"></div>');
                
                var sourceText = $('<div style="margin-bottom: 8px; color: #fff; font-size: 14px;">Источник: <span class="source-name">' + this.sources[this.currentSource].name + '</span></div>');
                
                var switchBtn = $('<div class="selector" style="padding: 8px 16px; background: rgba(255,255,255,0.2); border-radius: 6px; text-align: center; cursor: pointer;">Сменить источник</div>');
                
                switchBtn.on('hover:enter', function() {
                    this.currentSource = (this.currentSource + 1) % this.sources.length;
                    sourceText.find('.source-name').text(this.sources[this.currentSource].name);
                    console.log('Switched to source:', this.sources[this.currentSource].name);
                    
                    // Очищаем и перезагружаем результаты
                    scroll.body().html(Lampa.Template.get('lampac_content_loading'));
                    this.searchCurrentSource();
                }.bind(this));
                
                sourceSelector.append(sourceText);
                sourceSelector.append(switchBtn);
                filter.render().find('.filter--panel').after(sourceSelector);
            }.bind(this);

            this.searchCurrentSource = function() {
                var source = this.sources[this.currentSource];
                var search_url = source.search(movie.title);
                
                console.log('Searching on', source.name, ':', search_url);

                network.silent(search_url, function(html) {
                    if (!html) {
                        this.showError('Пустой ответ от ' + source.name);
                        return;
                    }
                    
                    var streams = source.parser(html);
                    if (streams && streams.length > 0) {
                        this.results = streams;
                        this.appendResults();
                    } else {
                        this.showError('Фильм не найден на ' + source.name);
                    }
                }.bind(this), function(error) {
                    console.error('Search error on', source.name, ':', error);
                    this.showError('Ошибка подключения к ' + source.name);
                }.bind(this));
            }.bind(this);

            // Парсер для Kinoger
            this.parseKinoger = function(html) {
                var streams = [];
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');

                try {
                    // Поиск iframe с m3u8
                    var iframes = doc.querySelectorAll('iframe[src*=".m3u8"]');
                    iframes.forEach(function(iframe, index) {
                        if (iframe.src) {
                            streams.push({
                                title: movie.title + ' (HLS ' + (index + 1) + ')',
                                url: iframe.src,
                                quality: 'Auto',
                                direct: true,
                                source: 'Kinoger'
                            });
                        }
                    });

                    // Поиск в скриптах
                    if (streams.length === 0) {
                        var scripts = doc.querySelectorAll('script');
                        scripts.forEach(function(script) {
                            var content = script.textContent;
                            if (content.includes('.m3u8')) {
                                var matches = content.match(/https?:\/\/[^\s'"]+\.m3u8[^\s'"]*/g);
                                if (matches) {
                                    matches.forEach(function(match, index) {
                                        streams.push({
                                            title: movie.title + ' (HLS ' + (index + 1) + ')',
                                            url: match,
                                            quality: 'Auto', 
                                            direct: true,
                                            source: 'Kinoger'
                                        });
                                    });
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.error('Kinoger parsing error:', e);
                }

                return streams;
            };

            // Парсер для Cine.to
            this.parseCineTo = function(html) {
                var streams = [];
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');

                try {
                    // Поиск ссылок на видео
                    var videoLinks = doc.querySelectorAll('a[href*="/movie/"], a[href*="/film/"]');
                    videoLinks.forEach(function(link, index) {
                        var href = link.href;
                        var title = link.textContent.trim() || movie.title + ' (Cine ' + (index + 1) + ')';
                        
                        if (href && href.includes('/movie/') || href.includes('/film/')) {
                            streams.push({
                                title: title,
                                url: href,
                                quality: 'HD',
                                direct: false,
                                source: 'Cine.to'
                            });
                        }
                    });

                    // Альтернативный поиск
                    if (streams.length === 0) {
                        var players = doc.querySelectorAll('[data-player], [data-url]');
                        players.forEach(function(player, index) {
                            var url = player.getAttribute('data-url') || player.getAttribute('data-player');
                            if (url && (url.includes('.m3u8') || url.includes('video') || url.includes('stream'))) {
                                streams.push({
                                    title: movie.title + ' (Stream ' + (index + 1) + ')',
                                    url: url,
                                    quality: 'Auto',
                                    direct: true,
                                    source: 'Cine.to'
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.error('Cine.to parsing error:', e);
                }

                return streams;
            };

            // Парсер для BS.to
            this.parseBS = function(html) {
                var streams = [];
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');

                try {
                    // Поиск серий/фильмов
                    var episodes = doc.querySelectorAll('.episodes li a, .season-episodes a');
                    episodes.forEach(function(episode, index) {
                        var href = episode.href;
                        var title = episode.textContent.trim() || movie.title + ' (BS ' + (index + 1) + ')';
                        
                        if (href) {
                            streams.push({
                                title: title,
                                url: href,
                                quality: 'HD',
                                direct: false,
                                source: 'BS.to'
                            });
                        }
                    });

                    // Альтернативный поиск
                    if (streams.length === 0) {
                        var links = doc.querySelectorAll('a[href*="/serie/"], a[href*="/movie/"]');
                        links.forEach(function(link, index) {
                            if (link.href) {
                                streams.push({
                                    title: movie.title + ' (Link ' + (index + 1) + ')',
                                    url: link.href,
                                    quality: 'HD',
                                    direct: false, 
                                    source: 'BS.to'
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.error('BS.to parsing error:', e);
                }

                return streams;
            };

            this.appendResults = function() {
                scroll.clear();
                
                if (this.results.length > 0) {
                    this.results.forEach(function(item, index) {
                        var templateData = {
                            title: item.title,
                            url: item.url,
                            quality: item.quality,
                            description: 'Источник: ' + item.source
                        };
                        
                        var elem = Lampa.Template.get('online_modal', templateData);
                        if (elem) {
                            // Добавляем иконку источника
                            var sourceBadge = $('<div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 4px; font-size: 10px;">' + item.source + '</div>');
                            elem.find('.online-modal__poster').append(sourceBadge);
                            
                            elem.on('hover:enter', function() {
                                console.log('Playing from', item.source, ':', item.url);
                                Lampa.Player.play({
                                    url: item.url,
                                    title: movie.title,
                                    quality: { 
                                        [item.quality]: item.url 
                                    }
                                });
                            });
                            
                            scroll.append(elem);
                        }
                    });
                } else {
                    var noResults = $('<div class="selector" style="padding: 40px 20px; text-align: center; color: #999;">' +
                        '<div>Нет доступных потоков</div>' +
                        '<div style="font-size: 12px; margin-top: 10px;">Попробуйте сменить источник</div>' +
                        '</div>');
                    scroll.append(noResults);
                }
            }.bind(this);

            this.showError = function(message) {
                scroll.clear();
                var errorElem = $('<div class="selector" style="padding: 40px 20px; text-align: center; color: #ff4444;">' +
                    '<div>' + message + '</div>' +
                    '<div style="font-size: 12px; margin-top: 10px;">Попробуйте другой источник</div>' +
                    '</div>');
                scroll.append(errorElem);
                Lampa.Noty.show(message);
            }.bind(this);

            this.destroy = function() {
                console.log('SerPlay destroyed');
                if (scroll) scroll.destroy();
                if (filter) filter.destroy();
                Lampa.Controller.toggle('content');
            }.bind(this);

            this.initialize();
        }

        // Регистрация компонента
        Lampa.Component.add('serplay_balancer', component);

        // Добавляем кнопку в карточку фильма
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                try {
                    var activityRender = e.object.activity.render();
                    
                    // Удаляем старые кнопки SerPlay
                    activityRender.find('.serplay-button').remove();
                    
                    // Создаем красивую кнопку "Смотреть"
                    var watchBtn = $('<div class="full-start__button selector view--online serplay-button" style="background: linear-gradient(45deg, #FF6B35, #FF8E53); margin: 5px;">' +
                        '<div style="display: flex; align-items: center; justify-content: center;">' +
                        '<span style="margin-right: 8px;">🎬</span>' +
                        '<span>Смотреть</span>' +
                        '</div>' +
                        '</div>');
                    
                    watchBtn.on('hover:enter', function() {
                        if (!e.data || !e.data.movie) {
                            Lampa.Noty.show('Ошибка: данные фильма не загружены');
                            return;
                        }
                        
                        Lampa.Activity.push({
                            url: '',
                            title: 'SerPlay - ' + e.data.movie.title,
                            component: 'serplay_balancer',
                            movie: e.data.movie,
                            page: 1
                        });
                    });
                    
                    // Добавляем кнопку в блок с другими кнопками
                    var buttonsContainer = activityRender.find('.full-start__buttons');
                    if (buttonsContainer.length) {
                        buttonsContainer.append(watchBtn);
                    }
                    
                    console.log('SerPlay "Смотреть" button added');
                } catch (error) {
                    console.error('Error adding watch button:', error);
                }
            }
        });

        console.log('SerPlay Multi-Source plugin successfully registered');

    } catch (e) {
        console.error('SerPlay plugin fatal error:', e);
    }
})();
