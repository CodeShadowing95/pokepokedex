/** Les avatars proposés à l'accueil : huit dresseurs anonymes, de styles variés. */
export const AVATARS = ['jeune-pousse', 'fillette', 'campeur', 'cow-girl', 'topdresseur', 'topdresseuse', 'aventurier', 'aventuriere'] as const;

/** Le dresseur d'un champion d'arène, selon le type de l'arène (identifiant PokéAPI). */
export const DRESSEUR_PAR_TYPE: Record<number, string> = {
  1: 'marin', 2: 'karateka', 3: 'acrobate', 4: 'detective', 5: 'archeologue', 6: 'montagnard',
  7: 'chasseur-insectes', 8: 'moine', 9: 'ouvrier', 10: 'cracheur-feu', 11: 'nageuse', 12: 'jardiniere',
  13: 'rockeur', 14: 'medium', 15: 'skieuse', 16: 'topdresseuse', 17: 'motard', 18: 'dame',
};

/** Prénom valide : de 2 à 12 caractères, une fois les espaces retirés aux bords. */
export const prenomValide = (s: string) => s.trim().length >= 2 && s.trim().length <= 12;
