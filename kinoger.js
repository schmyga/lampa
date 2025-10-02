(function () {
    'use strict';

    var plugin = {
        id: 'kinoger_hls_plugin_v5',
        type: 'video',
        name: 'Kinoger HLS Test v5',
        version: '5.0.0'
    };

    if (typeof Lampa !== 'undefined') {
        Lampa.Plugin.register(plugin);
        console.log('Kinoger plugin v5 registered');

        plugin.catalog = function (add, params, call) {
            console.log('Catalog function called');
            var items = [{
                title: 'Тестовый фильм',
                year: '2024',
                poster: 'https://via.placeholder.com/200x300?text=Test',
                url: 'https://example.com',
                type: 'movie'
            }];
            add(items);
            call(null, items);
        };

        plugin.stream = function (element, call) {
            console.log('Stream function called for:', element.url);
            call(null, { sources: [{ url: 'https://example.com/video.mp4', quality: 'Auto', direct: true }] });
        };

        if (typeof Lampa.Menu !== 'undefined') {
            Lampa.Menu.add('kinoger_hls_v5', { title: plugin.name, url: 'plugin/' + plugin.id, type: 'catalog' });
            console.log('Menu item added');
        }
    }
})();
