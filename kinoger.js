(function() {
    'use strict';
    try {
        console.log('Test Plugin v1 started at ' + new Date().toLocaleTimeString());

        if (typeof Lampa === 'undefined') {
            console.error('Lampa API not loaded at ' + new Date().toLocaleTimeString());
            return;
        }

        // Слушатель для добавления кнопки на странице фильма
        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector"><span>Test Button</span></div>');
                btn.on('hover:enter', function() {
                    Lampa.Noty.show('Test Button clicked!'); // Простое уведомление
                });
                e.object.activity.render().find('.view--torrent').before(btn);
                console.log('Test Button added at ' + new Date().toLocaleTimeString());
            }
        });

    } catch (e) {
        console.error('Test Plugin v1 error at ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
