
(function() {
    'use strict';
    try {
        console.log('Kinoger v9 script started at ' + new Date().toLocaleTimeString());

        if (typeof Lampa === 'undefined') {
            console.error('Lampa API not loaded at ' + new Date().toLocaleTimeString());
            return;
        }

        function component() {
            this.initialize = function() {
                console.log('Kinoger v9 component initialized at ' + new Date().toLocaleTimeString());
                var scroll = new Lampa.Scroll({ mask: true, over: true });
                scroll.body().append('<div>Kinoger Test Menu v9</div>');
                Lampa.Controller.enable('content');
            };
        }

        console.log('Starting Kinoger v9 plugin at ' + new Date().toLocaleTimeString());
        Lampa.Component.add('kinoger_test_v9', component);
        Lampa.Menu.add('kinoger_test_menu_v9', {
            title: 'Kinoger Test Menu v9',
            url: 'plugin/kinoger_test_v9',
            type: 'catalog'
        });
        console.log('Kinoger v9 plugin registered at ' + new Date().toLocaleTimeString());

    } catch (e) {
        console.error('Kinoger v9 error at ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
