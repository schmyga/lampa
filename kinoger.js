(function () {
    'use strict';

    // Ждём появления Lampa
    function waitForLampa() {
        if (typeof Lampa === 'undefined' || !Lampa.Component || !Lampa.Listener) {
            console.log('[Kinoger] waiting Lampa...');
            return setTimeout(waitForLampa, 500);
        }
        init();
    }

    function init() {
        try {
            console.log('[Kinoger] init');

            // Конфигурация балансеров (тестовые URL)
            var BALANCERS = [
                { id: 'v1', title: 'Kinoger V1', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
                { id: 'v2', title: 'Kinoger V2', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
            ];

            // Тестовый фильм (можешь подставить свой)
            var FILM = {
                title: 'Тестовый фильм',
                year: '2025',
                poster: 'https://via.placeholder.com/300x450?text=Test+Movie'
            };

            // Компонент — конструктор
            function KinogerComponent() {
                var self = this;
                var root = $('<div class="kinoger-root"></div>');
                var header = $('<div class="kinoger-header"><ul class="kinoger-balancers"></ul></div>');
                var body = $('<div class="kinoger-body"></div>');
                var activeBalancer = 0; // индекс активного балансера

                // Создаём header — список балансеров
                function buildHeader() {
                    var ul = header.find('.kinoger-balancers');
                    ul.empty();

                    BALANCERS.forEach(function (b, i) {
                        var li = $('<li class="selector kinoger-balancer" data-index="' + i + '">' +
                            '<div class="kinoger-balancer__text">' + b.title + '</div>' +
                            '</li>');

                        // при фокусе/выделении — просто подчёркиваем
                        li.on('hover:focus', function () {
                            setActive(i, false);
                        });

                        // при нажатии — переключаемся на балансер
                        li.on('hover:enter', function () {
                            setActive(i, true);
                        });

                        ul.append(li);
                    });
                }

                // Создаём body — карточка фильма
                function buildBody() {
                    body.empty();

                    var card = $(
                        '<div class="kinoger-film selector">' +
                            '<div class="kinoger-film__imgbox"><img class="kinoger-film__img" src="' + FILM.poster + '"/></div>' +
                            '<div class="kinoger-film__title">' + FILM.title + '</div>' +
                        '</div>'
                    );

                    // при нажатии на фильм — воспроизводим текущий балансер
                    card.on('hover:enter', function () {
                        var src = BALANCERS[activeBalancer].url;
                        console.log('[Kinoger] play', src);
                        Lampa.Player.play({
                            title: FILM.title + ' — ' + BALANCERS[activeBalancer].title,
                            url: src,
                            quality: 'Auto',
                            subtitles: []
                        });
                    });

                    body.append(card);
                }

                function setActive(index, byUser) {
                    if (index < 0) index = 0;
                    if (index >= BALANCERS.length) index = BALANCERS.length - 1;
                    activeBalancer = index;

                    header.find('.kinoger-balancer').removeClass('focus');
                    header.find('.kinoger-balancer[data-index="' + index + '"]').addClass('focus');

                    // Показываем уведомление при ручной смене
                    if (byUser) {
                        Lampa.Noty.show('Источник выбран: ' + BALANCERS[index].title);
                    }
                }

                // lifecycle
                this.create = function () {
                    root.append(header);
                    root.append(body);

                    buildHeader();
                    buildBody();
                    setActive(0, false);

                    // loader off and show
                    this.activity.loader(false);
                    this.activity.toggle();
                };

                this.start = function () {
                    // Управление фокусом в компоненте
                    Lampa.Controller.add('kinoger', {
                        toggle: function () {
                            // коллекция всех селекторов внутри компонента
                            Lampa.Controller.collectionSet(root.find('.selector'));
                            // фокусируем на первом селекторе (балансеры)
                            Lampa.Controller.collectionFocus(root.find('.selector').first(), root);
                        },
                        left: function () {
                            // если фокус в header — двигать влево балансеры
                            var focused = $('.selector.focus')[0];
                            if (focused && $(focused).closest('.kinoger-header').length) {
                                var cur = parseInt($(focused).attr('data-index') || 0, 10);
                                setActive(cur - 1, true);
                            }
                        },
                        right: function () {
                            var focused = $('.selector.focus')[0];
                            if (focused && $(focused).closest('.kinoger-header').length) {
                                var cur = parseInt($(focused).attr('data-index') || 0, 10);
                                setActive(cur + 1, true);
                            }
                        },
                        back: function () {
                            Lampa.Activity.backward();
                        }
                    });

                    Lampa.Controller.toggle('kinoger');
                };

                this.render = function () {
                    return root;
                };

                this.pause = function () {};
                this.stop = function () {};

                this.destroy = function () {
                    root.remove();
                };
            }

            // Регистрируем компонент
            try {
                Lampa.Component.add('kinoger', KinogerComponent);
                console.log('[Kinoger] component registered');
            } catch (e) {
                console.error('[Kinoger] Component.add error:', e);
            }

            // Добавляем кнопку в меню при готовности приложения
            Lampa.Listener.follow('app', function (e) {
                if (e.type !== 'ready') return;

                try {
                    var button = $(
                        '<li class="menu__item selector" data-action="kinoger">' +
                            '<div class="menu__ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h18v18H3z" stroke="white" stroke-width="1.5"/></svg></div>' +
                            '<div class="menu__text">Kinoger</div>' +
                        '</li>'
                    );

                    button.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: '',
                            title: 'Kinoger',
                            component: 'kinoger',
                            page: 1
                        });
                    });

                    // Старайтесь добавлять в первую группу меню
                    var list = $('.menu .menu__list').eq(0);
                    if (list && list.length) {
                        list.append(button);
                        console.log('[Kinoger] menu button appended');
                    } else {
                        // fallback: попробуем найти любую .menu__list
                        var any = $('.menu__list').eq(0);
                        if (any && any.length) {
                            any.append(button);
                            console.log('[Kinoger] menu button appended (fallback)');
                        } else {
                            console.warn('[Kinoger] menu list not found — will retry in 1s');
                            setTimeout(function () {
                                var retry = $('.menu .menu__list').eq(0);
                                if (retry && retry.length) retry.append(button);
                            }, 1000);
                        }
                    }
                } catch (err) {
                    console.error('[Kinoger] add menu error', err);
                }
            });

        } catch (err) {
            console.error('[Kinoger] init fatal:', err);
        }
    }

    waitForLampa();
})();

