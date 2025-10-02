(function() {
    'use strict';
    console.log('Kinoger test started at ' + new Date().toLocaleTimeString());

    try {
        function component() {
            this.initialize = function() {
                console.log('Kinoger component initialized at ' + new Date().toLocaleTimeString());
                var scroll = new Lampa.Scroll({ mask: true, over: true });
                scroll.body().append('<div>Kinoger Test Menu</div>');
                Lampa.Controller.enable('content');
            };
        }

        function startPlugin() {
            console.log('Starting Kinoger plugin at ' + new Date().toLocaleTimeString());
            window.kinoger_plugin = true;
            if (typeof Lampa !== 'undefined' && Lampa.Component && Lampa.Menu) {
                Lampa.Component.add('kinoger_test_v5', component);
                Lampa.Menu.add('kinoger_test_menu_v5', {
                    title: 'Kinoger Test Menu v5',
                    url: 'plugin/kinoger_test_v5',
                    type: 'catalog'
                });
                console.log('Kinoger plugin registered at ' + new Date().toLocaleTimeString());
            } else {
                console.error('Lampa API not available at ' + new Date().toLocaleTimeString());
            }
        }

        if (!window.kinoger_plugin) startPlugin();
    } catch (e) {
        console.error('Kinoger error at ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
