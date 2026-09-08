/* =====================================================================
   BATTLE DOCK FIGHT — bibliothèque commune
   Catalogue de personnalisation, dessin animé du docker, arènes.
   Utilisée par index.html (vestiaire) et fight.html (combat).
   ===================================================================== */
(function(global){
'use strict';

/* ------------------------------------------------------- raretés */
const RARETES={
  base  :{nom:'De série',   c:'#8d8a82', rendu:0},
  commun:{nom:'Commun',     c:'#8d8a82', rendu:15},
  peu   :{nom:'Peu commun', c:'#4e9c5a', rendu:35},
  rare  :{nom:'Rare',       c:'#3a6fd8', rendu:80},
  epique:{nom:'Épique',     c:'#c14fd6', rendu:190},
  leg   :{nom:'Légendaire', c:'#f0a020', rendu:450}
};

/* ------------------------------------------------------- palettes */
const TEINTS=['#f7dcc0','#f0c9a4','#e0aa7e','#c48a58','#a06a3c','#7a4a26','#523018','#2f1d10'];
const CHEVEUX_C=['#1d1712','#3a2418','#6b4423','#9c6b32','#c9a227','#e8dcc0','#b8b0a8','#8a8577',
  '#e8452c','#2ec4c9','#f26fa8','#6b4a8c','#4e8c4a','#f0a020'];
const YEUX_C=['#3a2a1c','#6b4423','#2f6b8c','#3f7a4a','#6d6a63','#8c2f2f'];
const VESTE_C=['#e8452c','#ffd029','#2ec4c9','#f26fa8','#3a5ba0','#4e8c4a','#e8dcc0','#2b2b2b',
  '#8a4b2a','#6b4a8c','#f2ece0','#0f2b3a','#c9a227','#8c2f3f'];
const BAS_C=['#33414a','#2b2b33','#5a4632','#1f3a44','#6d4a4a','#8a8577','#1b1b1b','#3f5d3a',
  '#7a4a2a','#4a3a5a'];

/* ------------------------------------------------------- catalogue */
const CAT={
carrure:[
  {id:'fluet', nom:'Fluet',  larg:15,ep:1,f:1,v:6,e:2},
  {id:'sec',   nom:'Sec',    larg:18,ep:2,f:2,v:5,e:3},
  {id:'solide',nom:'Solide', larg:22,ep:3,f:3,v:3,e:4},
  {id:'massif',nom:'Massif', larg:27,ep:4,f:5,v:2,e:5},
  {id:'ours',  nom:'Ours du quai',larg:31,ep:5,f:6,v:1,e:6,r:'epique'},
  {id:'poteau',nom:'Poteau',larg:17,ep:2,f:3,v:4,e:5,r:'rare'}
],
cheveux:[
  {id:'court',nom:'Court'},{id:'ras',nom:'Ras'},{id:'chauve',nom:'Chauve'},
  {id:'milong',nom:'Mi-long'},{id:'queue',nom:'Queue'},{id:'afro',nom:'Afro'},
  {id:'long',nom:'Longs'},{id:'chignon',nom:'Chignon',r:'peu'},
  {id:'crete',nom:'Crête',r:'peu'},{id:'dreads',nom:'Dreads',r:'peu'},
  {id:'tresses',nom:'Tresses',r:'peu'},{id:'banane',nom:'Banane',r:'rare'},
  {id:'mulet',nom:'Mulet',r:'rare'},{id:'flammes',nom:'Cheveux de feu',r:'leg'}
],
barbe:[
  {id:'rase',nom:'Rasé'},{id:'ombre',nom:'Barbe de trois jours'},{id:'bouc',nom:'Bouc'},
  {id:'moust',nom:'Moustache'},{id:'courte',nom:'Courte'},{id:'pleine',nom:'Pleine'},
  {id:'collier',nom:'Collier'},{id:'bacchantes',nom:'Bacchantes',r:'peu'},
  {id:'tressee',nom:'Barbe tressée',r:'rare'},{id:'papi',nom:'Barbe de patriarche',r:'epique'}
],
expression:[
  {id:'neutre',nom:'Neutre'},{id:'decide',nom:'Décidé'},{id:'sourire',nom:'Sourire'},
  {id:'serre',nom:'Dents serrées'},{id:'blase',nom:'Blasé'}
],
tatouage:[
  {id:'aucun',nom:'Aucun'},{id:'ancre',nom:'Ancre'},{id:'etoiles',nom:'Étoiles',r:'peu'},
  {id:'sirene',nom:'Sirène',r:'peu'},{id:'poulpe',nom:'Poulpe',r:'rare'},
  {id:'manchette',nom:'Manchette complète',r:'epique'}
],
haut:[
  {id:'marcel',nom:'Marcel'},{id:'veste',nom:'Veste de quart'},{id:'chemise',nom:'Chemise ouverte'},
  {id:'hv',nom:'Gilet jaune'},{id:'bleu',nom:'Bleu de travail'},{id:'torse',nom:'Torse nu'},
  {id:'survet',nom:'Veste de survêt'},{id:'marin',nom:'Marinière',r:'peu'},
  {id:'cire',nom:'Ciré de pêche',r:'peu'},{id:'foot',nom:'Maillot de foot',r:'peu'},
  {id:'tablier',nom:'Tablier de poissonnier',r:'peu'},{id:'cloute',nom:'Blouson clouté',r:'rare'},
  {id:'bomber',nom:'Bomber',r:'rare'},{id:'zebre',nom:'Débardeur zébré',r:'rare'},
  {id:'costume',nom:'Costume du chef',r:'epique'},{id:'franges',nom:'Veste à franges',r:'epique'},
  {id:'peignoir',nom:'Peignoir du dimanche',r:'leg'},{id:'armure',nom:'Plastron de tôle',r:'leg'}
],
bas:[
  {id:'toile',nom:'Pantalon toile'},{id:'treillis',nom:'Treillis'},{id:'jean',nom:'Jean'},
  {id:'short',nom:'Short'},{id:'survetbas',nom:'Bas de survêt'},
  {id:'hawai',nom:'Bermuda hawaïen',r:'peu'},{id:'cuir',nom:'Cuir',r:'rare'},
  {id:'kilt',nom:'Kilt',r:'rare'},{id:'paillettes',nom:'À paillettes',r:'epique'},
  {id:'cuissardes',nom:'Cuissardes de pêche',r:'epique'}
],
ceinture:[
  {id:'cuir',nom:'Ceinture cuir'},{id:'corde',nom:'Bout de corde'},{id:'aucune',nom:'Aucune'},
  {id:'sangle',nom:'Sangle d’arrimage',r:'peu'},{id:'champion',nom:'Ceinture de champion',r:'epique'}
],
pieds:[
  {id:'brodequins',nom:'Brodequins'},{id:'bottes',nom:'Bottes'},{id:'baskets',nom:'Baskets'},
  {id:'tongs',nom:'Tongs'},{id:'rangers',nom:'Rangers',r:'peu'},{id:'sabots',nom:'Sabots',r:'peu'},
  {id:'santiags',nom:'Santiags dorées',r:'rare'},{id:'chaussons',nom:'Chaussons',r:'rare'},
  {id:'palmes',nom:'Palmes',r:'epique'},{id:'patins',nom:'Patins à roulettes',r:'leg'}
],
tete:[
  {id:'rien',nom:'Rien'},{id:'bonnet',nom:'Bonnet'},{id:'casque',nom:'Casque'},
  {id:'casquette',nom:'Casquette'},{id:'envers',nom:'Casquette à l’envers'},
  {id:'beret',nom:'Béret'},{id:'foulard',nom:'Foulard'},{id:'bandeau',nom:'Bandeau'},
  {id:'bob',nom:'Bob',r:'peu'},{id:'paille',nom:'Chapeau de paille',r:'peu'},
  {id:'pirate',nom:'Bandana pirate',r:'peu'},{id:'seau',nom:'Seau',r:'peu'},
  {id:'soudeur',nom:'Casque de soudeur',r:'rare'},{id:'melon',nom:'Chapeau melon',r:'rare'},
  {id:'moto',nom:'Casque de moto',r:'rare'},{id:'cornes',nom:'Casque à cornes',r:'epique'},
  {id:'chat',nom:'Oreilles de chat',r:'epique'},{id:'couronne',nom:'Couronne du port',r:'leg'},
  {id:'mouette',nom:'Mouette posée',r:'leg'},{id:'aureole',nom:'Auréole',r:'leg'}
],
visage:[
  {id:'rien',nom:'Rien'},{id:'lunettes',nom:'Lunettes noires'},{id:'cicatrice',nom:'Cicatrice'},
  {id:'cloppe',nom:'Clope au bec'},{id:'curedent',nom:'Cure-dent'},
  {id:'masque',nom:'Masque anti-poussière',r:'peu'},{id:'ski',nom:'Lunettes de ski',r:'peu'},
  {id:'nez',nom:'Nez rouge',r:'peu'},{id:'cacheoeil',nom:'Cache-œil',r:'rare'},
  {id:'monocle',nom:'Monocle',r:'rare'},{id:'peinture',nom:'Peinture de guerre',r:'epique'},
  {id:'catch',nom:'Masque de catch',r:'epique'}
],
boucle:[
  {id:'aucune',nom:'Aucune'},{id:'anneau',nom:'Anneau'},
  {id:'plume',nom:'Plume',r:'peu'},{id:'creole',nom:'Créole dorée',r:'rare'}
],
mains:[
  {id:'nues',nom:'Nues',f:0,v:1},{id:'bandes',nom:'Bandes',f:1,v:0},
  {id:'manut',nom:'Gants de manut.',f:1,v:0},{id:'mitaines',nom:'Mitaines',f:1,v:0},
  {id:'moufles',nom:'Moufles',f:0,v:1},
  {id:'boxe',nom:'Gants de boxe',f:2,v:-1,r:'peu'},
  {id:'menage',nom:'Gants de ménage',f:0,v:2,r:'peu'},
  {id:'moto',nom:'Gants de moto',f:1,v:1,r:'peu'},
  {id:'gardien',nom:'Gants de gardien',f:1,v:1,r:'rare'},
  {id:'or',nom:'Gants dorés',f:3,v:0,r:'leg'}
],
dos:[
  {id:'rien',nom:'Rien'},{id:'crochet',nom:'Crochet de docker'},{id:'sac',nom:'Sac de jute'},
  {id:'thermos',nom:'Thermos',r:'peu'},{id:'filet',nom:'Filet',r:'peu'},
  {id:'parapluie',nom:'Parapluie',r:'peu'},{id:'guitare',nom:'Guitare',r:'rare'},
  {id:'cape',nom:'Cape de bâche',r:'rare'},{id:'bouteille',nom:'Bouteille de plongée',r:'epique'},
  {id:'ailes',nom:'Ailes de mouette',r:'leg'}
],
arme:[
  {id:'aucune',nom:'Mains nues',f:0,v:2,p:0,d:'Rien dans les mains. Rapide, honnête.'},
  {id:'crochet',nom:'Crochet de quai',f:2,v:1,p:1,d:'L’outil du métier.'},
  {id:'pelle',nom:'Pelle',f:3,v:0,p:3,d:'Large, plate, sonore.'},
  {id:'ventouse',nom:'Ventouse',f:1,v:3,p:2,d:'Fait un bruit humiliant.'},
  {id:'molette',nom:'Clé à molette géante',f:4,v:-1,p:2,r:'peu',d:'Serre les boulons et les mâchoires.'},
  {id:'poisson',nom:'Thon congelé',f:3,v:0,p:2,r:'peu',d:'Encore givré. Ça claque.'},
  {id:'baguette',nom:'Baguette de la veille',f:1,v:3,p:2,r:'peu',d:'Rassie depuis mardi.'},
  {id:'cone',nom:'Cône de chantier',f:2,v:2,p:2,r:'peu',d:'Se porte aussi sur la tête.'},
  {id:'megaphone',nom:'Mégaphone',f:2,v:2,p:2,r:'peu',d:'Le bruit fait la moitié du travail.'},
  {id:'chaine',nom:'Chaîne de vélo',f:3,v:1,p:3,r:'peu',d:'Graisseuse et rapide.'},
  {id:'rame',nom:'Rame de barque',f:3,v:0,p:3,r:'rare',d:'Longue portée, prend le vent.'},
  {id:'poele',nom:'Poêle à paella',f:4,v:-1,p:2,r:'rare',d:'Sonne comme une cloche.'},
  {id:'extincteur',nom:'Extincteur',f:4,v:-2,p:1,r:'rare',d:'Lourd, mais la mousse aveugle.'},
  {id:'epuisette',nom:'Épuisette à oursins',f:1,v:3,p:4,r:'rare',d:'Attrape tout ce qui passe.'},
  {id:'petanque',nom:'Boule de pétanque',f:4,v:0,p:1,r:'rare',d:'Trois cents grammes de dimanche.'},
  {id:'poulpe',nom:'Poulpe vivant',f:2,v:2,p:3,r:'rare',d:'Il n’est pas d’accord.'},
  {id:'saucisson',nom:'Saucisson de concours',f:3,v:1,p:2,r:'epique',d:'Séché trois ans.'},
  {id:'ancre',nom:'Ancre de poche',f:6,v:-3,p:1,r:'epique',d:'Personne ne sait comment tu la soulèves.'},
  {id:'bouee',nom:'Bouée canard',f:1,v:4,p:3,r:'epique',d:'Grince. Déconcentre.'},
  {id:'stop',nom:'Panneau stop',f:4,v:-1,p:3,r:'epique',d:'Arraché au carrefour du môle.'},
  {id:'voile',nom:'Planche à voile',f:5,v:-2,p:5,r:'leg',d:'Ingérable et magnifique.'},
  {id:'guitare',nom:'Guitare électrique',f:4,v:1,p:3,r:'leg',d:'Un accord, un KO.'},
  {id:'grue',nom:'Grue miniature',f:6,v:-2,p:5,r:'leg',d:'Volée au modélisme du port.'},
  {id:'pieddebiche',nom:'Pied-de-biche doré',f:5,v:1,p:2,r:'leg',d:'Ouvre les conteneurs et les gardes.'}
]
};

const RUBRIQUES=[
  {c:'carrure',   nom:'Carrure'},
  {c:'teint',     nom:'Teint',            coul:()=>TEINTS},
  {c:'cheveux',   nom:'Cheveux'},
  {c:'cheveuxC',  nom:'Couleur des cheveux',coul:()=>CHEVEUX_C},
  {c:'barbe',     nom:'Poils'},
  {c:'yeux',      nom:'Yeux',             coul:()=>YEUX_C},
  {c:'expression',nom:'Expression'},
  {c:'tatouage',  nom:'Tatouage'},
  {c:'haut',      nom:'Haut'},
  {c:'hautC',     nom:'Couleur du haut',  coul:()=>VESTE_C},
  {c:'bas',       nom:'Bas'},
  {c:'basC',      nom:'Couleur du bas',   coul:()=>BAS_C},
  {c:'ceinture',  nom:'Ceinture'},
  {c:'pieds',     nom:'Chaussures'},
  {c:'tete',      nom:'Sur la tête'},
  {c:'visage',    nom:'Visage'},
  {c:'boucle',    nom:'Oreille'},
  {c:'mains',     nom:'Mains'},
  {c:'dos',       nom:'Dans le dos'},
  {c:'arme',      nom:'Arme'}
];
const ONGLETS=[
  {id:'corps', nom:'Corps',      rubs:['carrure','teint','cheveux','cheveuxC','barbe','yeux','expression','tatouage']},
  {id:'tenue', nom:'Tenue',      rubs:['haut','hautC','bas','basC','ceinture','pieds']},
  {id:'access',nom:'Accessoires',rubs:['tete','visage','boucle','mains','dos']},
  {id:'armes', nom:'Armes',      rubs:['arme']}
];

const POSTES=[
  {id:'secu',    nom:'Sécurité',       poids:26,r:'commun',euros:35, d:'Tu tiens la barrière. Tu vois tout venir.',b:{e:1}},
  {id:'bequille',nom:'Béquille',       poids:22,r:'commun',euros:40, d:'Tu cales, tu soutiens, tu encaisses.',b:{e:2}},
  {id:'docker',  nom:'Docker simple',  poids:20,r:'commun',euros:45, d:'Le poste de base. Rien de plus.',b:{f:1,e:1}},
  {id:'taquet',  nom:'Taquet terre',   poids:14,r:'peu',   euros:65, d:'Tu bloques les charges au sol.',b:{f:2}},
  {id:'pointeur',nom:'Pointeur',       poids:9, r:'rare',  euros:95, d:'Tu comptes tout. Tu lis l’adversaire.',b:{v:2,rg:1}},
  {id:'chauffeur',nom:'Chauffeur',     poids:7, r:'rare',  euros:110,d:'Cabine, levier, vitesse.',b:{v:3}},
  {id:'chef',    nom:'Chef de service',poids:2, r:'leg',   euros:260,d:'Le quai entier travaille pour toi.',b:{f:3,v:2,e:3,rg:2}}
];

const ADVERSAIRES=[
  {nom:'LE NOUVEAU',agro:.5,ref:.28,saut:.01,mult:.85,d:'Il a signé la semaine dernière. Il frappe fort et mal.',
   look:{carrure:'sec',teint:1,cheveux:'court',cheveuxC:3,barbe:'ombre',haut:'marcel',hautC:6,bas:'jean',basC:0,
     ceinture:'cuir',pieds:'baskets',tete:'rien',visage:'rien',mains:'bandes',dos:'rien',arme:'aucune',expression:'decide'}},
  {nom:'FATOU LA GRUE',agro:.6,ref:.42,saut:.04,mult:.95,d:'Vingt ans en cabine. Elle voit les coups d’en haut.',
   look:{carrure:'sec',teint:6,cheveux:'tresses',cheveuxC:0,barbe:'rase',haut:'hv',hautC:1,bas:'treillis',basC:1,
     ceinture:'sangle',pieds:'bottes',tete:'casque',visage:'rien',mains:'manut',dos:'thermos',arme:'crochet',expression:'neutre'}},
  {nom:'RACHID DEUX-SACS',agro:.7,ref:.5,saut:.02,mult:1.05,d:'Deux sacs par main. Sa garde est un mur.',
   look:{carrure:'massif',teint:3,cheveux:'ras',cheveuxC:0,barbe:'pleine',haut:'bleu',hautC:4,bas:'toile',basC:2,
     ceinture:'corde',pieds:'brodequins',tete:'bonnet',visage:'rien',mains:'mitaines',dos:'sac',arme:'molette',expression:'serre'}},
  {nom:'LA MÔME SÈTE',agro:.82,ref:.6,saut:.11,mult:1,d:'Boxeuse le dimanche. Elle ne reste jamais en face.',
   look:{carrure:'fluet',teint:1,cheveux:'queue',cheveuxC:8,barbe:'rase',haut:'marin',hautC:6,bas:'short',basC:1,
     ceinture:'aucune',pieds:'baskets',tete:'bandeau',visage:'rien',mains:'boxe',dos:'rien',arme:'baguette',expression:'sourire'}},
  {nom:'LE CONTREMAÎTRE',agro:.78,ref:.68,saut:.04,mult:1.2,d:'Il tient les feuilles de paie et les rancunes.',
   look:{carrure:'massif',teint:2,cheveux:'court',cheveuxC:5,barbe:'bacchantes',haut:'costume',hautC:7,bas:'toile',basC:6,
     ceinture:'cuir',pieds:'brodequins',tete:'melon',visage:'monocle',mains:'or',dos:'parapluie',arme:'extincteur',expression:'blase'}},
  {nom:'ARACHNÉ',agro:.9,ref:.78,saut:.16,mult:1.32,d:'Personne ne sait qui c’est. Elle dort dans les câbles.',
   look:{carrure:'poteau',teint:7,cheveux:'long',cheveuxC:0,barbe:'rase',haut:'cloute',hautC:7,bas:'cuir',basC:6,
     ceinture:'champion',pieds:'santiags',tete:'cornes',visage:'peinture',mains:'or',dos:'cape',arme:'grue',expression:'serre'}}
];

/* ------------------------------------------------------- utilitaires */
const item=(cat,id)=>CAT[cat].find(x=>x.id===id)||CAT[cat][0];
function lookDefaut(){
  return {nom:'DOCKER',carrure:'solide',teint:2,cheveux:'court',cheveuxC:1,barbe:'ombre',
    yeux:0,expression:'neutre',tatouage:'aucun',haut:'veste',hautC:0,bas:'toile',basC:0,
    ceinture:'cuir',pieds:'brodequins',tete:'bonnet',visage:'rien',boucle:'aucune',
    mains:'bandes',dos:'crochet',arme:'aucune',poste:null};
}
function statsDe(look){
  const c=item('carrure',look.carrure),m=item('mains',look.mains),a=item('arme',look.arme);
  const p=look.poste?POSTES.find(x=>x.id===look.poste):null,b=p?p.b:{};
  return{
    force:Math.max(1,Math.min(6,c.f+(m.f||0)+(a.f||0)+(b.f||0))),
    vitesse:Math.max(1,Math.min(6,c.v+(m.v||0)+(a.v||0)+(b.v||0))),
    endurance:Math.max(1,Math.min(6,c.e+(b.e||0))),
    portee:Math.max(1,Math.min(6,1+c.ep+(a.p||0))),
    rage:b.rg||0
  };
}

/* ------------------------------------------------------- dessin */
function px(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function ass(c,f){
  const n=parseInt(c.slice(1),16);
  const r=Math.max(0,Math.min(255,(n>>16)-f)),v=Math.max(0,Math.min(255,((n>>8)&255)-f)),b=Math.max(0,Math.min(255,(n&255)-f));
  return '#'+((r<<16)|(v<<8)|b).toString(16).padStart(6,'0');
}

/* --- armes : dessinées depuis le poing, vers la droite --- */
function dessinerArme(g,id,x,y,t){
  const s=(a,b,w,h,c)=>px(g,x+a,y+b,w,h,c);
  switch(id){
    case 'crochet':s(-1,-2,3,12,'#8a8577');s(-3,8,7,3,'#8a8577');break;
    case 'pelle':s(0,-3,20,4,'#a8895c');s(19,-9,10,16,'#8a8577');s(21,-7,6,12,'#a8a096');break;
    case 'ventouse':s(0,-2,14,3,'#c9a870');s(13,-7,5,13,'#b23a48');break;
    case 'molette':s(-1,-16,4,20,'#b8b0a0');s(-4,-22,10,7,'#b8b0a0');s(-1,-21,4,4,'#efe7d8');break;
    case 'poisson':s(-2,-10,13,14,'#7fa8c4');s(11,-6,5,6,'#5f88a4');s(0,-6,2,2,'#1b1b1b');s(-2,-10,13,3,'#a8c9dd');break;
    case 'baguette':s(0,-4,23,5,'#d9a95a');s(2,-4,19,2,'#e8c07a');break;
    case 'cone':s(-4,-14,15,4,'#e8452c');s(-1,-24,8,11,'#e8452c');s(0,-19,6,3,'#f0ece2');break;
    case 'megaphone':s(0,-4,8,7,'#2b2b2b');s(7,-9,12,17,'#e8452c');s(9,-7,8,13,'#f2ece0');break;
    case 'chaine':for(let i=0;i<7;i++)s(i*4,-2+Math.sin(t/120+i)*2,3,3,i%2?'#8a8577':'#b8b0a0');break;
    case 'rame':s(0,-3,26,4,'#b8996a');s(24,-9,9,16,'#8a7448');break;
    case 'poele':s(0,-2,16,3,'#3a3a3a');s(14,-9,13,16,'#2b2b2b');s(17,-6,7,10,'#c9a227');break;
    case 'extincteur':s(-2,-16,10,20,'#c9331f');s(1,-20,4,5,'#b8b0a0');s(-2,-11,10,3,'#efe7d8');break;
    case 'epuisette':s(0,-2,20,3,'#b8996a');s(18,-13,3,18,'#8a8577');s(21,-13,11,18,'rgba(232,226,212,.5)');break;
    case 'petanque':s(0,-2,5,4,'#8a8577');s(4,-7,12,12,'#9aa0a6');s(7,-5,4,4,'#c9cdd2');break;
    case 'poulpe':{const w=Math.sin(t/110)*2;s(0,-9,12,11,'#b2506a');s(3,-12,7,4,'#c96a82');
      for(let i=0;i<4;i++)s(11+i*2,-4+i*2+w,5,2,'#b2506a');s(3,-6,2,2,'#1b1b1b');break;}
    case 'saucisson':s(0,-4,21,8,'#8c4a44');s(2,-4,17,2,'#a85d55');s(5,-1,3,3,'#e8dcc0');s(12,1,3,3,'#e8dcc0');break;
    case 'ancre':s(1,-18,4,22,'#5f6b72');s(-4,-14,14,3,'#5f6b72');s(-6,0,6,4,'#5f6b72');s(6,0,6,4,'#5f6b72');break;
    case 'bouee':{const b=Math.sin(t/140)*1;s(-2,-12+b,18,16,'#ffd029');s(12,-18+b,8,7,'#ffd029');
      s(19,-16+b,4,3,'#e8452c');s(15,-16+b,2,2,'#1b1b1b');break;}
    case 'stop':s(0,-3,14,4,'#8a8577');s(13,-13,15,15,'#c9331f');s(16,-8,9,4,'#f2ece0');break;
    case 'voile':s(0,-4,30,5,'#c9a227');s(6,-30,3,27,'#8a8577');s(9,-30,16,26,'rgba(46,196,201,.75)');break;
    case 'guitare':s(0,-3,18,4,'#2b2b2b');s(16,-11,15,18,'#e8452c');s(19,-7,8,10,'#f2ece0');
      for(let i=0;i<3;i++)s(2,-2+i,16,1,'#e8dcc0');break;
    case 'grue':s(0,-4,4,8,'#e8452c');s(0,-27,4,25,'#f2b134');s(2,-27,19,3,'#f2b134');
      s(18,-24,2,11,'#8a8577');s(16,-13,6,5,'#5f6b72');break;
    case 'pieddebiche':s(0,-2,21,4,'#f0a020');s(19,-9,5,11,'#f0a020');s(-4,-4,6,4,'#d9a520');break;
  }
}

/* --- pose : renvoie les décalages d'animation --- */
function pose(f,t){
  const e=f.etat||'debout';
  const p={torseY:0,torseX:0,teteX:0,teteY:0,jAv:0,jAr:0,plie:0,brasAr:0,penche:0,squash:0,
    ext:null,ferme:false,ko:e==='ko'};
  const bat=t/1000;
  switch(e){
    case 'marche':{
      const ph=Math.sin(t*.022);
      p.jAv=ph*4;p.jAr=-ph*4;p.torseY=-Math.abs(ph)*1.2;p.brasAr=-ph*3;p.torseX=1;break;
    }
    case 'saut':{
      p.plie=5;p.jAv=-3;p.jAr=2;p.brasAr=-5;p.teteY=-1;break;
    }
    case 'garde':{
      p.plie=4;p.torseY=2;p.ferme=true;p.penche=1;break;
    }
    case 'touche':{
      p.penche=-4;p.teteX=-3;p.torseX=-2;p.jAv=-2;p.brasAr=4;break;
    }
    case 'coup':{
      const k=f.coup;
      if(k){
        if(k.t<k.dep){p.torseX=-2;p.brasAr=3;p.penche=-1;p.plie=1;}
        else if(k.t<k.dep+k.act){p.torseX=3;p.penche=2;p.jAv=4;p.jAr=-3;}
        else{p.torseX=1;p.plie=1;}
      }
      break;
    }
    case 'gagne':{
      const r=Math.sin(t/160);
      p.torseY=-1;p.brasLeve=true;p.teteY=r>0?-1:0;p.jAv=2;p.jAr=-2;break;
    }
    default:{
      const r=Math.sin(t/430);
      p.torseY=r>0?0:1;p.brasAr=r*1.2;p.teteY=r>.7?-1:0;
      p.clin=(Math.floor(t/1000)%4===0)&&(t%1000<110);
      break;
    }
  }
  if(f.sol===0&&e!=='coup'){p.plie=Math.max(p.plie,4);}
  if(f.garde&&f.stun>0){p.torseX+=(Math.random()-.5)*2;}
  return p;
}

/* --- silhouette complète, origine = pieds, tourné vers la droite --- */
function dessinerDocker(g,f,t){
  const L=f.look||f, c=item('carrure',L.carrure);
  const P=pose(f,t);
  const peau=TEINTS[L.teint]??TEINTS[2], peauO=ass(peau,34), peauC=ass(peau,-22);
  const chev=CHEVEUX_C[L.cheveuxC]??CHEVEUX_C[1];
  const hautC=VESTE_C[L.hautC]??VESTE_C[0], basC=BAS_C[L.basC]??BAS_C[0];
  const yeuxC=YEUX_C[L.yeux]??YEUX_C[0];
  const l=c.larg, torse=l-2;
  const hJ=30-P.plie, hT=27;
  const yT=-hJ-hT+P.torseY, xT=P.torseX;
  const yTete=yT-16+P.teteY, xTete=xT+P.teteX+P.penche;

  if(P.ko){g.rotate(-1.42);g.translate(-28,-6);}
  if(f.ecrase>0){const q=f.ecrase/10;g.scale(1+q*.22,1-q*.22);}

  /* ---- jambes ---- */
  const bas=item('bas',L.bas);
  const cbas=bas.id==='cuir'?'#241f22':bas.id==='paillettes'?(Math.sin(t/90)>0?'#f2d24a':'#c9a227'):
    bas.id==='hawai'?'#2ec4c9':bas.id==='kilt'?'#8c2f3f':basC;
  const hBas=(bas.id==='short'||bas.id==='hawai')?Math.min(14,hJ):(bas.id==='kilt'?Math.min(18,hJ):hJ);
  const jx1=-l/2+P.jAr, jx2=1+P.jAv, jw=l/2-1;
  px(g,jx1,-hJ,jw,hJ,peau); px(g,jx2,-hJ,jw,hJ,peau);
  px(g,jx1,-hBas,jw,hBas,cbas); px(g,jx2,-hBas,jw,hBas,cbas);
  px(g,jx1,-hBas,2,hBas,ass(cbas,26)); px(g,jx2,-hBas,2,hBas,ass(cbas,26));
  if(bas.id==='treillis'){px(g,jx1,-hBas+6,jw,4,ass(cbas,20));px(g,jx2+2,-hBas+13,5,5,ass(cbas,14));}
  if(bas.id==='jean'){px(g,jx1,-hBas,jw,2,ass(cbas,-20));px(g,jx2,-hBas,jw,2,ass(cbas,-20));}
  if(bas.id==='survetbas'){px(g,jx1,-hBas,2,hBas,'#f2ece0');px(g,jx2+jw-2,-hBas,2,hBas,'#f2ece0');}
  if(bas.id==='hawai'){for(let i=0;i<3;i++){px(g,jx1+1,-hBas+3+i*4,3,2,'#f26fa8');px(g,jx2+2,-hBas+5+i*4,3,2,'#ffd029');}}
  if(bas.id==='kilt'){for(let i=0;i<4;i++)px(g,-l/2+i*(l/4),-hBas,2,hBas,'#2b2b2b');}
  if(bas.id==='cuissardes'){px(g,jx1,-hJ,jw,hJ,'#6b5b45');px(g,jx2,-hJ,jw,hJ,'#6b5b45');}

  /* ---- chaussures ---- */
  const pd=item('pieds',L.pieds);
  const cch={brodequins:'#3a2a1c',bottes:'#2b3a45',baskets:'#e8e2d4',tongs:'#c94a3a',
    rangers:'#1b1b1b',sabots:'#8a6a3a',santiags:'#d9a520',chaussons:'#b2506a',
    palmes:'#2ec4c9',patins:'#f26fa8'}[pd.id]||'#2b2b2b';
  const hch=pd.id==='bottes'?12:pd.id==='tongs'?3:5;
  px(g,jx1-1,-hch,jw+1,hch,cch); px(g,jx2,-hch,jw+1,hch,cch);
  if(pd.id==='baskets'){px(g,jx1-1,-2,jw+1,2,'#c9331f');px(g,jx2,-2,jw+1,2,'#c9331f');}
  if(pd.id==='santiags'){px(g,jx1-1,-hch,jw+1,2,'#fff0b8');px(g,jx2,-hch,jw+1,2,'#fff0b8');}
  if(pd.id==='palmes'){px(g,jx1-8,-3,jw+8,3,cch);px(g,jx2,-3,jw+8,3,cch);}
  if(pd.id==='patins'){px(g,jx1-1,-2,jw+1,2,'#2b2b2b');px(g,jx2,-2,jw+1,2,'#2b2b2b');
    for(let i=0;i<2;i++){px(g,jx1+i*4,-1,3,2,'#ffd029');px(g,jx2+1+i*4,-1,3,2,'#ffd029');}}

  /* ---- torse ---- */
  const haut=item('haut',L.haut);
  px(g,xT-torse/2,yT,torse,hT+3,peau);
  px(g,xT-torse/2,yT,3,hT+3,peauO);
  px(g,xT+torse/2-3,yT,3,hT+3,peauC);
  // tatouage (visible si torse/marcel)
  if(L.tatouage&&L.tatouage!=='aucun'&&(haut.id==='torse'||haut.id==='marcel'||haut.id==='zebre')){
    const tc='#2f4a6b';
    if(L.tatouage==='ancre'){px(g,xT-2,yT+7,4,9,tc);px(g,xT-5,yT+9,10,2,tc);}
    if(L.tatouage==='etoiles'){px(g,xT-5,yT+7,3,3,tc);px(g,xT+2,yT+11,3,3,tc);px(g,xT-1,yT+16,2,2,tc);}
    if(L.tatouage==='sirene'){px(g,xT-3,yT+6,5,7,tc);px(g,xT-2,yT+13,3,5,'#2e7a6b');}
    if(L.tatouage==='poulpe'){px(g,xT-4,yT+6,8,6,'#7a3a5a');for(let i=0;i<3;i++)px(g,xT-6+i*5,yT+12,2,5,'#7a3a5a');}
    if(L.tatouage==='manchette'){px(g,xT-torse/2,yT,3,hT,'#2f4a6b');px(g,xT-torse/2+1,yT+4,2,3,'#8ab0d0');}
  }
  const met=(cc,la,ha,y0)=>{px(g,xT-la/2,y0,la,ha,cc);px(g,xT-la/2,y0,3,ha,ass(cc,30));px(g,xT+la/2-3,y0,3,ha,ass(cc,-16));};
  switch(haut.id){
    case 'torse':break;
    case 'marcel':met(hautC,torse-7,hT+3,yT);break;
    case 'zebre':met('#f2ece0',torse-7,hT+3,yT);
      for(let i=0;i<5;i++)px(g,xT-torse/2+3,yT+2+i*5,torse-7,2,'#1b1b1b');break;
    case 'chemise':met(hautC,torse,hT+3,yT);px(g,xT-3,yT,6,hT+3,peau);
      px(g,xT-5,yT,3,7,ass(hautC,30));px(g,xT+2,yT,3,7,ass(hautC,30));break;
    case 'hv':met('#f2d024',torse,hT+3,yT);
      px(g,xT-torse/2,yT+9,torse,3,'#e4e4e4');px(g,xT-torse/2,yT+17,torse,3,'#e4e4e4');break;
    case 'marin':met('#f0ece2',torse,hT+3,yT);
      for(let i=0;i<7;i++)px(g,xT-torse/2,yT+2+i*4,torse,2,'#28468c');break;
    case 'cire':met('#f2b134',torse+2,hT+5,yT-1);px(g,xT-torse/2-1,yT+hT,torse+2,3,'#c98a1a');break;
    case 'foot':met(hautC,torse,hT+3,yT);px(g,xT-4,yT+6,8,9,'#f2ece0');
      px(g,xT-2,yT+8,4,5,ass(hautC,40));break;
    case 'tablier':met('#f0ece2',torse,hT+3,yT);px(g,xT-torse/2,yT+12,torse,hT-9,'#2ec4c9');
      px(g,xT-2,yT+2,4,10,'#2ec4c9');break;
    case 'cloute':met('#241f22',torse,hT+3,yT);
      for(let i=0;i<4;i++){px(g,xT-torse/2+3,yT+4+i*6,2,2,'#d8d8d8');px(g,xT+torse/2-5,yT+4+i*6,2,2,'#d8d8d8');}break;
    case 'bomber':met(hautC,torse+2,hT,yT+1);px(g,xT-torse/2-1,yT+hT-1,torse+2,4,'#e8452c');
      px(g,xT-torse/2-1,yT+1,torse+2,3,'#e8452c');break;
    case 'survet':met(hautC,torse,hT+3,yT);px(g,xT-1,yT,2,hT+3,'#f2ece0');
      px(g,xT-torse/2,yT+5,3,hT-4,'#f2ece0');break;
    case 'costume':met('#22262e',torse,hT+3,yT);px(g,xT-4,yT,8,hT+3,'#f0ece2');
      px(g,xT-2,yT+3,4,11,'#b23a48');break;
    case 'franges':met(hautC,torse,hT+3,yT);
      for(let i=0;i<5;i++)px(g,xT-torse/2+i*4,yT+hT+2,2,6+((i%2)*3),ass(hautC,-30));break;
    case 'peignoir':met('#f2ece0',torse+2,hT+5,yT-1);px(g,xT-2,yT,4,hT+4,'#e0d8c6');
      px(g,xT-torse/2-1,yT+hT-3,torse+2,3,'#c9c0aa');break;
    case 'armure':met('#8a8f96',torse+2,hT+3,yT);px(g,xT-torse/2,yT+6,torse,2,'#5f6b72');
      px(g,xT-torse/2,yT+15,torse,2,'#5f6b72');px(g,xT+torse/2-4,yT+2,3,4,'#c9cdd2');break;
    case 'bleu':met(hautC,torse,hT+3,yT);px(g,xT-5,yT+9,10,7,ass(hautC,26));break;
    default:met(hautC,torse,hT+3,yT);
  }

  /* ---- ceinture ---- */
  const ce=item('ceinture',L.ceinture);
  if(ce.id!=='aucune'){
    const cc={cuir:'#3a2a1c',corde:'#b8996a',sangle:'#ffd029',champion:'#f0a020'}[ce.id];
    px(g,xT-torse/2,-hJ-3,torse,4,cc);
    if(ce.id==='champion'){px(g,xT-4,-hJ-5,9,8,'#ffd029');px(g,xT-2,-hJ-3,5,4,'#c9331f');}
  }

  /* ---- dos ---- */
  const dos=item('dos',L.dos);
  if(dos.id==='cape')px(g,xT-torse/2-4,yT+1,5,hT+16,'rgba(40,60,70,.9)');
  if(dos.id==='crochet'){px(g,xT-torse/2-4,yT+9,3,10,'#8a8577');px(g,xT-torse/2-7,yT+17,6,3,'#8a8577');}
  if(dos.id==='sac')px(g,xT-torse/2-6,yT+5,7,17,'#b8996a');
  if(dos.id==='thermos'){px(g,xT-torse/2-5,yT+8,5,13,'#c94a3a');px(g,xT-torse/2-5,yT+8,5,3,'#d8d8d8');}
  if(dos.id==='filet')for(let i=0;i<4;i++)px(g,xT-torse/2-6+i*2,yT+7,1,15,'rgba(232,226,212,.8)');
  if(dos.id==='parapluie'){px(g,xT-torse/2-5,yT+2,2,20,'#2b2b2b');px(g,xT-torse/2-8,yT+1,8,3,'#2b2b2b');}
  if(dos.id==='guitare'){px(g,xT-torse/2-8,yT+6,9,13,'#8c4a2a');px(g,xT-torse/2-6,yT-6,3,13,'#3a2a1c');}
  if(dos.id==='bouteille'){px(g,xT-torse/2-6,yT+3,6,18,'#2e7a6b');px(g,xT-torse/2-5,yT,4,4,'#b8b0a0');}
  if(dos.id==='ailes'){const b=Math.sin(t/160)*2;
    px(g,xT-torse/2-14,yT+2+b,13,4,'#f4f0e6');px(g,xT-torse/2-12,yT+6+b,10,3,'#ddd7c8');}

  /* ---- bras arrière ---- */
  const bl=Math.max(5,c.ep+3);
  const manche=(haut.id==='marcel'||haut.id==='torse'||haut.id==='zebre')?peau:
    haut.id==='hv'?'#f2d024':haut.id==='marin'?'#f0ece2':haut.id==='cire'?'#f2b134':
    haut.id==='cloute'?'#241f22':haut.id==='costume'?'#22262e':haut.id==='peignoir'?'#f2ece0':
    haut.id==='armure'?'#8a8f96':haut.id==='tablier'?'#f0ece2':hautC;
  const mI=item('mains',L.mains);
  const mainC={nues:peau,bandes:'#e8e2d4',mitaines:'#3a2f28',manut:'#b8b0a0',moufles:'#8c4a44',
    boxe:'#e8452c',menage:'#f26fa8',moto:'#241f22',gardien:'#2ec4c9',or:'#e0b020'}[mI.id]||peau;

  px(g,xT-torse/2-bl,yT+5+P.brasAr,bl,15,ass(manche,26));
  px(g,xT-torse/2-bl,yT+19+P.brasAr,6,6,ass(mainC,20));

  /* ---- bras avant + arme ---- */
  const k=f.coup;
  let ext=null,brY=0;
  if(k){
    if(k.t<k.dep)ext=-4;
    else if(k.t<k.dep+k.act)ext=(k.por||30)-14+(k.multi?Math.sin(k.t*.9)*5:0);
    else ext=9-(k.t-k.dep-k.act)*.6;
    brY=k.haut?-12:0;
  }
  if(P.brasLeve){
    px(g,xT+torse/2-1,yT-12,bl,17,manche);
    px(g,xT+torse/2-1,yT-18,7,7,mainC);
    dessinerArme(g,L.arme,xT+torse/2+5,yT-14,t);
  }else if(P.ferme){
    px(g,xT+1,yT-2,bl+3,18,manche);px(g,xT+3,yT-4,8,8,mainC);
    px(g,xT-2,yT+4,bl+2,14,ass(manche,18));
  }else if(ext!==null){
    const e2=Math.max(6,ext);
    px(g,xT+torse/2-2,yT+4+brY,e2,7,manche);
    px(g,xT+torse/2-2+e2,yT+2+brY,8,9,mainC);
    dessinerArme(g,L.arme,xT+torse/2+e2+6,yT+8+brY,t);
    if(k&&k.t>=k.dep&&k.t<k.dep+k.act){
      px(g,xT+torse/2+e2+9,yT-1+brY,4,15,k.multi?'rgba(232,69,44,.55)':'rgba(242,177,52,.45)');
    }
  }else{
    px(g,xT+torse/2-1,yT+5-P.brasAr,bl,15,manche);
    px(g,xT+torse/2-1,yT+19-P.brasAr,7,7,mainC);
    dessinerArme(g,L.arme,xT+torse/2+5,yT+24-P.brasAr,t);
  }

  /* ---- tête ---- */
  const tw=14,th=15,tx=xTete-tw/2,ty=yTete;
  px(g,tx,ty,tw,th,peau);
  px(g,tx,ty,3,th,peauO);
  px(g,tx+tw-2,ty+2,2,th-4,peauC);
  px(g,tx+3,ty+th,tw-6,3,peauO);            // cou
  // oreille
  px(g,tx+1,ty+7,2,3,peauO);
  if(L.boucle==='anneau')px(g,tx,ty+10,2,2,'#c9c3bb');
  if(L.boucle==='creole'){px(g,tx-1,ty+9,3,4,'#f0a020');}
  if(L.boucle==='plume'){px(g,tx-1,ty+10,2,6,'#2ec4c9');}

  // yeux + expression
  const clin=P.clin&&f.etat!=='coup';
  if(clin){px(g,tx+4,ty+7,3,1,peauO);px(g,tx+9,ty+7,3,1,peauO);}
  else{
    px(g,tx+4,ty+6,3,3,'#f2ece0');px(g,tx+9,ty+6,3,3,'#f2ece0');
    const dx=f.etat==='coup'?1:0;
    px(g,tx+5+dx,ty+7,2,2,yeuxC);px(g,tx+10+dx,ty+7,2,2,yeuxC);
  }
  const sourcil=ass(chev,20);
  switch(L.expression){
    case 'decide':px(g,tx+4,ty+4,3,1,sourcil);px(g,tx+9,ty+4,3,1,sourcil);
      px(g,tx+5,ty+11,5,1,peauO);break;
    case 'sourire':px(g,tx+4,ty+3,3,1,sourcil);px(g,tx+10,ty+3,3,1,sourcil);
      px(g,tx+4,ty+11,6,1,peauO);px(g,tx+10,ty+10,1,1,peauO);break;
    case 'serre':px(g,tx+3,ty+4,4,1,sourcil);px(g,tx+9,ty+4,4,1,sourcil);
      px(g,tx+4,ty+11,7,2,'#5a2b28');px(g,tx+5,ty+11,5,1,'#f2ece0');break;
    case 'blase':px(g,tx+4,ty+3,4,1,sourcil);px(g,tx+10,ty+4,3,1,sourcil);
      px(g,tx+5,ty+11,4,1,peauO);break;
    default:px(g,tx+4,ty+3,3,1,sourcil);px(g,tx+9,ty+3,3,1,sourcil);
      px(g,tx+5,ty+11,5,1,peauO);
  }
  if(f.etat==='touche'||f.etat==='ko'){px(g,tx+4,ty+10,6,3,'#7a2b28');}

  // cheveux
  const ch=L.cheveux;
  if(ch!=='chauve'){
    const cc=ch==='flammes'?(Math.sin(t/80)>0?'#f2b134':'#e8452c'):chev;
    px(g,tx-1,ty-2,tw+2,4,cc);
    px(g,tx-1,ty,3,4,cc);
    if(ch==='milong'){px(g,tx-2,ty,3,12,cc);px(g,tx+tw-1,ty,3,10,cc);}
    if(ch==='long'){px(g,tx-2,ty,3,20,cc);px(g,tx+tw-1,ty,3,17,cc);}
    if(ch==='queue'){px(g,tx-4,ty+1,4,3,cc);px(g,tx-7,ty+3,4,9,cc);}
    if(ch==='chignon'){px(g,tx-5,ty-3,6,6,cc);}
    if(ch==='afro')px(g,tx-4,ty-7,tw+8,10,cc);
    if(ch==='crete')px(g,tx+3,ty-9,7,8,cc);
    if(ch==='dreads')for(let i=0;i<4;i++)px(g,tx-2+i*4,ty-1,3,13+((i%2)*5),cc);
    if(ch==='tresses'){px(g,tx-2,ty,3,14,cc);px(g,tx+tw-1,ty,3,14,cc);
      px(g,tx-2,ty+13,3,2,'#e8452c');px(g,tx+tw-1,ty+13,3,2,'#e8452c');}
    if(ch==='banane'){px(g,tx-1,ty-7,tw+4,6,cc);px(g,tx+tw,ty-9,5,4,cc);}
    if(ch==='mulet'){px(g,tx-2,ty+2,3,13,cc);px(g,tx+tw-1,ty+2,3,13,cc);px(g,tx+1,ty+14,tw-2,5,cc);}
    if(ch==='flammes'){px(g,tx+1,ty-8,4,7,cc);px(g,tx+7,ty-10,4,9,cc);}
    if(ch==='ras')px(g,tx-1,ty-1,tw+2,3,cc);
  }

  // barbe
  const cb=ass(chev,8);
  switch(L.barbe){
    case 'ombre':px(g,tx+2,ty+10,tw-3,4,'rgba(40,30,25,.35)');break;
    case 'pleine':px(g,tx+1,ty+9,tw-1,6,cb);px(g,tx+tw-2,ty+5,2,8,cb);px(g,tx+1,ty+5,2,7,cb);break;
    case 'courte':px(g,tx+2,ty+10,tw-3,4,cb);break;
    case 'collier':px(g,tx+1,ty+5,2,10,cb);px(g,tx+tw-2,ty+5,2,10,cb);px(g,tx+2,ty+13,tw-3,2,cb);break;
    case 'bouc':px(g,tx+6,ty+12,4,4,cb);break;
    case 'moust':px(g,tx+5,ty+9,7,2,cb);break;
    case 'bacchantes':px(g,tx+3,ty+9,10,2,cb);px(g,tx+12,ty+8,2,2,cb);px(g,tx+2,ty+8,2,2,cb);break;
    case 'tressee':px(g,tx+1,ty+9,tw-1,5,cb);px(g,tx+5,ty+14,6,8,cb);px(g,tx+5,ty+19,6,2,'#d9a520');break;
    case 'papi':px(g,tx,ty+8,tw,8,'#e2ded4');px(g,tx+3,ty+15,9,12,'#e2ded4');break;
  }

  // visage
  switch(L.visage){
    case 'lunettes':px(g,tx+3,ty+5,tw-4,4,'#1b1b1b');px(g,tx+4,ty+6,3,2,'#3a3a3a');break;
    case 'cicatrice':px(g,tx+11,ty+3,1,8,'#b25a4a');break;
    case 'cloppe':px(g,tx+11,ty+11,8,2,'#f0ece2');px(g,tx+19,ty+11,2,2,'#e8452c');
      px(g,tx+20,ty+8,1,3,'rgba(232,226,212,.5)');break;
    case 'curedent':px(g,tx+11,ty+11,7,1,'#c9a870');break;
    case 'masque':px(g,tx+2,ty+8,tw-3,6,'#e0dcd2');px(g,tx+2,ty+10,tw-3,1,'#b8b0a0');break;
    case 'ski':px(g,tx+2,ty+4,tw-2,6,'#2b2b2b');px(g,tx+4,ty+5,tw-6,3,'#f2b134');break;
    case 'nez':px(g,tx+11,ty+8,3,3,'#e8452c');break;
    case 'cacheoeil':px(g,tx+9,ty+5,5,4,'#1b1b1b');px(g,tx,ty+4,tw,1,'#1b1b1b');break;
    case 'monocle':px(g,tx+9,ty+5,5,5,'#c9c3bb');px(g,tx+10,ty+6,3,3,'rgba(255,255,255,.3)');
      px(g,tx+11,ty+10,1,4,'#c9c3bb');break;
    case 'peinture':px(g,tx+2,ty+5,tw-3,2,'#e8452c');px(g,tx+3,ty+9,4,2,'#2ec4c9');px(g,tx+9,ty+9,4,2,'#2ec4c9');break;
    case 'catch':px(g,tx,ty,tw,th,'#c9331f');px(g,tx+3,ty+6,4,3,'#f2ece0');px(g,tx+9,ty+6,4,3,'#f2ece0');
      px(g,tx+5,ty+11,5,2,'#f2ece0');px(g,tx,ty,3,th,'#8c2320');break;
  }

  // couvre-chef
  switch(L.tete){
    case 'bonnet':px(g,tx-1,ty-5,tw+2,7,'#2b3a45');px(g,tx-1,ty+1,tw+2,3,'#22303a');break;
    case 'casque':px(g,tx-2,ty-6,tw+4,7,'#ffd029');px(g,tx-2,ty+1,tw+8,2,'#e8b81c');
      px(g,tx+3,ty-8,4,3,'#ffd029');break;
    case 'casquette':px(g,tx-1,ty-5,tw+2,6,'#e8452c');px(g,tx+tw,ty+1,9,2,'#c9331f');break;
    case 'envers':px(g,tx-1,ty-5,tw+2,6,'#2ec4c9');px(g,tx-9,ty+1,9,2,'#1f9ba0');break;
    case 'beret':px(g,tx-2,ty-5,tw+4,5,'#1b1b1b');px(g,tx+tw,ty-7,3,3,'#1b1b1b');break;
    case 'foulard':px(g,tx-1,ty-3,tw+2,5,'#f26fa8');px(g,tx-5,ty+2,5,10,'#f26fa8');break;
    case 'bandeau':px(g,tx-1,ty+2,tw+2,3,'#2ec4c9');px(g,tx-7,ty+3,7,2,'#2ec4c9');break;
    case 'bob':px(g,tx-2,ty-5,tw+4,5,'#8fb08a');px(g,tx-6,ty,tw+12,3,'#8fb08a');break;
    case 'paille':px(g,tx-2,ty-5,tw+4,5,'#e8c86a');px(g,tx-9,ty,tw+18,3,'#e8c86a');
      px(g,tx-2,ty-2,tw+4,2,'#b23a48');break;
    case 'pirate':px(g,tx-2,ty-4,tw+4,5,'#1b1b1b');px(g,tx-6,ty+1,6,9,'#1b1b1b');
      px(g,tx+3,ty-3,3,3,'#f2ece0');break;
    case 'seau':px(g,tx-3,ty-9,tw+6,10,'#8a8577');px(g,tx-4,ty-1,tw+8,3,'#6d6a63');break;
    case 'soudeur':px(g,tx-2,ty-6,tw+4,8,'#3a4a52');px(g,tx-2,ty+2,tw+4,10,'#22303a');
      px(g,tx+2,ty+5,tw-3,3,'#2ec4c9');break;
    case 'melon':px(g,tx-1,ty-7,tw+2,7,'#1b1b1b');px(g,tx-5,ty,tw+10,3,'#1b1b1b');break;
    case 'moto':px(g,tx-2,ty-6,tw+4,11,'#e8452c');px(g,tx+4,ty+2,tw-3,5,'#22303a');
      px(g,tx-2,ty-6,tw+4,3,'#f2ece0');break;
    case 'cornes':px(g,tx-1,ty-5,tw+2,6,'#6b5b45');px(g,tx-5,ty-10,4,7,'#e8e2d4');
      px(g,tx+tw+1,ty-10,4,7,'#e8e2d4');break;
    case 'chat':px(g,tx-1,ty-4,tw+2,5,'#2b2b2b');px(g,tx,ty-9,4,6,'#2b2b2b');
      px(g,tx+tw-4,ty-9,4,6,'#2b2b2b');px(g,tx+1,ty-7,2,3,'#f26fa8');break;
    case 'couronne':px(g,tx-2,ty-5,tw+4,5,'#f0a020');px(g,tx-2,ty-9,3,5,'#f0a020');
      px(g,tx+5,ty-11,3,7,'#f0a020');px(g,tx+tw-1,ty-9,3,5,'#f0a020');px(g,tx+6,ty-13,2,2,'#e8452c');break;
    case 'mouette':px(g,tx+1,ty-10,11,6,'#f4f0e6');px(g,tx+9,ty-12,5,4,'#f4f0e6');
      px(g,tx+13,ty-11,3,2,'#f2b134');px(g,tx+11,ty-12,1,1,'#1b1b1b');px(g,tx+1,ty-5,9,2,'#d8d2c4');break;
    case 'aureole':{const b=Math.sin(t/300);px(g,tx,ty-10+b,tw,2,'#ffe98a');
      px(g,tx+2,ty-11+b,tw-4,1,'#fff6c8');break;}
  }
}

/* ------------------------------------------------------- arènes */
const ARENES=[
  {nom:'QUAI DES BELGES',ciel:['#0a1116','#1c2f38'],halo:'#f2b134',sol:'#2a2019',deco:'grue'},
  {nom:'HANGAR 12',      ciel:['#12100f','#2b241d'],halo:'#e8a33a',sol:'#221c17',deco:'hangar'},
  {nom:'MÔLE NORD',      ciel:['#0d1a1f','#20404a'],halo:'#9fd4d8',sol:'#232a2c',deco:'conteneurs'},
  {nom:'AUBE SUR LA DIGUE',ciel:['#2a1a24','#8a5248'],halo:'#ffc98a',sol:'#2e2420',deco:'digue'},
  {nom:'SOUS LA PASSERELLE',ciel:['#0b0f14','#151d26'],halo:'#c9d6c4',sol:'#1d1a18',deco:'passerelle'},
  {nom:'SOMMET DE LA GRUE',ciel:['#05070d','#191033'],halo:'#a48ce0',sol:'#14121a',deco:'sommet'}
];

function dessinerArene(g,n,W,H,SOL,t){
  const a=ARENES[n%ARENES.length];
  const grad=g.createLinearGradient(0,0,0,SOL);
  grad.addColorStop(0,a.ciel[0]);grad.addColorStop(1,a.ciel[1]);
  g.fillStyle=grad;g.fillRect(0,0,W,SOL);
  const h=g.createRadialGradient(392,42,6,392,42,170);
  h.addColorStop(0,a.halo+'40');h.addColorStop(1,a.halo+'00');
  g.fillStyle=h;g.fillRect(180,0,300,SOL);
  // étoiles
  g.fillStyle='rgba(255,255,255,.5)';
  for(let i=0;i<34;i++){const x=(i*97)%W,y=(i*53)%108;
    g.globalAlpha=.25+.35*Math.abs(Math.sin(t/700+i));g.fillRect(x,y,1,1);}
  g.globalAlpha=1;
  // lune
  if(a.deco!=='digue'&&a.deco!=='hangar'){
    g.fillStyle='rgba(244,238,220,.9)';g.beginPath();g.arc(64,38,11,0,7);g.fill();
    g.fillStyle=a.ciel[0];g.beginPath();g.arc(59,34,10,0,7);g.fill();
  }
  // nuages lents
  g.fillStyle='rgba(255,255,255,.045)';
  for(let i=0;i<3;i++){const x=((t/(90+i*40))+i*180)%(W+120)-60;
    g.fillRect(x,26+i*22,72,7);g.fillRect(x+14,20+i*22,44,7);}
  // mouettes
  g.strokeStyle='rgba(242,236,224,.45)';g.lineWidth=1;
  for(let i=0;i<3;i++){
    const x=((t/(55+i*22))+i*150)%(W+60)-30, y=40+i*17+Math.sin(t/380+i)*6,
          o=Math.sin(t/90+i*2)*3;
    g.beginPath();g.moveTo(x-4,y);g.lineTo(x,y-o);g.lineTo(x+4,y);g.stroke();
  }

  const boite=(x,y,w,hh,c)=>{g.fillStyle=c;g.fillRect(x,y,w,hh);
    g.fillStyle='rgba(0,0,0,.24)';for(let i=6;i<w;i+=8)g.fillRect(x+i,y+3,2,hh-6);
    g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x,y,w,2);};

  switch(a.deco){
    case 'grue':{
      g.strokeStyle='#1d2f38';g.lineWidth=5;
      g.beginPath();g.moveTo(96,SOL);g.lineTo(96,44);g.lineTo(238,60);g.stroke();
      g.lineWidth=3;g.beginPath();g.moveTo(96,44);g.lineTo(46,76);g.stroke();
      const o=Math.sin(t/900)*6;
      g.beginPath();g.moveTo(200,57);g.lineTo(200+o,100);g.stroke();
      g.fillStyle='#1d2f38';g.fillRect(190+o,100,20,14);
      boite(24,168,54,46,'#22323a');boite(300,176,40,38,'#27363d');boite(344,182,34,32,'#1e2c33');
      g.fillStyle='#22323a';g.fillRect(389,34,5,SOL-34);
      g.fillStyle='#f2b134';g.fillRect(383,30,17,6);break;
    }
    case 'hangar':{
      g.fillStyle='#1b1611';g.fillRect(0,60,W,SOL-60);
      g.strokeStyle='#2c241c';g.lineWidth=4;
      for(let x=20;x<W;x+=60){g.beginPath();g.moveTo(x,SOL);g.lineTo(x,64);g.stroke();}
      g.fillStyle='#241d16';g.fillRect(0,54,W,10);
      for(let i=0;i<4;i++){g.fillStyle='rgba(232,163,58,.16)';g.fillRect(50+i*110,66,44,26);}
      boite(120,168,60,46,'#2b241d');boite(250,178,50,36,'#332a21');
      g.fillStyle='#3a2f24';g.fillRect(20,150,26,64);break;
    }
    case 'conteneurs':{
      for(let i=0;i<6;i++)boite(6+i*80,116+((i%2)*14),68,SOL-(116+((i%2)*14)),
        ['#1e3a42','#2a4a52','#173036'][i%3]);
      g.fillStyle='#0f2228';g.fillRect(0,108,W,6);
      g.fillStyle='rgba(159,212,216,.12)';g.fillRect(0,SOL-30,W,2);break;
    }
    case 'digue':{
      g.fillStyle='#8a5248';g.fillRect(0,142,W,SOL-142);
      g.fillStyle='#f5b06a';g.beginPath();g.arc(120,142,28,0,7);g.fill();
      g.fillStyle='rgba(255,201,138,.2)';
      for(let y=150;y<SOL;y+=9)g.fillRect(0,y+Math.sin(t/500+y)*1,W,2);
      boite(330,166,44,48,'#3a2b2a');
      g.fillStyle='#2e2420';g.fillRect(0,SOL-6,W,6);break;
    }
    case 'passerelle':{
      g.fillStyle='#10161c';g.fillRect(0,0,W,70);
      g.strokeStyle='#232c34';g.lineWidth=4;
      for(let x=0;x<W;x+=34){g.beginPath();g.moveTo(x,70);g.lineTo(x+17,108);g.lineTo(x+34,70);g.stroke();}
      g.fillStyle='#1a2129';g.fillRect(0,64,W,8);
      boite(40,176,48,38,'#1d242b');boite(378,170,52,44,'#181f25');
      g.fillStyle='rgba(201,214,196,.06)';g.fillRect(150,0,40,SOL);break;
    }
    case 'sommet':{
      g.strokeStyle='#231a40';g.lineWidth=3;
      for(let x=-20;x<W;x+=46){g.beginPath();g.moveTo(x,SOL);g.lineTo(x+30,116);g.stroke();}
      g.fillStyle='#1a1330';g.fillRect(0,112,W,8);
      g.strokeStyle='rgba(164,140,224,.22)';g.lineWidth=1;
      for(let i=0;i<8;i++){g.beginPath();g.moveTo(60+i*50,0);g.lineTo(30+i*50,112);g.stroke();}
      g.fillStyle='rgba(255,255,255,.5)';
      for(let i=0;i<20;i++)g.fillRect((i*83)%W,(i*37)%90,1,1);break;
    }
  }
  // public : silhouettes de dockers qui bougent au fond
  const nuit=a.deco!=='digue';
  for(let i=0;i<22;i++){
    const x=6+i*22+((i%3)*4), b=Math.sin(t/(300+i*17)+i)*1.6;
    const hh=16+((i*7)%9);
    g.fillStyle=nuit?'rgba(8,12,16,.72)':'rgba(50,28,26,.6)';
    g.fillRect(x,SOL-hh+b,9,hh);
    g.beginPath();g.arc(x+4.5,SOL-hh+b-2,4,0,7);g.fill();
    if(i%4===0){ // bras levés
      g.fillRect(x-3,SOL-hh-4+b,3,8);g.fillRect(x+9,SOL-hh-4-b,3,8);
    }
  }
  g.fillStyle=a.halo+'10';g.fillRect(0,SOL-26,W,26);

  g.fillStyle=a.sol;g.fillRect(0,SOL,W,H-SOL);
  g.fillStyle='rgba(255,255,255,.06)';g.fillRect(0,SOL,W,3);
  g.fillStyle='rgba(0,0,0,.22)';
  for(let x=0;x<W;x+=24)g.fillRect(x,SOL+9,12,2);
  g.fillStyle=a.halo+'14';g.fillRect(0,SOL+22,W,3);

  // premier plan : caisses et cordages, hors du champ de combat
  g.fillStyle='rgba(6,9,12,.9)';
  g.fillRect(0,H-30,26,30);g.fillRect(W-30,H-34,30,34);
  g.fillStyle='rgba(255,255,255,.05)';g.fillRect(0,H-30,26,2);g.fillRect(W-30,H-34,30,2);
  g.strokeStyle='rgba(6,9,12,.85)';g.lineWidth=3;
  g.beginPath();g.moveTo(-4,H-26);g.quadraticCurveTo(W/2,H-12,W+4,H-30);g.stroke();

  // vignette
  const v=g.createRadialGradient(W/2,H/2,90,W/2,H/2,290);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');
  g.fillStyle=v;g.fillRect(0,0,W,H);
}

global.BDF={RARETES,TEINTS,CHEVEUX_C,YEUX_C,VESTE_C,BAS_C,CAT,RUBRIQUES,ONGLETS,POSTES,
  ADVERSAIRES,ARENES,item,lookDefaut,statsDe,dessinerDocker,dessinerArme,dessinerArene,px,ass};
})(window);
