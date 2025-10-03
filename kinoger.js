(function() {
    'use strict';

    function startPlugin(name, title) {
        Lampa.Component.add(name, {
            template: `<div class="kinoger"><div class="kinoger__title">${title}</div></div>`,
            create: function() {
                this.activity.loader(false)
                this.activity.toggle()
            },
            start: function() {
                Lampa.Controller.add(name, {
                    toggle: function() {
                        Lampa.Controller.collectionSet($('.kinoger'))
                        Lampa.Controller.collectionFocus($('.kinoger')[0], $('.kinoger'))
                    },
                    back: function() {
                        Lampa.Activity.backward()
                    }
                })
                Lampa.Controller.toggle(name)
            }
        })

        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') {
                var button = $(`<li class="menu__item selector" data-action="${name}">
                    <div class="menu__ico">
                        <svg width="24" height="24" fill="none" stroke="white" stroke-width="2"><path d="M4 4h16v16H4z"/></svg>
                    </div>
                    <div class="menu__text">${title}</div>
                </li>`)

                button.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: '',
                        title: title,
                        component: name,
                        page: 1
                    })
                })

                $('.menu .menu__list').eq(0).append(button)
            }
        })
    }

    // Создаём два тестовых балансера
    startPlugin('kinoger_v1', 'Kinoger V1')
    startPlugin('kinoger_v2', 'Kinoger V2')
})();
