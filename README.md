# Pokédex · papier & encre

Les 1 025 Pokémon en français, un duel de cartes contre la machine et une collection qui grandit chaque jour.
Site de fans, sans but commercial.

## Démarrer

```bash
npm install
npm start        # http://localhost:4200
npm test         # tests unitaires (Vitest)
npm run build    # version de production dans dist/
```

Il faut Node.js 22 ou plus récent.

## Ce que contient le site

| Page | Adresse | Rôle |
| --- | --- | --- |
| Accueil | `/` | Scène animée, type du jour, accès aux jeux |
| Pokédex | `/pokedex` | Recherche, filtres par type, région et collection, défilement infini |
| Fiche | `/pokemon/:id` | Description, statistiques, cri, chromatique, signature de mouvement, lignée |
| Bienvenue | `/bienvenue` | Choix du premier Pokémon, par région |
| Arène | `/arene` | Duel Éclair contre la machine (Frappe, Technique, Garde) |
| Campagne | `/campagne` | 9 régions, 8 arènes mono-type et une Ligue par région |
| Mes cartes | `/cartes` | Collection, expérience et évolution des cartes |
| Équipe | `/equipe` | Choix des trois cartes et couverture des 18 types |
| Mon QG | `/qg` | Booster du jour, quêtes, série, Pokémon mystère, Devine le cri, badges |

## D'où viennent les données

Tout vient de [PokéAPI](https://pokeapi.co), projet libre et sans clé.

- `npm run data` lit les fichiers CSV officiels de PokéAPI sur GitHub et fabrique deux fichiers statiques :
  `public/data/pokedex.json` (l'index des 1 025 Pokémon) et `public/data/details.json` (descriptions et talents).
  Ces fichiers sont livrés avec le site : aucune API n'est appelée pendant la navigation, donc la liste,
  la recherche et le jeu sont instantanés.
- Les images, sprites animés et cris sont chargés depuis les dépôts GitHub `PokeAPI/sprites` et `PokeAPI/cries`.
- Relancer `npm run data` suffit pour intégrer de nouveaux Pokémon.

La progression du joueur (cartes, série, quêtes) est enregistrée dans le navigateur (`localStorage`).
Il n'y a ni compte ni serveur.

## Organisation du code

```
scripts/build-data.mjs     fabrique les fichiers de données
public/data/               données générées
src/styles.css             charte graphique : couleurs, polices, boutons, cartes, mouvements
src/app/core/              logique sans interface : types, données, joueur, mouvement
src/app/core/game/         cartes, moteur du duel, campagne (fonctions pures, testées)
src/app/ui/                petits composants réutilisés (pastille de type, carte de Pokémon)
src/app/pages/             une page par dossier
```

## Charte graphique

Papier `#F5F0E6`, encre `#1E2340`, rouge `#D63A26`, jaune `#FFC93C`, une encre par type.
Titres en Bricolage Grotesque, texte en DM Sans, données en Space Mono.
Contours de 2,5 px, ombres dures sans flou, animations à ressort, respect de « réduire les animations ».

Ce qu'on ne fait pas : pas de dégradés violets, pas de fond noir partout, pas de glassmorphism,
pas d'illustrations 3D génériques.

## Mentions

Pokémon et les noms de Pokémon sont des marques de Nintendo, Game Freak et Creatures.
Ce site n'est ni affilié ni approuvé par eux.
