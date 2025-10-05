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
            var network = new Lampa.Request(); // Исправлено: Reguest -> Request
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var filter = new Lampa.Filter(object);
            var movie = object.movie; // Данные фильма из full-view
            
            // Проверка обязательных данных
            if (!movie || !movie.title) {
                console.error('Movie data is missing:', movie);
                Lampa.Noty.show('Ошибка: данные фильма не найдены');
                return;
            }

            this.start = function() {
                console.log('SerPlay Kinoger start at ' + new Date().toLocaleTimeString());
                
                filter.onSearch = function(value) {
                    Lampa.Activity.replace({ search: value, clarification: true });
                };
                
                filter.onBack = function() {
                    Lampa.Activity.back();
                };
                
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

                network.silent(search_url, function(html) {
                    if (!html) {
                        console.error('Empty response from Kinoger');
                        Lampa.Noty.show('Ошибка при загрузке данных с Kinoger');
                        this.reset();
                        return;
                    }
                    this.extractStream(html);
                    this.append();
                }.bind(this), function(error) {
                    console.error('Search error:', error);
                    Lampa.Noty.show('Ошибка подключения к Kinoger');
                    this.reset();
                }.bind(this));
            }.bind(this);

            this.extractStream = function(html) {
                var video_url = '';
                
                try {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');

                    // Поиск в iframe
                    var iframe = doc.querySelector('iframe[src*=".m3u8"]');
                    if (iframe) {
                        video_url = iframe.src;
                        console.log('Found HLS in iframe:', video_url);
                    }

                    // Поиск в скриптах
                    if (!video_url) {
                        var scripts = doc.querySelectorAll('script');
                        scripts.forEach(function(script) {
                            var content = script.textContent;
                            if (content.includes('.m3u8')) {
                                var match = content.match(/https?:\/\/[^\s'"]+\.m3u8[^\s'"]*/);
                                if (match) {
                                    video_url = match[0];
                                    console.log('Found HLS in script:', video_url);
                                }
                            }
                        });
                    }
                } catch (parseError) {
                    console.error('HTML parsing error:', parseError);
                }

                if (video_url) {
                    this.object.results = [{
                        title: movie.title || 'Неизвестный фильм',
                        url: video_url,
                        quality: 'Auto',
                        direct: true,
                        kinoger_source: true
                    }];
                    console.log('Stream successfully extracted');
                } else {
                    this.object.results = [];
                    Lampa.Noty.show('HLS-поток не найден на Kinoger');
                    console.log('HLS stream not found in HTML');
                }
            }.bind(this);

            this.append = function() {
                scroll.clear();
                
                if (this.object.results && this.object.results.length > 0) {
                    this.object.results.forEach(function(item) {
                        var elem = Lampa.Template.get('online_modal', item);
                        if (elem) {
                            elem.on('hover:enter', function() {
                                Lampa.Player.play({
                                    url: item.url,
                                    title: item.title || movie.title,
                                    quality: { 'Auto': item.url }
                                });
                            });
                            scroll.append(elem);
                        }
                    });
                } else {
                    var noStreamsMsg = $('<div class="selector" style="padding: 20px; text-align: center; color: #999;">Нет доступных потоков на Kinoger</div>');
                    scroll.append(noStreamsMsg);
                }
            }.bind(this);

            this.reset = function() {
                console.log('SerPlay Kinoger reset at ' + new Date().toLocaleTimeString());
                scroll.clear();
                if (filter && typeof filter.reset === 'function') {
                    filter.reset();
                }
            }.bind(this);

            this.destroy = function() {
                console.log('SerPlay Kinoger destroyed at ' + new Date().toLocaleTimeString());
                if (scroll && typeof scroll.destroy === 'function') {
                    scroll.destroy();
                }
                if (filter && typeof filter.destroy === 'function') {
                    filter.destroy();
                }
                Lampa.Controller.toggle('content');
            }.bind(this);

            // Автоматическая инициализация
            this.initialize();
        }

        // Регистрация компонента
        Lampa.Component.add('serplay_kinoger', component);

        // Добавление кнопки "SerPlay" в full-view
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                try {
                    var activityRender = e.object.activity.render();
                    if (!activityRender || !activityRender.length) {
                        console.warn('Activity render not found');
                        return;
                    }

                    // Удаляем только наши кнопки чтобы избежать конфликтов
                    activityRender.find('.serplay--button').remove();

                    var btn = $('<div class="full-start__button selector view--online serplay--button"><span>SerPlay</span></div>');
                    
                    btn.on('hover:enter', function() {
                        if (!e.data || !e.data.movie) {
                            Lampa.Noty.show('Ошибка: данные фильма не загружены');
                            return;
                        }
                        
                        Lampa.Activity.push({
                            url: '',
                            title: 'SerPlay Kinoger - ' + (e.data.movie.title || 'Фильм'),
                            component: 'serplay_kinoger',
                            movie: e.data.movie,
                            page: 1
                        });
                    });
                    
                    // Добавляем кнопку после торрент-кнопок
                    var torrentBtn = activityRender.find('.view--torrent');
                    if (torrentBtn.length) {
                        torrentBtn.after(btn);
                    } else {
                        activityRender.find('.full-start__buttons').append(btn);
                    }
                    
                    console.log('SerPlay button added in full-view at ' + new Date().toLocaleTimeString());
                } catch (btnError) {
                    console.error('Error adding SerPlay button:', btnError);
                }
            }
        });

        console.log('SerPlay Kinoger plugin successfully registered at ' + new Date().toLocaleTimeString());

    } catch (e) {
        console.error('SerPlay Kinoger plugin fatal error at ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
