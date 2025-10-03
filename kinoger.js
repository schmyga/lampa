(function () {
    'use strict';

    function init() {
        console.log('✅ Kinoger plugin initialized');

        Lampa.Menu.add({
            id: 'kinoger_menu',
            title: '🎬 Kinoger',
            icon: '<i class="icon fas fa-film"></i>',
            action: function () {
                console.log('🎬 Открыт Kinoger каталог');

                let items = [
                    {
                        title: 'Тестовый фильм',
                        year: '2025',
                        poster: 'https://via.placeholder.com/300x450?text=Kinoger',
                        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                        type: 'movie'
                    }
                ];

                let component = new Lampa.Component({
                    title: 'Kinoger Каталог',
                    items: items,
                    onSelect: function (item) {
                        Lampa.Player.play({
                            title: item.title,
                            url: item.url,
                            quality: 'Auto',
                            subtitles: []
                        });
                    }
                });

                Lampa.Activity.push(component);
            }
        });

        console.log('✅ Кнопка Kinoger добавлена в меню');
    }

    if (typeof Lampa === 'undefined') {
        console.log('❌ Lampa не найдена');
        return;
    }

    // Добавляем слушатель после загрузки приложения
    Lampa.Listener.follow('app', function (event) {
        if (event.type === 'ready') {
            init();
        }
    });
})();
Lampa.Listener.follow('app', function (e) {
    if (e.type == 'ready') {
        var button = $('<li class="menu__item selector" data-action="kinoger">' +
            '<div class="menu__ico"><svg width="24" height="24" fill="none" stroke="white" stroke-width="2"><path d="M4 4h16v16H4z"/></svg></div>' +
            '<div class="menu__text">KinoGer</div>' +
        '</li>');

        button.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KinoGer',
                component: 'kinoger',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(button);
    }
});

