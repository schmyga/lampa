(function() {
    'use strict';

    function waitForLampa() {
        if (typeof Lampa === 'undefined' || !Lampa.Plugin || !Lampa.Menu) {
            console.log('[Kinoger] Lampa not ready, waiting...');
            setTimeout(waitForLampa, 1000);
            return;
        }

        console.log('[Kinoger] Lampa ready, initializing plugin');

        var plugin = {
            id: 'kinoger_test_v7',
            name: 'Kinoger Test v7',
            type: 'video',
            version: '7.0.0'
        };

        // Регистрация плагина
        try {
            Lampa.Plugin.register(plugin);
            console.log('[Kinoger] Plugin registered:', plugin.id);
        } catch (e) {
            console.error('[Kinoger] register error', e);
            return;
        }

        // Реализация каталога
        plugin.catalog = function(add, params, call) {
            console.log('[Kinoger] Catalog called');
            var items = [{
                title: 'Тестовое видео HLS',
                year: '2025',
                poster: 'https://via.placeholder.com/200x300?text=Kinoger',
                url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                type: 'movie'
            }];
            add(items);
            call(null, items);
        };

        // Реализация потока
        plugin.stream = function(element, call) {
            console.log('[Kinoger] Stream called for:', element.url);
            call(null, {
                sources: [
                    {
                        url: element.url,
                        quality: 'Auto',
                        direct: false
                    }
                ]
            });
        };

        // Добавление в меню
        setTimeout(function() {
            try {
                Lampa.Menu.add(plugin.id, {
                    title: plugin.name,
                    subtitle: 'Тестовый каталог HLS',
                    icon: 'play-circle',
                    url: 'plugin/' + plugin.id,
                    type: 'plugin'
                });
                console.log('[Kinoger] Menu item added');
            } catch (e) {
                console.error('[Kinoger] Menu.add error', e);
            }
        }, 2000);
    }

    waitForLampa();
})();
