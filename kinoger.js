(function () {
    'use strict';

    // Проверяем, загружена ли Lampa
    if (typeof Lampa === 'undefined') {
        console.log('❌ Lampa not found');
        return;
    }

    console.log('✅ Kinoger Plugin start');

    // Регистрация плагина
    Lampa.Plugin.create({
        title: 'Kinoger Test v7',
        author: 'schmyga',
        description: 'Тестовый плагин для проверки появления в меню',
        version: '1.0.0',
        type: 'video',

        onStart: function () {
            console.log('🚀 Kinoger plugin started');

            // Добавляем элемент в меню
            Lampa.SettingsApi.addComponent({
                component: 'kinoger',
                name: 'Kinoger Test v7',
                category: 'Plugins',
                onSelect: function () {
                    Lampa.Modal.open({
                        title: 'Kinoger работает!',
                        html: $('<div>Плагин успешно загружен и активен ✅</div>'),
                        size: 'small',
                        onBack: function () {
                            Lampa.Modal.close();
                        }
                    });
                }
            });
        },

        onStop: function () {
            console.log('🛑 Kinoger plugin stopped');
        }
    });
})();
