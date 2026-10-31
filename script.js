document.addEventListener('DOMContentLoaded', function () {
    const pages = Array.from(document.querySelectorAll('.page'));
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');
    const menuButton = document.querySelector('.mobile-menu-button');

    function findPage(id) {
        return pages.find(function (page) { return page.id === id; });
    }

    function showPage(id) {
        const target = findPage(id) || findPage('home');
        pages.forEach(function (page) {
            page.classList.toggle('is-active', page === target);
        });
        document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (link) {
            link.classList.toggle('is-current', link.hash === '#' + target.id);
        });
        document.body.dataset.page = target.id;
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function setMenu(open) {
        navLinks.classList.toggle('active', open);
        menuButton.classList.toggle('is-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    }

    // Leva ao destino do link: uma página (#sobre) ou uma seção dentro dela (#seguros, na home)
    function goTo(id, smooth) {
        if (findPage(id)) {
            showPage(id);
            return true;
        }
        const section = id && document.getElementById(id);
        const host = section && section.closest('.page');
        if (!host) return false;
        showPage(host.id);
        section.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
        return true;
    }

    document.addEventListener('click', function (e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const id = link.hash.slice(1);
        if (!findPage(id) && !document.getElementById(id)) return;

        e.preventDefault();
        if (location.hash !== link.hash) {
            history.pushState(null, '', link.hash);
        }
        goTo(id, true);
        setMenu(false);
    });

    window.addEventListener('popstate', function () {
        if (!goTo(location.hash.slice(1))) showPage('home');
    });

    menuButton.addEventListener('click', function () {
        setMenu(!navLinks.classList.contains('active'));
    });

    window.addEventListener('scroll', function () {
        navbar.classList.toggle('is-scrolled', window.scrollY > 10);
    }, { passive: true });

    initContactForm();
    initLightbox();
    initFaq();

    if (!goTo(location.hash.slice(1))) showPage('home');

    // Ao abrir direto em #sobre ou #contato o navegador rola até a seção depois do
    // DOMContentLoaded; volta ao topo para o cabeçalho da página aparecer.
    window.addEventListener('load', function () {
        if (findPage(location.hash.slice(1))) {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    });
});

// Formulário de contato: ao enviar, abre o WhatsApp com a mensagem já pronta
// (o visitante só confirma o envio por lá) e, em paralelo, manda uma cópia
// por e-mail como registro. Se o e-mail falhar, o WhatsApp já foi aberto mesmo assim.
function initContactForm() {
    var WHATSAPP_NUMBER = '5586999246543';
    var form = document.getElementById('formulario-contato');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var nome = form.nome.value.trim();
        var contato = form.Contato.value.trim();
        var assunto = form.assunto.value.trim();
        var mensagem = form.mensagem.value.trim();

        var texto =
            'Olá! Vim pelo site da DM Corretora.\n\n' +
            '*Nome:* ' + nome + '\n' +
            '*Contato:* ' + contato + '\n' +
            '*Assunto:* ' + assunto + '\n' +
            '*Mensagem:* ' + mensagem;

        var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(texto);

        // Precisa ser chamado de forma síncrona aqui dentro do clique, senão o
        // navegador trata como pop-up indesejado e bloqueia a abertura.
        window.open(waUrl, '_blank', 'noopener');

        // Cópia por e-mail em segundo plano (best-effort: não atrasa nem bloqueia o WhatsApp).
        fetch('https://formsubmit.co/ajax/dmcorretoradeseg@gmail.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                nome: nome,
                Contato: contato,
                assunto: assunto,
                mensagem: mensagem,
                _subject: 'Novo contato pelo site - DM Corretora'
            })
        }).catch(function () {
            // Sem problema se falhar: o WhatsApp já foi aberto com a mensagem.
        });

        var status = document.getElementById('formulario-status');
        if (status) status.hidden = false;
        form.reset();
    });
}

