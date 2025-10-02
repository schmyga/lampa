(function() {
    'use strict';
    console.log('Kinoger script gestartet um ' + new Date().toLocaleTimeString());

    try {
        function component() {
            this.initialize = function() {
                console.log('Kinoger-Komponente initialisiert um ' + new Date().toLocaleTimeString());
            };
        }

        function startPlugin() {
            console.log('Kinoger-Plugin wird gestartet um ' + new Date().toLocaleTimeString());
            window.kinoger_plugin = true;
            if (typeof Lampa !== 'undefined' && Lampa.Component && Lampa.Menu) {
                Lampa.Component.add('kinoger_test_v3', component);
                Lampa.Menu.add('kinoger_test_menu_v3', {
                    title: 'Kinoger Test Menu v3',
                    url: 'plugin/kinoger_test_v3',
                    type: 'catalog'
                });
                console.log('Kinoger-Plugin erfolgreich registriert um ' + new Date().toLocaleTimeString());
            } else {
                console.error('Lampa-API nicht verfügbar um ' + new Date().toLocaleTimeString());
            }
        }

        if (!window.kinoger_plugin) startPlugin();
    } catch (e) {
        console.error('Kinoger-Plugin-Fehler um ' + new Date().toLocaleTimeString() + ':', e);
    }
})();
