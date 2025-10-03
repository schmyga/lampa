(function () {
    'use strict';

    if (typeof Lampa === 'undefined') {
        console.log('❌ Lampa не найдена');
        return;
    }

    console.log('✅ Kinoger Plugin загружен');

    // Создаём плагин
    Lampa.Plugin.create({
        title: 'Kinoger',
        author: 'schmyga',
        description: 'Тестовый плагин с кнопкой в меню',
        version: '1.1.0',

        onStart: function () {
            console.log('🚀 Kinoger плагин запущен');

            // Добавляем пункт в главное меню (категория "Каталоги")
            Lampa.Menu.add({
                id: 'kinoger_menu',
                title: '🎬 Kinoger',
                action: function () {
                    // При клике открываем простую страницу с тестовым фильмом
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
    });
})();
