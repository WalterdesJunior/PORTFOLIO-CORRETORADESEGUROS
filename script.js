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

    initContactForm();

    showPage(location.hash.slice(1));

    // Ao abrir direto em #sobre, #servicos ou #contato o navegador rola até a seção
    // depois do DOMContentLoaded; volta ao topo para o cabeçalho da página aparecer.
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
