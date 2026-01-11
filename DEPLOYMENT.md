# AirBox Remote Control - Guide de déploiement GitHub Pages

## 🚀 Déploiement automatique avec GitHub Actions

### Étape 1: Créez un repository GitHub

1. Allez sur [github.com/new](https://github.com/new)
2. Créez un nouveau repository public nommé `airbox-remote-control`
3. NE cochez pas "Initialize this repository with a README" (on a déjà un)

### Étape 2: Configurez votre repository local

```bash
# Dans le dossier web/
git init
git add .
git commit -m "Initial commit: AirBox Remote Control Interface"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/airbox-remote-control.git
git push -u origin main
```

### Étape 3: Activez GitHub Pages

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** → **Pages**
3. Sélectionnez **GitHub Actions** comme source
4. La build va se lancer automatiquement!

### Étape 4: Mise à jour du workflow

Le fichier `.github/workflows/deploy.yml` est déjà configuré. Pour un domaine personnalisé:

```yaml
cname: airbox.yourdomain.com  # Remplacez par votre domaine
```

### Étape 5: Votre site est en ligne!

L'URL sera: `https://VOTRE_USERNAME.github.io/airbox-remote-control/`

---

## 📋 Checklist de déploiement

- [ ] Créer un repository GitHub
- [ ] Configurer l'URL du repository local
- [ ] Faire un git push sur main
- [ ] GitHub Actions build l'application automatiquement
- [ ] Aller sur Settings → Pages
- [ ] Sélectionner GitHub Actions comme source
- [ ] Attendre la confirmation du déploiement
- [ ] Accéder à https://username.github.io/airbox-remote-control/

## 🔄 Déploiements suivants

C'est automatique! À chaque fois que vous faites un `git push` sur `main`:

1. GitHub Actions lance la build
2. L'application est compilée
3. Elle est déployée sur GitHub Pages
4. Vous pouvez voir le statut dans l'onglet **Actions** du repository

## 🚨 Troubleshooting

### Le workflow GitHub Actions échoue

1. Vérifiez que `npm install --legacy-peer-deps` fonctionne localement
2. Vérifiez les logs dans l'onglet **Actions** → cliquez sur le workflow échoué
3. Assurez-vous que tous les fichiers sont commités

### La page affiche "404 Not Found"

1. Attendez quelques minutes après le push (le déploiement prend du temps)
2. Videz le cache de votre navigateur (Ctrl+Shift+Del)
3. Vérifiez que vous accédez à la bonne URL

### L'application est vide

- Assurez-vous que la base path est correcte: `/airbox-remote-control/`
- Vérifiez que `vite.config.ts` a la bonne base path

## 💡 Améliorations futures

- [ ] Ajouter un domaine personnalisé
- [ ] Configurer des secrets GitHub pour l'API
- [ ] Ajouter des tests automatisés
- [ ] Configurer la vérification du linting

## 📚 Ressources

- [GitHub Pages Documentation](https://pages.github.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

**C'est fait!** Votre AirBox Remote Control est maintenant en ligne! 🎉
