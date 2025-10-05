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
                    name: 'FilmSoft', 
                    url: 'https://filmsoft.net',
                    search: function(title) {
                        return 'https://filmsoft.net/search?q=' + encodeURIComponent(title);
                    },
                    parser: this.parseFilmSoft.bind(this)
                },
                {
                    name: 'CineZone',
                    url: 'https://cinezone.to',
                    search: function(title) {
                        return 'https://cinezone.to/search?q=' + encodeURIComponent(title);
                    },
                    parser: this.parseCineZone.bind(this)
                }
            ];

            this.currentSource = 0;
            this.results = [];

            this.start = function() {
                console.log('SerPlay Multi-Source started');
                
                scroll.body().addClass('torrent-list');
                Lampa.Controller.enable('content');
                
                // Создаем свой заголовок и переключатель
                this.createHeader();
                
                this.searchCurrentSource();
            }.bind(this);

            this.initialize = function() {
                console.log('SerPlay initializing');
                scroll.body().append(Lampa.Template.get('lampac_content_loading'));
                this.start();
            }.bind(this);

            // Создаем кастомный заголовок с переключателем
            this.createHeader = function() {
                var header = $('<div class="choice__head" style="padding: 15px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1);">' +
                    '<div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap; gap: 10px;">' +
                    '<div style="flex: 1;">' +
                    '<div class="choice__title" style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">SerPlay Балансер</div>' +
                    '<div class="choice__subtitle" style="font-size: 12px; color: #aaa;">Выберите источник для просмотра</div>' +
                    '</div>' +
                    '<div class="source-selector" style="display: flex; align-items: center; gap: 10px;">' +
                    '<span style="font-size: 12px;">Источник:</span>' +
                    '<div class="selector source-switch" style="padding: 8px 12px; background: rgba(255,255,255,0.1); border-radius: 6px; min-width: 120px; text-align: center;">' +
                    '<span class="source-name">' + this.sources[this.currentSource].name + '</span>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>');

                // Добавляем обработчик для переключения источника
                header.find('.source-switch').on('hover:enter', function() {
                    this.currentSource = (this.currentSource + 1) % this.sources.length;
                    header.find('.source-name').text(this.sources[this.currentSource].name);
                    console.log('Switched to source:', this.sources[this.currentSource].name);
                    
                    // Показываем загрузку и ищем заново
                    scroll.body().html(Lampa.Template.get('lampac_content_loading'));
                    this.searchCurrentSource();
                }.bind(this));

                // Вставляем заголовок перед скроллом
                scroll.body().before(header);
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
                
                try {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');

                    // Поиск iframe с видео
                    var iframes = doc.querySelectorAll('iframe');
                    iframes.forEach(function(iframe, index) {
                        if (iframe.src) {
                            streams.push({
                                title: movie.title + ' (Stream ' + (index + 1) + ')',
                                url: iframe.src,
                                quality: 'HD',
                                direct: true,
                                source: 'Kinoger'
                            });
                        }
                    });

                    // Поиск ссылок на видео
                    var videoLinks = doc.querySelectorAll('a[href*="watch"], a[href*="video"], a[href*="stream"]');
                    videoLinks.forEach(function(link, index) {
                        if (link.href && streams.length < 5) { // Ограничиваем количество результатов
                            streams.push({
                                title: link.textContent.trim() || movie.title + ' (Link ' + (index + 1) + ')',
                                url: link.href,
                                quality: 'Auto',
                                direct: false,
                                source: 'Kinoger'
                            });
                        }
                    });

                } catch (e) {
                    console.error('Kinoger parsing error:', e);
                }

                return streams.slice(0, 3); // Возвращаем только первые 3 результата
            };

            // Парсер для FilmSoft
            this.parseFilmSoft = function(html) {
                var streams = [];
                
                try {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');

                    // Поиск карточек фильмов
                    var movieCards = doc.querySelectorAll('.movie-item, .film-item, .item');
                    movieCards.forEach(function(card, index) {
                        var link = card.querySelector('a');
                        var title = card.querySelector('.title, .name') || link;
                        
                        if (link && link.href) {
                            streams.push({
                                title: title ? title.textContent.trim() : movie.title + ' (Film ' + (index + 1) + ')',
                                url: link.href,
                                quality: 'HD',
                                direct: false,
                                source: 'FilmSoft'
                            });
                        }
                    });

                } catch (e) {
                    console.error('FilmSoft parsing error:', e);
                }

                return streams.slice(0, 3);
            };

            // Парсер для CineZone
            this.parseCineZone = function(html) {
                var streams = [];
                
                try {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');

                    // Поиск элементов с видео
                    var videoElements = doc.querySelectorAll('[data-url], [data-src], .video-item');
                    videoElements.forEach(function(element, index) {
                        var url = element.getAttribute('data-url') || element.getAttribute('data-src') || element.href;
                        var title = element.getAttribute('title') || element.textContent;
                        
                        if (url) {
                            streams.push({
                                title: title && title.trim() ? title.trim() : movie.title + ' (Video ' + (index + 1) + ')',
                                url: url,
                                quality: 'Auto',
                                direct: true,
                                source: 'CineZone'
                            });
                        }
                    });

                } catch (e) {
                    console.error('CineZone parsing error:', e);
                }

                return streams.slice(0, 3);
            };

            this.appendResults = function() {
                scroll.clear();
                
                if (this.results.length > 0) {
                    this.results.forEach(function(item, index) {
                        // Используем стандартный шаблон для онлайн источников
                        var elem = Lampa.Template.get('online', {
                            title: item.title,
                            url: item.url,
                            description: 'Источник: ' + item.source
                        });
                        
                        if (elem) {
                            // Добавляем бейдж с источником
                            var sourceBadge = $('<div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.8); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; z-index: 10;">' + item.source + '</div>');
                            elem.find('.online__poster').append(sourceBadge);
                            
                            elem.on('hover:enter', function() {
                                console.log('Playing from', item.source, ':', item.url);
                                
                                if (item.direct) {
                                    // Прямой запуск для HLS/m3u8
                                    Lampa.Player.play({
                                        url: item.url,
                                        title: movie.title,
                                        quality: { 
                                            [item.quality]: item.url 
                                        }
                                    });
                                } else {
                                    // Для ссылок открываем в браузере или обрабатываем иначе
                                    Lampa.Noty.show('Открываем: ' + item.source);
                                    setTimeout(function() {
                                        window.open(item.url, '_blank');
                                    }, 1000);
                                }
                            });
                            
                            scroll.append(elem);
                        }
                    });
                } else {
                    var noResults = $('<div class="selector" style="padding: 40px 20px; text-align: center; color: #999;">' +
                        '<div>🚫 Нет доступных потоков</div>' +
                        '<div style="font-size: 12px; margin-top: 10px;">Попробуйте сменить источник кнопкой выше</div>' +
                        '</div>');
                    scroll.append(noResults);
                }
            }.bind(this);

            this.showError = function(message) {
                scroll.clear();
                var errorElem = $('<div class="selector" style="padding: 40px 20px; text-align: center; color: #ff4444;">' +
                    '<div>❌ ' + message + '</div>' +
                    '<div style="font-size: 12px; margin-top: 10px;">Нажмите кнопку выше для смены источника</div>' +
                    '</div>');
                scroll.append(errorElem);
            }.bind(this);

            this.destroy = function() {
                console.log('SerPlay destroyed');
                if (scroll && typeof scroll.destroy === 'function') {
                    scroll.destroy();
                }
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
                    var watchBtn = $('<div class="full-start__button selector view--online serplay-button" style="background: linear-gradient(45deg, #FF6B35, #FF8E53); margin: 5px; border-radius: 8px;">' +
                        '<div style="display: flex; align-items: center; justify-content: center; padding: 12px 20px;">' +
                        '<span style="margin-right: 8px;">🎬</span>' +
                        '<span style="font-weight: bold;">Смотреть</span>' +
                        '</div>' +
                        '</div>');
                    
                    watchBtn.on('hover:enter', function() {
                        if (!e.data || !e.data.movie) {
                            Lampa.Noty.show('Ошибка: данные фильма не загружены');
                            return;
                        }
                        
                        Lampa.Activity.push({
                            url: '',
                            title: 'SerPlay - ' + (e.data.movie.title || 'Фильм'),
                            component: 'serplay_balancer',
                            movie: e.data.movie,
                            page: 1
                        });
                    });
                    
                    // Добавляем кнопку в блок с другими кнопками
                    var buttonsContainer = activityRender.find('.full-start__buttons');
                    if (buttonsContainer.length) {
                        // Добавляем перед другими кнопками для заметности
                        buttonsContainer.prepend(watchBtn);
                    }
                    
                    console.log('SerPlay "Смотреть" button added successfully');
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
