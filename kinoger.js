(function() {
    'use strict';
    console.log('Kinoger test script started at ' + new Date().toLocaleTimeString());

    try {
        function component() {
            this.initialize = function() {
                console.log('Kinoger test component initialized at ' + new Date().toLocaleTimeString());
                var scroll = new Lampa.Scroll({ mask: true, over: true });
                scroll.body().append('<div>Test Kinoger Menu</div>');
                Lampa.Controller.enable('content');
            };
        }

        function startPlugin() {
            console.log('Starting Kinoger test plugin at ' + new Date().toLocaleTimeString());
            window.kinoger_plugin = true;
            if (typeof Lampa !== 'undefined' && Lampa.Component && Lampa.Menu) {
                Lampa.Component.add('kinoger_test_v4', component);
                Lampa.Menu.add('kinoger_test_menu_v4', {
                    title: 'Kinoger Test Menu v4',
                    url: 'plugin/kinoger_test_v4',
                    type: 'catalog'
                });
                console.log('Kinoger test plugin registered at ' + new Date().toLocaleTimeString());
            } else {
                console.error('Lampa API not available at ' + new Date().toLocaleTimeString());
            }
        }

        if (!window.kinoger_plugin) startPlugin();

        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--online"><span>Kinoger Test</span></div>');
                btn.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Kinoger Test',
                        component: 'kinoger_test_v4',
                        page: 1
                    });
                });
                e.object.activity.render().find('.view--torrent').before(btn);
                console.log('Kinoger test button added at ' + new Date().toLocaleTimeString());
            }
        });
    } catch (e) {
        console.error('Kinoger test error at ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
