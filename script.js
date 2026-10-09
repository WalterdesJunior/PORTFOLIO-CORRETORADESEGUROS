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

    // Qualquer link interno (#home, #sobre, #servicos, #contato) troca de página
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const page = findPage(link.hash.slice(1));
        if (!page) return;

        e.preventDefault();
        if (location.hash !== link.hash) {
            history.pushState(null, '', link.hash);
        }
        showPage(page.id);
        setMenu(false);
    });

    window.addEventListener('popstate', function () {
        showPage(location.hash.slice(1));
    });

    menuButton.addEventListener('click', function () {
        setMenu(!navLinks.classList.contains('active'));
    });

    window.addEventListener('scroll', function () {
        navbar.classList.toggle('is-scrolled', window.scrollY > 10);
    }, { passive: true });

    showPage(location.hash.slice(1));

    // Ao abrir direto em #sobre, #servicos ou #contato o navegador rola até a seção
    // depois do DOMContentLoaded; volta ao topo para o cabeçalho da página aparecer.
    window.addEventListener('load', function () {
        if (findPage(location.hash.slice(1))) {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    });
});
