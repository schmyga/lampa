(function() {
    'use strict';
    setTimeout(function() {
        try {
            console.log('Kinoger v8 script started at ' + new Date().toLocaleTimeString());

            if (typeof Lampa === 'undefined') {
                console.error('Lampa API not loaded at ' + new Date().toLocaleTimeString());
                return;
            }

            function component() {
                this.initialize = function() {
                    console.log('Kinoger v8 component initialized at ' + new Date().toLocaleTimeString());
                    var scroll = new Lampa.Scroll({ mask: true, over: true });
                    scroll.body().append('<div>Kinoger Test Menu v8</div>');
                    Lampa.Controller.enable('content');
                };
            }

            console.log('Starting Kinoger v8 plugin at ' + new Date().toLocaleTimeString());
            Lampa.Component.add('kinoger_test_v8', component);
            Lampa.Menu.add('kinoger_test_menu_v8', {
                title: 'Kinoger Test Menu v8',
                url: 'plugin/kinoger_test_v8',
                type: 'catalog'
            });
            console.log('Kinoger v8 plugin registered at ' + new Date().toLocaleTimeString());

        } catch (e) {
            console.error('Kinoger v8 error at ' + new Date().toLocaleTimeString() + ':', e);
        }
    }, 1000);
})();
