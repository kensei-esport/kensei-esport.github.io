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
    shop_jerseys_title: 'Maillots officiels',
    shop_hoodies:  'Sweats & Hoodies',
    shop_hoodies_title: 'Sweats et Hoodies',
    shop_accessories: 'Accessoires',
    shop_acc_title: 'Accessoires',
    shop_collab:   'Collaborations',
    shop_collab_title: 'Collaborations',
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
    contact_title:             'Nous contacter',
    contact_info_title:        'Informations',
    contact_form_title:        'Envoyer un message',
    contact_email_label:       'Email',
    contact_social_label:      'Réseaux sociaux',
    contact_name:              'Nom',
    contact_email:             'E-mail',
    contact_subject:           'Objet',
    contact_msg:               'Message',
    contact_message:           'Message',
    contact_send:              'Envoyer',
    contact_submit:            'Envoyer le message',
    contact_success:           'Message envoyé ! Nous vous répondrons très vite.',
    contact_error:             'Une erreur est survenue. Veuillez réessayer.',
    contact_name_placeholder:  'Votre nom',
    contact_email_placeholder: 'votre@email.fr',
    contact_subject_placeholder:'Sélectionner un sujet',
    contact_message_placeholder:'Votre message…',
    contact_subj_partner:      'Partenariat',
    contact_subj_recruit:      'Recrutement',
    contact_subj_press:        'Presse',
    contact_subj_other:        'Autre',
    contact_subject_recruit:   'Recrutement',
    contact_subject_partner:   'Partenariat',
    contact_subject_press:     'Presse',
    contact_subject_other:     'Autre',
    contact_info_email_lbl:    'Email',
    contact_info_social_lbl:   'Réseaux sociaux',
    contact_info_location_lbl: 'Localisation',
    contact_info_location_val: 'France',
    // Roster
    scroll_down: 'Défiler',
    // Auth — clés étendues
    auth_login:              'Connexion',
    auth_register:           'Inscription',
    auth_username:           'Pseudo',
    auth_display_name:       'Nom affiché (optionnel)',
    auth_password_confirm:   'Confirmer le mot de passe',
    auth_confirm_email:      'Vérifiez votre boîte mail pour confirmer votre inscription. Vous pourrez ensuite vous connecter.',
    auth_password_mismatch:  'Les mots de passe ne correspondent pas.',
    auth_password_short:     'Le mot de passe doit contenir au moins 8 caractères.',
    auth_email_not_confirmed:'Email non confirmé. Vérifiez votre boîte mail.',
    auth_invalid_creds:      'Email ou mot de passe incorrect.',
    auth_username_taken:     'Ce pseudo est déjà pris.',
    auth_username_invalid:   'Pseudo invalide (3–32 caractères, lettres, chiffres, _ et - uniquement).',
    auth_fill:               'Veuillez remplir tous les champs.',
    // Setup
    setup_title:             'Créer mon profil',
    setup_sub:               'Dernière étape — personnalisez votre espace fan Kensei.',
    setup_favorite_game:     'Jeu favori (optionnel)',
    setup_bio:               'Bio (optionnel)',
    setup_bio_placeholder:   'Parlez-nous de vous en quelques mots…',
    setup_submit:            'Créer mon profil',
    setup_success:           'Profil créé ! Bienvenue dans la famille Kensei.',
    // About page
    about_values_title:      'Ce qui nous définit',
    about_partners_title:    'Ils nous font confiance',
    about_cta_title:         'Prêt à rejoindre l\'aventure ?',
    about_cta_desc:          'Nous recrutons en permanence des joueurs motivés sur tous nos titres. Contactez-nous.',
    about_cta_btn:           'Nous contacter',
    value_excellence:        'Excellence',
    value_excellence_desc:   'Nous repoussons nos limites chaque jour pour atteindre les plus hauts niveaux compétitifs.',
    value_team:              'Équipe',
    value_team_desc:         'Chaque victoire est collective. Nous grandissons ensemble, solidaires dans l\'adversité.',
    value_respect:           'Respect',
    value_respect_desc:      'Fairplay, intégrité et respect envers nos adversaires, partenaires et communauté.',
    value_progress:          'Progression',
    value_progress_desc:     'Analyser, apprendre, s\'améliorer. La progression constante est notre moteur.',
    partners_loading:        'Chargement des partenaires…',
    // Dashboard
    dash_title:              'Mon espace',
    dash_account:            'Mon compte',
    dash_member_since:       'Fan depuis',
    dash_fav_game:           'Jeu favori',
    dash_edit_profile:       'Modifier le profil',
    dash_actions:            'Actions',
    dash_no_game:            'Non renseigné',
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
    shop_jerseys_title: 'Official jerseys',
    shop_hoodies:  'Sweatshirts',
    shop_hoodies_title: 'Sweatshirts & Hoodies',
    shop_accessories: 'Accessories',
    shop_acc_title: 'Accessories',
    shop_collab:   'Collaborations',
    shop_collab_title: 'Collaborations',
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
    contact_title:             'Contact us',
    contact_info_title:        'Information',
    contact_form_title:        'Send a message',
    contact_email_label:       'Email',
    contact_social_label:      'Social media',
    contact_name:              'Name',
    contact_email:             'Email',
    contact_subject:           'Subject',
    contact_msg:               'Message',
    contact_message:           'Message',
    contact_send:              'Send',
    contact_submit:            'Send message',
    contact_success:           'Message sent! We will reply as soon as possible.',
    contact_error:             'An error occurred. Please try again.',
    contact_name_placeholder:  'Your name',
    contact_email_placeholder: 'your@email.com',
    contact_subject_placeholder:'Select a subject',
    contact_message_placeholder:'Your message…',
    contact_subj_partner:      'Partnership',
    contact_subj_recruit:      'Recruitment',
    contact_subj_press:        'Press',
    contact_subj_other:        'Other',
    contact_subject_recruit:   'Recruitment',
    contact_subject_partner:   'Partnership',
    contact_subject_press:     'Press',
    contact_subject_other:     'Other',
    contact_info_email_lbl:    'Email',
    contact_info_social_lbl:   'Social media',
    contact_info_location_lbl: 'Location',
    contact_info_location_val: 'France',
    scroll_down: 'Scroll',
    // Auth — extended keys
    auth_login:              'Sign in',
    auth_register:           'Sign up',
    auth_username:           'Username',
    auth_display_name:       'Display name (optional)',
    auth_password_confirm:   'Confirm password',
    auth_confirm_email:      'Check your inbox to confirm your registration. You can then sign in.',
    auth_password_mismatch:  'Passwords do not match.',
    auth_password_short:     'Password must be at least 8 characters.',
    auth_email_not_confirmed:'Email not confirmed. Check your inbox.',
    auth_invalid_creds:      'Invalid email or password.',
    auth_username_taken:     'This username is already taken.',
    auth_username_invalid:   'Invalid username (3–32 chars, letters, digits, _ and - only).',
    auth_fill:               'Please fill in all fields.',
    // Setup
    setup_title:             'Create my profile',
    setup_sub:               'Last step — personalise your Kensei fan space.',
    setup_favorite_game:     'Favourite game (optional)',
    setup_bio:               'Bio (optional)',
    setup_bio_placeholder:   'Tell us a bit about yourself…',
    setup_submit:            'Create my profile',
    setup_success:           'Profile created! Welcome to the Kensei family.',
    // About page
    about_values_title:      'What defines us',
    about_partners_title:    'They trust us',
    about_cta_title:         'Ready to join the adventure?',
    about_cta_desc:          'We are constantly recruiting motivated players across all our titles. Get in touch.',
    about_cta_btn:           'Contact us',
    value_excellence:        'Excellence',
    value_excellence_desc:   'We push our limits every day to reach the highest competitive levels.',
    value_team:              'Team',
    value_team_desc:         'Every victory is collective. We grow together, united in adversity.',
    value_respect:           'Respect',
    value_respect_desc:      'Fair play, integrity and respect towards our opponents, partners and community.',
    value_progress:          'Progress',
    value_progress_desc:     'Analyse, learn, improve. Constant progression is our driving force.',
    partners_loading:        'Loading partners…',
    // Dashboard
    dash_title:              'My space',
    dash_account:            'My account',
    dash_member_since:       'Fan since',
    dash_fav_game:           'Favourite game',
    dash_edit_profile:       'Edit profile',
    dash_actions:            'Actions',
    dash_no_game:            'Not set',
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
