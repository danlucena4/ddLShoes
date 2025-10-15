$(document).ready(function() {
    // Menu hambúrguer
    $('#hamburger').on('click', function() {
        $('#mobileMenu').toggleClass('hidden');
    });

    // Carrossel
    const $carouselInner = $('.carousel-inner');
    const $images = $('.carousel-inner img');
    let index = 0;

    function updateCarousel() {
        $carouselInner.css('transform', `translateX(-${index * 100}%)`);
    }

    $('#nextBtn').on('click', function() {
        index++;
        if (index >= $images.length) {
            index = 0;
        }
        updateCarousel();
    });

    $('#prevBtn').on('click', function() {
        index--;
        if (index < 0) {
            index = $images.length - 1;
        }
        updateCarousel();
    });

    // Carrossel de marcas com auto-scroll
    const $carouselMarcas = $('#carouselMarcas');
    let isScrolling = false;
    let offset = 0;
    const step = 2; // Velocidade do carrossel

    function autoScroll() {
        if (!isScrolling) {
            offset -= step;
            if (Math.abs(offset) >= $carouselMarcas.width() / 2) {
                offset = 0;
            }
            $carouselMarcas.css('transform', `translateX(${offset}px)`);
        }
        requestAnimationFrame(autoScroll);
    }

    // Eventos de hover para pausar/continuar o scroll
    $carouselMarcas.hover(
        function() { isScrolling = true; },  // Mouse enter
        function() { isScrolling = false; }   // Mouse leave
    );

    // Inicia o auto-scroll
    autoScroll();

    // Função para consultar o CEP
    function consultaCEP(cep) {
        // Remove caracteres não numéricos
        cep = cep.replace(/\D/g, '');

        if (cep.length !== 8) {
            alert('CEP inválido');
            return;
        }

        // Faz a requisição para a API ViaCEP
        $.ajax({
            url: `https://viacep.com.br/ws/${cep}/json/`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                if (!data.erro) {
                    // Preenche os campos com os dados retornados
                    $('#cidade').val(data.localidade);
                    $('#bairro').val(data.bairro);
                    
                    // Remove o atributo disabled dos campos
                    $('#cidade, #bairro').prop('disabled', false);
                } else {
                    alert('CEP não encontrado');
                    // Limpa os campos
                    $('#cidade, #bairro').val('');
                }
            },
            error: function() {
                alert('Erro ao consultar o CEP');
                // Limpa os campos
                $('#cidade, #bairro').val('');
            }
        });
    }

    // Evento para consultar CEP quando o campo perder o foco
    $('#cep').on('blur', function() {
        const cep = $(this).val();
        if (cep) {
            consultaCEP(cep);
        }
    });

    // Máscara para o campo CEP
    $('#cep').on('input', function() {
        let value = $(this).val();
        value = value.replace(/\D/g, ''); // Remove não dígitos
        value = value.replace(/^(\d{5})(\d)/, '$1-$2'); // Coloca hífen após 5 dígitos
        $(this).val(value);
    });

    // Máscara para o campo CPF
    $('input[placeholder="CPF"]').on('input', function() {
        let value = $(this).val();
        value = value.replace(/\D/g, ''); // Remove não dígitos
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        $(this).val(value);
    });

    // Máscara para o campo Telefone
    $('input[type="tel"]').on('input', function() {
        let value = $(this).val();
        value = value.replace(/\D/g, ''); // Remove não dígitos
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
        value = value.replace(/(\d)(\d{4})$/, '$1-$2'); // Coloca hífen entre o quarto e o quinto dígitos
        $(this).val(value);
    });

    // Variáveis globais para os filtros
    const $searchInput = $('input[type="text"]');
    const $priceFilters = $('.price-filter');
    const $filterTags = $('.filter-tag');
    let timeout = null;

    // Função para extrair preço do texto
    function extractPrice(priceText) {
        return parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'));
    }

    // Função para normalizar texto
    function normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
    }

    // Função principal de atualização da grid
    function updateProductGrid() {
        const $productGrid = $('.py-12.bg-gray-50 .grid');
        const $productCards = $productGrid.find('> div');
        
        // Pega valores dos filtros ativos
        const searchText = normalizeText($searchInput.val());
        const activeTag = normalizeText($('.filter-tag.active').text());
        const activePrice = $('.price-filter.active');
        const priceRange = activePrice.length ? {
            min: parseFloat(activePrice.data('min')),
            max: parseFloat(activePrice.data('max'))
        } : null;

        $productCards.each(function() {
            const $card = $(this);
            const productTitle = normalizeText($card.find('h3').text());
            const productCategory = normalizeText($card.find('.text-teal-500').text());
            const productPrice = extractPrice($card.find('.text-lg.font-bold').text());
            
            // Verifica todas as condições
            const matchesSearch = !searchText || 
                productTitle.includes(searchText) || 
                productCategory.includes(searchText);
            
            const matchesTag = !activeTag || 
                productCategory.includes(activeTag);
            
            const matchesPrice = !priceRange || 
                (productPrice >= priceRange.min && productPrice <= priceRange.max);

            // Aplica todos os filtros
            if (matchesSearch && matchesTag && matchesPrice) {
                $card.show();
            } else {
                $card.hide();
            }
        });

        // Verifica se há produtos visíveis
        const visibleProducts = $productGrid.find('> div:visible').length;
        
        // Atualiza mensagem
        $('#no-results-message').remove();
        if (visibleProducts === 0) {
            let mensagem = 'Nenhum produto encontrado';
            if (activeTag) mensagem += ` na categoria selecionada`;
            if (priceRange) mensagem += ` na faixa de preço selecionada`;
            if (searchText) mensagem += ` para "${$searchInput.val()}"`;

            $productGrid.after(`
                <div id="no-results-message" class="text-center py-8 text-gray-500">
                    <i class="bi bi-search text-4xl mb-2 block"></i>
                    <p>${mensagem}</p>
                    <p class="text-sm mt-2">Tente ajustar seus filtros de busca</p>
                </div>
            `);
        }
    }

    // Evento de clique nos filtros de preço
    $priceFilters.on('click', function() {
        const $filter = $(this);
        
        if ($filter.hasClass('active')) {
            $filter.removeClass('active bg-teal-500 text-white').addClass('bg-gray-100 text-gray-700');
        } else {
            $priceFilters.removeClass('active bg-teal-500 text-white').addClass('bg-gray-100 text-gray-700');
            $filter.addClass('active bg-teal-500 text-white').removeClass('bg-gray-100 text-gray-700');
        }
        
        updateProductGrid();
    });

    // Evento de clique nas tags
    $filterTags.on('click', function() {
        const $tag = $(this);
        
        if ($tag.hasClass('active')) {
            $tag.removeClass('active bg-teal-500 text-white').addClass('bg-gray-100 text-gray-700');
        } else {
            $filterTags.removeClass('active bg-teal-500 text-white').addClass('bg-gray-100 text-gray-700');
            $tag.addClass('active bg-teal-500 text-white').removeClass('bg-gray-100 text-gray-700');
        }
        
        updateProductGrid();
    });

    // Evento de busca por texto
    $searchInput.on('input', function() {
        clearTimeout(timeout);
        
        $('.py-12.bg-gray-50 .grid').addClass('searching');
        
        timeout = setTimeout(() => {
            updateProductGrid();
            $('.py-12.bg-gray-50 .grid').removeClass('searching');
        }, 300);
    });

    // Estilos CSS
    const styles = `
    <style>
        .py-12.bg-gray-50 .grid.searching {
            opacity: 0.6;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        #no-results-message {
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .price-filter.active, .filter-tag.active {
            background-color: #14b8a6;
            color: white;
        }
    </style>
    `;
    $('head').append(styles);

    // Código do favorito
    $('.bi-heart').parent().click(function(e) {
        e.preventDefault();
        const $icon = $(this).find('i');
        
        if ($icon.hasClass('bi-heart')) {
            $icon.removeClass('bi-heart').addClass('bi-heart-fill text-teal-500');
            $(this).addClass('bg-white');
        } else {
            $icon.removeClass('bi-heart-fill text-teal-500').addClass('bi-heart');
            $(this).removeClass('bg-white');
        }
    });



});