$(document).ready(function () {
    // Variables globales
    var cartItems = [];

    // Gestion du clic sur les ancres
    $('a[href^="#"]').on('click', function (event) {
        // Empêcher le comportement par défaut du clic sur l'ancre
        event.preventDefault();

        // Récupérer la cible de l'ancre (l'élément vers lequel nous allons faire défiler)
        var target = $(this.hash);

        // Faire défiler de manière fluide vers la cible
        $('html, body').animate({
            scrollTop: target.offset().top
        }, 800); // 800 millisecondes pour l'animation (ajustez selon vos préférences)
    });

    // Fonction pour mettre à jour l'affichage du panier
    function updateCartDisplay() {
        if (cartItems.length > 0) {
            $("#Cart").show();
        } else {
            $("#Cart").hide();
        }

        var cartItemsHtml = cartItems.map(function (item, index) {
            return `<div>
            <div>
            <img id="itemImg" src="${item.imageSrc}">
            </div>
            <div id="itemInfos">
                <h3>${item.name}</h3>
                <p>Prix: ${item.price}$</p>
                <p>Quantité: ${item.quantity}</p>
            </div>
                <button class="remove-item" data-index="${index}">⨉</button>
            </div>`;
        }).join('');

        $("#cart-items").html(cartItemsHtml);
        $("#cart-total-items").text(`Total des articles : ${cartItems.reduce((total, item) => total + item.quantity, 0)}`); // Affiche la quantité totale des articles
        $("#cart-total-price").text(`Prix total : ${cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}$`);
    }

    // Gestion de la suppression d'un article du panier
    $("#cart-items").on("click", ".remove-item", function () {
        var indexToRemove = $(this).data("index");
        cartItems.splice(indexToRemove, 1); // Retirer l'article du tableau cartItems
        updateCartDisplay(); // Mettre à jour l'affichage du panier après la suppression
    });

    // Fonction pour ajouter un article au panier
    function addToCart(produitId, name, price, imageSrc, quantity) {
        var existingItem = cartItems.find(item => item.produitId === produitId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cartItems.push({ produitId: produitId, name: name, price: price, imageSrc: imageSrc, quantity: quantity });
        }


        // Mettre à jour l'affichage du panier
        updateCartDisplay();
        updateCartButton(); // Mettre à jour l'affichage du bouton du panier après chaque modification du panier
    }

    // Fonction pour récupérer les articles du panier
    function fetchCartItems() {
        $.get('/api/cart', function (data) {
            cartItems = data;
            updateCartDisplay();
            updateCartButton(); // Mettre à jour l'affichage du bouton du panier après chaque modification du panier
        });
    }

    // Fonction pour mettre à jour l'affichage du bouton du panier
    function updateCartButton() {
        if (cartItems.length > 0) {
            $("#Cart").show();
        } else {
            $("#Cart").hide();
        }
    }

    // Back to Top button functionality
    var backToTopBtn = $("#backToTopBtn");

    // Initial check for header state
    checkHeaderState();

    // Show the button when scrolling down 100px from the top of the document
    $(window).scroll(function () {
        checkHeaderState();
        if ($(window).scrollTop() > 100) {
            backToTopBtn.fadeIn();
        } else {
            backToTopBtn.fadeOut();
        }
        // Change Cart button style on scroll
        handleCartStyle();
    });

    function checkHeaderState() {
        var scrollPos = $(this).scrollTop();
        if (scrollPos > 0) {
            $('.site-header').addClass('header-collapsed');
        } else {
            $('.site-header').removeClass('header-collapsed');
        }
    }

    // Click event to scroll to top
    backToTopBtn.click(function () {
        $('html, body').animate({ scrollTop: 0 }, 500);
        return false;
    });

    // Code for scaling items in the shop on scroll
    const shop = document.querySelector('.Shop');
    const items = document.querySelectorAll('.Shop > div');

    function handleScroll() {
        const scrollLeft = shop.scrollLeft;
        const itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight);
        const activeIndex = Math.floor(scrollLeft / itemWidth);

        items.forEach((item, index) => {
            if (index === activeIndex) {
                item.style.transform = 'scale(1)';
            } else {
                item.style.transform = 'scale(0.8)';
            }
        });
    }

    function handleCartStyle() {
        if ($(window).scrollTop() > 0) {
            $("#Cart").css({
                "padding-top": "80px"
            });
        } else {
            $("#Cart").css({
                "padding-top": "40px"
            });
        }
    }

    shop.addEventListener('scroll', handleScroll);

    handleScroll(); // Call initially to set the correct scale for the first item
    handleCartStyle();

    // Popup functionality
    $(".buy-button").on("click", function () {
        // Récupérer l'article parent de ce bouton (qui contient les données pertinentes)
        var produit = $(this).closest('div');
        var produitId = produit.data('id'); // Récupérer l'ID du produit depuis l'attribut data-id
        var imageSrc = produit.find('img').attr('src');
        var name = produit.find('p').first().text();
        var price = parseFloat(produit.find('p').eq(1).text().replace('$', ''));
        var stock = produit.data('stock');

        // Mettre à jour le contenu du popup avec les détails du produit
        $("#product-image").attr('src', imageSrc);
        $("#product-name").text(name);
        $("#product-price").text(price.toFixed(2) + '$');
        $("#stock-status").text(stock > 0 ? '' : 'Indisponible');
        $("#quantity").attr('max', stock);
        $("#quantity").val(1); // Définir la quantité par défaut à 1 lors de l'ouverture de la popup

        // Définir l'image de fond de la popup
        $(".popup-content").css('background-image', `url(${imageSrc}), linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))`);
        // Afficher le popup
        $("#popup").fadeIn();


        // Gestion de la soumission du formulaire
        $("#purchase-form").off("submit").on("submit", function (event) {
            event.preventDefault();
            var quantity = parseInt($("#quantity").val());

            if (quantity <= stock) {
                addToCart(produitId, name, price, imageSrc, quantity);
                $("#popup").fadeOut();
                // Ouvrir une nouvelle fenêtre

            } else {
                alert("Quantité indisponible");
            }
        });
    });

    $(".close").on("click", function () {
        $("#popup").fadeOut();
    });

    $(window).on("click", function (event) {
        if ($(event.target).is("#popup")) {
            $("#popup").fadeOut();
        }
    });

    // Show cart popup
    $("#Cart").on("click", function () {
        $("#cart-popup").fadeIn();
    });

    // Close cart popup
    $(".close-cart").on("click", function () {
        $("#cart-popup").fadeOut();
    });

    $(window).on("click", function (event) {
        if ($(event.target).is("#cart-popup")) {
            $("#cart-popup").fadeOut();
        }
    });

    // Checkout
    $("#checkout-button").on("click", function () {
        $.post('/api/checkout', JSON.stringify(cartItems), function (data) {
            if (data.success) {

                window.open("https://www.paypal.com/signin", "_blank");

                alert('Commande validée !');
                fetchCartItems();
                $("#cart-popup").fadeOut();

            } else {
                alert('Erreur lors de la validation de la commande.');
            }
        });
    });

    // Initial cart items fetch
    fetchCartItems();

    // Mise à jour de l'affichage du bouton du panier au chargement de la page
    updateCartButton();
});
