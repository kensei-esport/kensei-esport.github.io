/**
 * i18n.js — Système de traduction léger
 * Usage: import { t, setLang, getLang } from './i18n.js';
 */

const STORAGE_KEY = 'kensei_lang';

const translations = {
  fr: {
    // Navbar
    nav_home:      'Accueil',
    nav_teams:     'Teams',
    nav_shop:      'Shop',
    nav_about:     'À propos',
    nav_contact:   'Contact',
    nav_login:     'Connexion',
    nav_dashboard: 'Dashboard',
    nav_logout:    'Déconnexion',
    // Teams dropdown
    teams_all:     'Toutes les équipes',
    teams_valorant:'Valorant',
    teams_lol:     'League of Legends',
    teams_rl:      'Rocket League',
    teams_cs2:     'CS2',
    teams_fifa:    'EA FC',
    // Shop dropdown
    shop_all:      'Toute la boutique',
    shop_jerseys:  'Maillots',
    shop_hoodies:  'Sweats & Hoodies',
    shop_accessories: 'Accessoires',
    shop_collab:   'Collaborations',
    // About dropdown
    about_story:   'Notre histoire',
    about_values:  'Nos valeurs',
    about_partners:'Partenaires',
    about_join:    'Nous rejoindre',
    // Hero
    hero_tag:      'Équipe Esport Française',
    hero_title_1:  'FORGÉS POUR',
    hero_title_2:  'LA VICTOIRE',
    hero_sub:      'Kensei Esport — une organisation portée par la passion, l\'ambition et l\'excellence compétitive.',
    hero_cta_1:    'Découvrir les teams',
    hero_cta_2:    'Rejoindre l\'équipe',
    hero_stat_1_val: '5+',
    hero_stat_1_lbl: 'Équipes actives',
    hero_stat_2_val: '30+',
    hero_stat_2_lbl: 'Joueurs pros',
    hero_stat_3_val: '12',
    hero_stat_3_lbl: 'Titres remportés',
    hero_stat_4_val: '2020',
    hero_stat_4_lbl: 'Fondation',
    // Sections
    section_news:   'Actualités',
    section_teams:  'Nos équipes',
    section_results:'Résultats récents',
    section_shop:   'Boutique',
    view_all:       'Voir tout',
    // Footer
    footer_desc:    'Organisation esport française fondée en 2020. Compétition, passion, excellence.',
    footer_nav:     'Navigation',
    footer_games:   'Jeux',
    footer_legal:   'Légal',
    footer_privacy: 'Politique de confidentialité',
    footer_terms:   'Conditions d\'utilisation',
    footer_legal_mentions: 'Mentions légales',
    footer_copy:    '© {year} Kensei Esport. Tous droits réservés.',
    // Auth
    auth_email:     'Adresse e-mail',
    auth_password:  'Mot de passe',
    auth_login_btn: 'Se connecter',
    auth_loading:   'Connexion…',
    auth_forgot:    'Mot de passe oublié ?',
    auth_back:      '← Retour',
    auth_error:     'Identifiants incorrects. Veuillez réessayer.',
    auth_fill:      'Veuillez remplir tous les champs.',
    // Contact
    contact_name:   'Nom',
    contact_email:  'E-mail',
    contact_subject:'Objet',
    contact_msg:    'Message',
    contact_send:   'Envoyer',
    contact_subj_partner:  'Partenariat',
    contact_subj_recruit:  'Recrutement',
    contact_subj_press:    'Presse',
    contact_subj_other:    'Autre',
    contact_info_email_lbl:'Email',
    contact_info_social_lbl:'Réseaux sociaux',
    contact_info_location_lbl:'Localisation',
    contact_info_location_val:'France',
    // Roster
    scroll_down: 'Défiler',
  },
  en: {
    nav_home:      'Home',
    nav_teams:     'Teams',
    nav_shop:      'Shop',
    nav_about:     'About',
    nav_contact:   'Contact',
    nav_login:     'Login',
    nav_dashboard: 'Dashboard',
    nav_logout:    'Logout',
    teams_all:     'All teams',
    teams_valorant:'Valorant',
    teams_lol:     'League of Legends',
    teams_rl:      'Rocket League',
    teams_cs2:     'CS2',
    teams_fifa:    'EA FC',
    shop_all:      'Full store',
    shop_jerseys:  'Jerseys',
    shop_hoodies:  'Sweatshirts',
    shop_accessories: 'Accessories',
    shop_collab:   'Collaborations',
    about_story:   'Our story',
    about_values:  'Our values',
    about_partners:'Partners',
    about_join:    'Join us',
    hero_tag:      'French Esport Organisation',
    hero_title_1:  'FORGED FOR',
    hero_title_2:  'VICTORY',
    hero_sub:      'Kensei Esport — an organisation driven by passion, ambition and competitive excellence.',
    hero_cta_1:    'Our teams',
    hero_cta_2:    'Join the team',
    hero_stat_1_val: '5+',
    hero_stat_1_lbl: 'Active teams',
    hero_stat_2_val: '30+',
    hero_stat_2_lbl: 'Pro players',
    hero_stat_3_val: '12',
    hero_stat_3_lbl: 'Titles won',
    hero_stat_4_val: '2020',
    hero_stat_4_lbl: 'Founded',
    section_news:   'News',
    section_teams:  'Our teams',
    section_results:'Recent results',
    section_shop:   'Shop',
    view_all:       'View all',
    footer_desc:    'French esport organisation founded in 2020. Competition, passion, excellence.',
    footer_nav:     'Navigation',
    footer_games:   'Games',
    footer_legal:   'Legal',
    footer_privacy: 'Privacy policy',
    footer_terms:   'Terms of use',
    footer_legal_mentions: 'Legal notice',
    footer_copy:    '© {year} Kensei Esport. All rights reserved.',
    auth_email:     'Email address',
    auth_password:  'Password',
    auth_login_btn: 'Sign in',
    auth_loading:   'Signing in…',
    auth_forgot:    'Forgot password?',
    auth_back:      '← Back',
    auth_error:     'Invalid credentials. Please try again.',
    auth_fill:      'Please fill in all fields.',
    contact_name:   'Name',
    contact_email:  'Email',
    contact_subject:'Subject',
    contact_msg:    'Message',
    contact_send:   'Send message',
    contact_subj_partner:  'Partnership',
    contact_subj_recruit:  'Recruitment',
    contact_subj_press:    'Press',
    contact_subj_other:    'Other',
    contact_info_email_lbl:'Email',
    contact_info_social_lbl:'Social media',
    contact_info_location_lbl:'Location',
    contact_info_location_val:'France',
    scroll_down: 'Scroll',
  }
};

let currentLang = localStorage.getItem(STORAGE_KEY) || navigator.language.slice(0, 2) || 'fr';
if (!translations[currentLang]) currentLang = 'fr';

/**
 * Traduit une clé.
 * @param {string} key
 * @param {Record<string, string>} [vars]
 */
function t(key, vars = {}) {
  let str = translations[currentLang]?.[key] ?? translations['fr']?.[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}

/** Retourne la langue courante. */
function getLang() { return currentLang; }

/**
 * Change la langue et recharge la page pour appliquer les traductions.
 * @param {string} lang
 */
function setLang(lang) {
  if (!translations[lang]) return;
  localStorage.setItem(STORAGE_KEY, lang);
  location.reload();
}

/** Applique toutes les traductions dans le DOM via data-i18n. */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    // Uniquement pour du contenu de confiance (pas de user input)
    el.innerHTML = t(el.dataset.i18nHtml);
  });
}

export { t, getLang, setLang, applyTranslations, translations };
