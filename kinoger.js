(function() {
    'use strict';

    var plugin = {
        id: 'kinoger_test',
        type: 'video',
        name: 'Kinoger Test',
        version: '1.0.0'
    };

    Lampa.Plugin.register(plugin);

    // Тестовый каталог
    plugin.catalog = function(add, params, call) {
        var items = [];
        items.push({
            title: 'Тестовый фильм Kinoger',
            year: '2025',
            poster: 'https://via.placeholder.com/200x300?text=Test',
            url: 'https://example.com/test',
            type: 'movie'
        });
        add(items);
        call(null, items);
    };

    // Тестовый поток
    plugin.stream = function(element, call) {
        call(null, {
            sources: [{
                url: 'https://example.com/video.mp4',
                quality: '1080p',
                direct: true
            }]
        });
    };

    Lampa.Menu.add('kinoger_test', {
        title: plugin.name,
        url: 'plugin/' + plugin.id,
        type: 'catalog'
    });
})();
