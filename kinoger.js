(function() {
    'use strict';
    try {
        console.log('Kinoger v7 script started at ' + new Date().toLocaleTimeString());

        // Проверка наличия Lampa перед выполнением
        if (typeof Lampa === 'undefined') {
            console.error('Lampa API not loaded at ' + new Date().toLocaleTimeString());
            return;
        }

        function component() {
            this.initialize = function() {
                console.log('Kinoger v7 component initialized at ' + new Date().toLocaleTimeString());
                var scroll = new Lampa.Scroll({ mask: true, over: true });
                scroll.body().append('<div>Kinoger Test Menu v7</div>');
                Lampa.Controller.enable('content');
            };
        }

        function startPlugin() {
            console.log('Starting Kinoger v7 plugin at ' + new Date().toLocaleTimeString());
            Lampa.Component.add('kinoger_test_v7', component);
            Lampa.Menu.add('kinoger_test_menu_v7', {
                title: 'Kinoger Test Menu v7',
                url: 'plugin/kinoger_test_v7',
                type: 'catalog'
            });
            console.log('Kinoger v7 plugin registered at ' + new Date().toLocaleTimeString());
        }

        // Убираем window.kinoger_plugin для теста
        startPlugin();
    } catch (e) {
        console.error('Kinoger v7 error at ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
