const express = require('express');
const axios = require('axios');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app     = express();
const port    = 8081;
const Sequelize = require('sequelize');
const sequelize = new Sequelize('dbaws', 'admin', '123456789', {
    host: 'database-1.cduujuxwkwor.eu-north-1.rds.amazonaws.com',
    port: '3306',
    dialect: 'mysql' // ou tout autre dialecte de base de données que vous utilisez (par exemple, 'postgres' pour PostgreSQL)
  });

  try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  // Définition du modèle User
const User = sequelize.define('USER', {
    nom: {
        type: Sequelize.STRING,
        allowNull: false
    },
    prenom: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

// Synchronisez le modèle avec la base de données (cette étape peut être effectuée ailleurs dans votre code)
sequelize.sync()
  .then(() => {
    console.log('Modèle synchronisé avec la base de données');
  })
  .catch(error => {
    console.error('Erreur lors de la synchronisation du modèle avec la base de données:', error);
  });
  
  
  // Utilisez une clé secrète pour signer les cookies de session
  app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: false
  }));
  
  // Middleware pour gérer les données POST
  app.use(express.urlencoded({ extended: true }));
  
  // Utilisateurs fictifs (simulant une base de données)
  app.get('/users', (req, res) => {
    User.findAll()
        .then((users) => {
            res.json(users);
        })
        .catch((error) => {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des utilisateurs' });
        })
  });

  // Page d'accueil
  app.get('/', (req, res) => {
    res.send(`  
        <h1>Bienvenue sur la page d\'accueil</h1>
        <button onclick="location.href='/login'">Se connecter</button>
        <button onclick="location.href='/inscription'">S'inscrire</button>
    `);
  });
  
  // Page de connexion
  app.get('/login', (req, res) => {
    res.send(`
      <h1>Connexion</h1>
      <form action="/login" method="POST">
        <input type="text" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Mot de passe" required>
        <button type="submit">Se connecter</button>
    `);
  });

  // Page de connexion
  app.get('/inscription', (req, res) => {
    res.send(`
      <h1>Inscription</h1>
      <form action="/inscription" method="POST">
        <input type="text" name="nom" placeholder="Nom" required>
        <input type="text" name="prenom" placeholder="Prénom" required>
        <input type="text" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Mot de passe" required>
        <button type="submit">S'inscrire</button>
    `);
  });
  
  // Gestion de la connexion
 app.post('/login', async (req, res) => {
    axios.get('http://localhost:8081/users')
        .then(response => {
        const users = response.data;
        // Process the retrieved user data as needed
        const { email, password } = req.body;
    
        // Recherche de l'utilisateur dans la liste des utilisateurs fictifs
        const user = users.find(user => user.email === email);
        
        if (!user) {
        return res.send('Email incorrect.');
        }

        // Vérification du mot de passe
        bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            // Authentification réussie
            req.session.userId = user.id; // Stocke l'ID de l'utilisateur dans la session
            res.redirect('/dashboard');
        } else {
            res.send('Mot de passe incorrect.');
        }
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
  });

  app.post('/inscription', async (req, res) => {
    const { nom, prenom, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    User.create({ nom, prenom, email, password: hashedPassword })
        .then((user) => {
            req.session.userId = user.id; // Stocke l'ID de l'utilisateur dans la session
            res.redirect('/dashboard');
        })
        .catch((error) => {
            res.status(400).json({ error: error.message });
        });
});
  
  // Page de tableau de bord
  app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
  
    res.send('Tableau de bord - Vous êtes connecté !');
  });
  
  // Déconnexion
  app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.log(err);
      }
      res.redirect('/');
    });
  });
  
  // Démarrage du serveur
  app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
  });
  