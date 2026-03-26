# Guide d'Utilisation de la Plateforme

Bienvenue sur la plateforme **Know** — votre système centralisé pour les procédures machines, la documentation technique et le suivi des opérations. Ce guide est divisé par rôles.

---

## 1. Utilisateurs Généraux (Techniciens & Opérateurs)

En tant qu'utilisateur standard, votre objectif principal est de consommer des connaissances de manière sûre et efficace.

### Utilisation des Procédures
1. **Numérisation du Flashcode (QR Code)** : Pointez la caméra de votre appareil mobile (ou utilisez le scanner intégré depuis le tableau de bord de l'application) vers le code QR d'une machine.
2. **Accès Instantané** : Vous contournerez instantanément la navigation et serez dirigé directement vers le profil dédié de cette machine.
3. **Lecture des Procédures** : Les procédures ont des niveaux de risque clairement indiqués. Les encadrés d'avertissement rouges signifient un risque élevé (portez une attention particulière aux conditions préalables et aux outils).
4. **Support Multilingue** : Si un manuel est dans une langue que vous ne comprenez pas, cliquez sur l'icône du globe en haut à droite pour basculer facilement entre l'Arabe, le Français et l'Anglais.

### Signaler une Lacune de Connaissances
Si vous ne trouvez pas une procédure, ou si une procédure est incomplète :
1. Naviguez vers la section **Lacunes de Connaissances** via la barre latérale.
2. Cliquez sur **Soumettre une demande**.
3. Fournissez un titre bref et expliquez ce qui manque exactement.
4. Les responsables examineront cette demande et assigneront un Expert pour rédiger le manuel manquant.

---

## 2. Experts & Réviseurs (Créateurs de Contenu)

Si vous avez l'autorisation de créer ou de réviser du contenu, votre objectif est de numériser le "savoir-faire informel".

### Création d'une Procédure (Brouillon)
1. Naviguez vers **Connaissances** -> **Créer un Nouveau**.
2. Remplissez les métadonnées requises (Machine, Département, Niveau de Risque, Temps Estimé).
3. Utilisez l'éditeur de texte enrichi pour rédiger clairement les étapes.
4. **Enregistrer comme Brouillon** si vous y travaillez encore.
5. Une fois terminé, cliquez sur **Soumettre pour Révision**. L'état passera à `EN RÉVISION` (IN_REVIEW).

### Révision d'une Procédure (Réviseur/Responsable)
1. Vous serez averti lorsqu'un élément est `EN RÉVISION`.
2. Vérifiez l'exactitude technique du contenu.
3. Si c'est valide, cliquez sur **Approuver** et ajoutez un commentaire d'approbation obligatoire. Le document est maintenant en ligne et officiellement versionné.

---

## 3. Responsables de Département & Super Administrateurs

Les administrateurs gèrent les actifs physiques (Machines), la structure organisationnelle (Départements) et les autorisations des utilisateurs.

### Gestion des Machines
1. Allez dans **Machines** -> **Ajouter une Machine**.
2. Définissez le fabricant, le modèle et l'emplacement physique.
3. **Impression des Codes QR** : Une fois enregistré, cliquez sur le bouton **Imprimer QR** sur la page de détail de la machine pour générer l'étiquette physique pour l'atelier.
4. **Duplication** : Si votre usine achète 5 machines à coudre identiques, utilisez le bouton **Dupliquer**. Il copiera le modèle et le fabricant — il vous suffit de fournir le nouveau Numéro de Série.

### Gestion des Utilisateurs
1. Allez dans **Utilisateurs**.
2. Attribuez des rôles en fonction des fonctions réelles du poste :
   - **Réviseur** : Peut approuver les procédures.
   - **Expert** : Peut rédiger des brouillons.
   - **Standard** : Ne peut que lire et scanner.
3. Assurez-vous que les utilisateurs sont placés dans le bon Département (ex: CQ, Coupe, Piquage).

### Fermeture des Lacunes de Connaissances
Lors de l'examen de l'onglet **Lacunes de Connaissances** :
- **Assigner** : Assigner une lacune à un Expert pour qu'il sache que c'est de sa responsabilité.
- **Fermer** : Lors de la fermeture d'une lacune sans créer de document, vous **devez** fournir une Raison de Rejet (ex: "Demande en double") qui sera enregistrée de façon permanente pour la traçabilité.
