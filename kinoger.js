(function() {
    'use strict';

    function component() {
        this.initialize = function() {
            console.log('Kinoger test component initialized');
        };
    }

    function startPlugin() {
        window.kinoger_plugin = true;
        Lampa.Component.add('kinoger_test', component);
        Lampa.Menu.add('kinoger_test_menu', {
            title: 'Kinoger Test Menu',
            url: 'plugin/kinoger_test',
            type: 'catalog'
        });
        console.log('Kinoger plugin registered');
    }

    if (!window.kinoger_plugin) startPlugin();
})();
