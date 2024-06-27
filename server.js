const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
//app.use(cors());
app.use(express.json());

// Disable CSP temporarily (not for production use)
/*
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://code.jquery.com");
    next();
});
*/

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite database
const db = new sqlite3.Database('database/IE_shop.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Define routes for products
app.get('/api/produits', (req, res) => {
    db.all('SELECT * FROM produits', [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

app.post('/api/produits', (req, res) => {
    const { name, price, stock, imageSrc, description } = req.body;
    const insertQuery = `
        INSERT INTO produits (name, price, stock, imageSrc, description) 
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(insertQuery, [name, price, stock, imageSrc, description], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, name, price, stock, imageSrc, description }
        });
    });
});

// Define routes for cart
let cartItems = [];

app.get('/api/cart', (req, res) => {
    res.json(cartItems);
});

app.post('/api/cart', (req, res) => {
    const { produitId, quantity } = req.body;

    // Vérifier si le produit existe en base de données
    const selectQuery = `
        SELECT id, name, price, stock 
        FROM produits 
        WHERE id = ?
    `;
    db.get(selectQuery, [produitId], (err, produit) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        if (produit) {
            // Vérifier si la quantité demandée est disponible
            if (quantity <= produit.stock) {
                const item = {
                    produitId: produit.id,
                    name: produit.name,
                    price: produit.price,
                    quantity: quantity
                };
                cartItems.push(item); // Ajouter l'article au panier

                res.json({ success: true });
            } else {
                res.status(400).json({ error: "Quantité insuffisante en stock" });
            }
        } else {
            res.status(404).json({ error: "Produit non trouvé" });
        }
    });
});

// Route to handle checkout
app.post('/api/checkout', (req, res) => {
    // Récupérer les articles du panier
    const itemsInCart = cartItems;

    // Mettre à jour le stock pour chaque article dans le panier
    itemsInCart.forEach(item => {
        const updateQuery = `
            UPDATE produits 
            SET stock = stock - ?
            WHERE id = ?
        `;
        db.run(updateQuery, [item.quantity, item.produitId], function (err) {
            if (err) {
                console.error('Erreur lors de la mise à jour du stock:', err);
                res.status(500).json({ error: 'Erreur lors de la mise à jour du stock' });
                return;
            }
        });
    });

    // Vider le panier après la validation de la commande
    cartItems = [];

    // Répondre au client avec succès
    res.json({ success: true });
});

// Serve the index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