// Fotos da equipe: abre ampliada num <dialog>. Sem suporte a <dialog>, o link abre a imagem direto.
function initLightbox() {
    var dialog = document.getElementById('lightbox');
    var photos = Array.prototype.slice.call(document.querySelectorAll('.team-photo'));
    if (!dialog || typeof dialog.showModal !== 'function' || !photos.length) return;

    var img = dialog.querySelector('.lightbox__img');
    var caption = dialog.querySelector('.lightbox__caption');
    var current = 0;
    var touchX = null;

    function show(i) {
        current = (i + photos.length) % photos.length;
        var link = photos[current];
        var alt = link.querySelector('img').alt;
        img.src = link.getAttribute('href');
        img.alt = alt;
        caption.textContent = link.getAttribute('data-caption') || alt;
        img.style.animation = 'none';
        void img.offsetWidth;
        img.style.animation = '';
    }

    photos.forEach(function (link, i) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            show(i);
            dialog.showModal();
        });
    });

    dialog.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-lb]');
        if (btn) {
            var action = btn.getAttribute('data-lb');
            if (action === 'close') dialog.close();
            else show(current + (action === 'next' ? 1 : -1));
        } else if (e.target === dialog || e.target.classList.contains('lightbox__figure')) {
            dialog.close();
        }
    });

    dialog.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') show(current + 1);
        if (e.key === 'ArrowLeft') show(current - 1);
    });

    dialog.addEventListener('touchstart', function (e) {
        touchX = e.touches[0].clientX;
    }, { passive: true });

    dialog.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    });
}

// Dúvidas: filtro por categoria + busca por texto (sem acento, tolerante a plural/conjugação)
function initFaq() {
    var list = document.getElementById('faq-list');
    var form = document.getElementById('faq-search');
    if (!list || !form) return;

    var input = document.getElementById('faq-query');
    var empty = document.getElementById('faq-empty');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.faq-chip'));
    var items = Array.prototype.slice.call(list.querySelectorAll('.faq-item'));
    var STOP = ['de', 'da', 'do', 'das', 'dos', 'em', 'um', 'uma', 'uns', 'umas', 'para', 'pra', 'por', 'com',
        'como', 'que', 'qual', 'quais', 'meu', 'minha', 'seu', 'sua', 'no', 'na', 'nos', 'nas', 'se', 'eu',
        'voce', 'voces', 'posso', 'ao', 'aos', 'ou', 'e', 'o', 'a', 'os', 'as', 'me', 'te', 'tem',
        'fazer', 'faco', 'faz', 'ter', 'ser', 'sobre', 'quero', 'gostaria'];
    var category = 'todas';

    if (window.matchMedia('(max-width: 600px)').matches) {
        input.placeholder = 'Digite sua dúvida...';
    }

    function normalize(text) {
        return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }

    items.forEach(function (item) {
        item.dataset.text = normalize(item.textContent);
        item.dataset.question = normalize(item.querySelector('summary').textContent);
    });

    function countHits(text, words) {
        return words.filter(function (w) { return text.indexOf(w) !== -1; }).length;
    }

    function terms() {
        return normalize(input.value).split(/[^a-z0-9]+/).filter(function (w) {
            return w.length > 1 && STOP.indexOf(w) === -1;
        }).map(function (w) {
            return w.length >= 5 ? w.slice(0, 4) : w;
        });
    }

    // Se alguma dúvida tem todos os termos, mostra só essas; senão, as que têm pelo menos metade.
    function apply() {
        var words = terms();
        var pool = items.filter(function (item) {
            return category === 'todas' || item.dataset.cat === category;
        });
        var best = Math.max.apply(null, pool.map(function (item) {
            return countHits(item.dataset.text, words);
        }).concat(0));
        var needed = best === words.length ? words.length : Math.ceil(words.length / 2);
        var visible = [];
        items.forEach(function (item) {
            var show = pool.indexOf(item) !== -1 && countHits(item.dataset.text, words) >= needed;
            item.hidden = !show;
            if (show) visible.push(item);
        });
        empty.hidden = visible.length > 0;
        visible.sort(function (a, b) {
            return countHits(b.dataset.question, words) - countHits(a.dataset.question, words);
        });
        return visible;
    }

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            category = chip.getAttribute('data-filter');
            chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
            apply();
        });
    });

    input.addEventListener('input', apply);

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var visible = apply();
        if (visible.length && input.value.trim()) {
            visible[0].open = true;
            visible[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}
