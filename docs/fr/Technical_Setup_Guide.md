# Guide de Configuration Technique : Installation de la plateforme "Know"

Ce guide explique comment déployer l'application "Know" (qui fonctionne comme une application Full-Stack Next.js contenant à la fois le frontend et le backend) sur un serveur local, tel qu'un **Serveur Windows** ou un **NAS QNAP**.

## 1. Prérequis
- **Node.js** : v18.17 ou supérieure (v20 recommandée).
- **PostgreSQL** : v14 ou supérieure.
- **Git** : Pour récupérer les dépôts de déploiement (optionnel mais recommandé).

---

## 2. "Que devons-nous faire au niveau du front-end ?"
Étant donné que la plateforme est construite sur Next.js, **le frontend et le backend sont déployés ensemble comme une seule unité**. Vous n'avez pas besoin d'héberger un dépôt frontend séparé ou de configurer un serveur web spécifique au frontend (comme Apache/Nginx) juste pour servir des fichiers statiques.

Lors du processus d'installation, la commande `npm run build` va automatiquement :
1. Compiler le code frontend React.
2. Optimiser toutes les images, polices et le CSS (y compris le Thème Vintage).
3. Regrouper les routes API du backend.

Par conséquent, le "Déploiement Frontend" se résume simplement à l'étape de "Build" de cette installation unique.

---

## 3. Étapes d'Installation (Universelles)

### Étape 1 : Configuration de la Base de Données
1. Installez PostgreSQL sur votre serveur (ou utilisez l'App Center de QNAP pour installer PostgreSQL conteneurisé).
2. Créez une nouvelle base de données vide nommée `know_db`.
3. Créez un utilisateur de base de données avec un mot de passe sécurisé et accordez-lui tous les privilèges sur `know_db`.

### Étape 2 : Configuration du Code et de l'Environnement
1. Copiez le code source sur votre serveur (ex: `C:\deployments\know-app` sur Windows).
2. Créez un fichier `.env` à la racine du dossier avec les variables suivantes :

```env
# Connexion à la base de données (Remplacez par vos identifiants réels)
DATABASE_URL="postgresql://UTILISATEUR:MOTDEPASSE@localhost:5432/know_db?schema=public"

# Configuration NextAuth
NEXTAUTH_URL="http://IP_DE_VOTRE_SERVEUR:3000"
NEXTAUTH_SECRET="generez-une-chaine-aleatoire-de-32-caracteres-ici"
```

### Étape 3 : Build et Migration
Ouvrez un terminal (Invite de commandes/PowerShell en tant qu'Administrateur) dans le répertoire de l'application :

```bash
# 1. Installer les dépendances
npm install

# 2. Pousser le schéma de la base de données
npx prisma db push

# 3. Initialiser les données de départ (Crée le premier Super Administrateur)
npm run seed

# 4. Construire (Build) le Frontend et le Backend
npm run build
```

---

## 4. Configurations d'Hébergement

### Option A : Serveur Windows (Recommandé : PM2)
Pour que l'application s'exécute en continu en arrière-plan sur Windows :

1. Installez PM2 globalement : `npm install -g pm2`
2. Installez le service PM2 pour Windows : `npm install -g @innocenzi/pm2-windows-service`
3. Démarrez l'application :
   ```bash
   pm2 start npm --name "know-app" -- start
   ```
4. Sauvegardez la liste PM2 pour qu'elle redémarre au redémarrage du système :
   ```bash
   pm2 save
   ```
*(Optionnel : Utilisez IIS comme proxy inverse pour acheminer le trafic sur le port 80/443 vers localhost:3000).*

### Option B : NAS QNAP
Les QNAP sont d'excellents hôtes nécessitant peu de maintenance. Vous pouvez le déployer en utilisant **Container Station** de QNAP (Docker).

1. Assurez-vous que l'application **Container Station** est installée sur le QNAP.
2. À la racine du projet, assurez-vous de disposer d'un `Dockerfile` standard pour Next.js.
3. Connectez-vous via SSH au QNAP ou utilisez l'interface de Container Station pour construire et exécuter l'image Docker :
   ```bash
   docker build -t know-app .
   docker run -d -p 3000:3000 --name know-service --env-file .env know-app
   ```

## 5. Première Connexion
Une fois l'application en cours d'exécution, naviguez vers `http://IP_DE_VOTRE_SERVEUR:3000`.
- Connectez-vous avec les identifiants administrateur par défaut (définis dans votre fichier `prisma/seed.ts`).
- Naviguez immédiatement vers les Paramètres Utilisateur/Rôles pour créer vos comptes de responsables et de techniciens réels.
