import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  CheckCheck,
  ClipboardList,
  Flag,
  Menu,
  Shield,
  Smartphone,
  Users,
  WifiOff,
} from "lucide-react";
import MatchPreview from "@/components/landing/MatchPreview";
import styles from "@/components/landing/landing.module.css";

export const metadata: Metadata = {
  title: "CoachFlow — Votre équipe. Votre match. Le fil du jeu.",
  description:
    "Préparez votre équipe, suivez vos matchs de football et retrouvez les statistiques des joueurs. Le carnet Terrain vous accompagne aussi sans réseau, après préparation.",
  openGraph: {
    title: "CoachFlow — Gardez le fil du match",
    description:
      "Effectif, feuille de match, direct et statistiques : les essentiels du coach de football, sur ordinateur, mobile et tablette.",
    locale: "fr_FR",
    type: "website",
  },
};

const workflow = [
  {
    icon: ClipboardList,
    title: "Préparez votre équipe.",
    text: "Retrouvez votre effectif et composez votre feuille de match. Dans le carnet Terrain, un appui suffit pour sélectionner un joueur.",
    points: [
      "Présences et composition",
      "Numéro et poste des joueurs",
      "11 premiers sélectionnés titulaires",
    ],
  },
  {
    icon: Flag,
    title: "Restez dans le match.",
    text: "Notez les moments qui comptent au bord du terrain. Chaque événement garde sa minute et les joueurs concernés.",
    points: [
      "Buts et passes décisives",
      "Remplacements et cartons",
      "Zone et partie du corps, si utile",
    ],
  },
  {
    icon: BarChart3,
    title: "Retrouvez les repères.",
    text: "Après un match terminé et synchronisé, consultez le bilan de l’équipe et les statistiques individuelles pour préparer la suite.",
    points: [
      "Résultats et bilan de l’équipe",
      "Présences, buts et passes par joueur",
      "Historique et filtres de période",
    ],
  },
];
const questions = [
  {
    title: "À qui s’adresse CoachFlow ?",
    text: "Aux coachs et responsables de clubs de football qui veulent organiser leur effectif, préparer leurs matchs et suivre les actions sans multiplier les outils. Cette première version se concentre sur ces usages essentiels.",
  },
  {
    title: "Comment commencer ?",
    text: "Créez votre compte, connectez-vous, puis créez votre club et votre équipe. Ajoutez vos joueurs et programmez un premier match. Vous pourrez ensuite préparer les présences et la composition.",
  },
  {
    title: "Est-ce que je peux continuer sans réseau ?",
    text: "Oui, dans le carnet Terrain, après avoir préparé le match avec Internet sur le même appareil. Gardez ce carnet comme écran de match, même si vous avez du réseau au départ. Le direct classique ne bascule pas automatiquement vers le hors-ligne.",
  },
  {
    title: "Que deviennent les actions saisies hors ligne ?",
    text: "Elles sont enregistrées dans ce navigateur, sur votre appareil. Au retour du réseau, gardez le carnet ouvert pour synchroniser et vérifiez la confirmation d’enregistrement sur CoachFlow. N’effacez pas les données du navigateur et ne changez pas d’appareil avant la synchronisation.",
  },
  {
    title: "Puis-je utiliser mon téléphone ou ma tablette ?",
    text: "Oui, l’interface s’adapte à l’ordinateur, à la tablette et au mobile. Pour le carnet hors ligne, utilisez un navigateur récent et compatible, préparez le match en ligne et suivez-le sur un seul appareil.",
  },
  {
    title: "Qu’est-ce qui est disponible dans cette version ?",
    text: "Les clubs et équipes, la gestion des joueurs, la préparation des matchs, le direct, les statistiques et le carnet Terrain.",
  },
];

function Brand() {
  return (
    <>
      <Shield
        className={styles.logoIcon}
        strokeWidth={1.7}
        aria-hidden="true"
      />
      <span>CoachFlow</span>
    </>
  );
}

export default function Home() {
  return (
    <div className={styles.landing}>
      <a className={styles.skip} href="#contenu">
        Aller au contenu
      </a>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <a href="/" className={styles.logo} aria-label="CoachFlow, accueil">
            <Brand />
          </a>
          <nav className={styles.nav} aria-label="Navigation principale">
            <a href="#parcours">Le parcours match</a>
            <a href="#terrain">Sur le terrain</a>
            <a href="#questions">Questions</a>
          </nav>
          <div className={styles.headerActions}>
            <a href="/login">Se connecter</a>
            <a href="/register" className={styles.headerCta}>
              Créer mon espace
            </a>
          </div>
          <details className={styles.mobileMenu}>
            <summary>
              <Menu size={18} aria-hidden="true" />
              Menu
            </summary>
            <nav aria-label="Navigation mobile">
              <a href="#parcours">Le parcours match</a>
              <a href="#terrain">Sur le terrain</a>
              <a href="#questions">Questions fréquentes</a>
              <a href="/login">Se connecter</a>
              <a href="/register">
                Créer mon espace <ArrowRight size={15} aria-hidden="true" />
              </a>
            </nav>
          </details>
        </div>
      </header>
      <main id="contenu" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div>
                <p className={styles.eyebrow}>
                  Au service des coachs de football
                </p>
                <h1 id="hero-title">
                  Votre équipe.
                  <br />
                  Votre match.
                  <br />
                  <em>Le fil du jeu.</em>
                </h1>
                <p className={styles.heroText}>
                  Préparez votre groupe, notez les actions et retrouvez le
                  bilan. Les essentiels du coach, réunis pour le bord du
                  terrain.
                </p>
                <div className={styles.heroActions}>
                  <a href="/register" className={styles.primary}>
                    Créer mon espace <ArrowRight size={17} aria-hidden="true" />
                  </a>
                  <a href="#parcours" className={styles.secondary}>
                    Découvrir le parcours{" "}
                    <ArrowDown size={16} aria-hidden="true" />
                  </a>
                </div>
                <p className={styles.heroNote}>
                  <Check size={14} aria-hidden="true" />
                  Une première version centrée sur votre quotidien.
                </p>
              </div>
              <MatchPreview />
            </div>
            <div className={styles.heroFoot}>
              <span>
                <Users size={17} aria-hidden="true" />
                Clubs et équipes
              </span>
              <span>
                <Smartphone size={17} aria-hidden="true" />
                Mobile, tablette et ordinateur
              </span>
              <span>
                <WifiOff size={17} aria-hidden="true" />
                Carnet Terrain utilisable hors ligne après préparation
              </span>
            </div>
          </div>
        </section>
        <section
          id="parcours"
          className={`${styles.section} ${styles.light}`}
          aria-labelledby="parcours-title"
        >
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Avant. Pendant. Après.</p>
                <h2 id="parcours-title">
                  Du premier nom coché
                  <br />
                  au dernier coup de sifflet.
                </h2>
              </div>
              <p>
                Un match ne se résume pas au score. CoachFlow garde ensemble
                l’effectif, la feuille de match et les actions pour vous aider à
                retrouver ce qui s’est passé.
              </p>
            </div>
            <div className={styles.workflow}>
              {workflow.map((step, index) => (
                <article className={styles.workflowItem} key={step.title}>
                  <span>0{index + 1}</span>
                  <step.icon
                    className={styles.workflowIcon}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <ul>
                    {step.points.map((point) => (
                      <li key={point}>
                        <Check size={14} aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          id="terrain"
          className={styles.section}
          aria-labelledby="terrain-title"
        >
          <div className={`${styles.container} ${styles.terrainGrid}`}>
            <div className={styles.terrainText}>
              <p className={styles.eyebrow}>Le carnet Terrain</p>
              <h2 id="terrain-title">
                Le réseau peut lâcher.
                <br />
                Gardez le fil du match.
              </h2>
              <p>
                Préparez votre carnet avec Internet, puis utilisez-le tout au
                long du match. Vos actions sont enregistrées sur cet appareil
                avant d’être synchronisées avec CoachFlow.
              </p>
              <ol className={styles.connectionSteps}>
                <li>
                  <span>01</span>
                  <div>
                    <strong>Avant de partir, préparez le match.</strong>
                    <p>
                      Ouvrez le mode Terrain depuis la fiche du match et
                      attendez la confirmation « Prêt hors ligne ».
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Sur place, continuez dans le carnet.</strong>
                    <p>
                      Avec ou sans réseau, saisissez les actions sur le même
                      appareil. Vous pouvez fermer puis rouvrir le carnet
                      préparé.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Au retour du réseau, synchronisez.</strong>
                    <p>
                      Gardez le carnet ouvert et vérifiez la confirmation
                      d’enregistrement avant de consulter les statistiques.
                    </p>
                  </div>
                </li>
              </ol>
              <a href="#questions" className={styles.secondary}>
                Comprendre le hors-ligne{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div>
              <div className={styles.terrainBoard}>
                <div className={styles.boardTop}>
                  <span
                    style={{
                      color: "#c7d4e5",
                      background: "none",
                      border: 0,
                      padding: 0,
                    }}
                  >
                    CARNET DE MATCH
                  </span>
                  <span>
                    <WifiOff size={13} aria-hidden="true" />
                    Hors ligne
                  </span>
                </div>
                <div className={styles.boardScore}>
                  <small>FC HORIZON · AS RIVAGE</small>
                  <strong>2 – 1</strong>
                  <span>62e minute · le match continue</span>
                </div>
                <div className={styles.boardAction}>
                  <CheckCheck size={23} aria-hidden="true" />
                  <div>
                    <strong>Enregistré sur cet appareil</strong>
                    <small>But de Noa B. · passe de Sam D.</small>
                  </div>
                </div>
                <p className={styles.boardNote}>
                  Les actions attendent le retour du réseau.
                  <br />
                  Un match préparé, un seul appareil, le même navigateur.
                </p>
              </div>
              <p className={styles.demoCaption}>
                Exemple illustratif · données fictives
              </p>
            </div>
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.detailsSection}`}
          aria-label="Les repères de votre équipe"
        >
          <div className={`${styles.container} ${styles.detailsGrid}`}>
            <article className={styles.detail}>
              <Users strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h3>Un effectif que l’on retrouve.</h3>
                <p>
                  Recherchez un joueur, filtrez votre liste et ouvrez sa fiche.
                  Numéro, poste, présences et statistiques restent accessibles
                  au même endroit, avec un historique conservé après archivage.
                </p>
              </div>
            </article>
            <article className={styles.detail}>
              <BarChart3 strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h3>Une vue d’ensemble pour la suite.</h3>
                <p>
                  Depuis le dashboard, retrouvez le match en cours, le prochain
                  rendez-vous et le bilan de l’équipe. Les matchs terminés et
                  synchronisés alimentent les statistiques des joueurs.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section
          id="questions"
          className={`${styles.section} ${styles.light}`}
          aria-labelledby="questions-title"
        >
          <div className={`${styles.container} ${styles.faqGrid}`}>
            <div className={styles.faqIntro}>
              <p className={styles.eyebrow}>Les points utiles</p>
              <h2 id="questions-title">Avant le coup d’envoi.</h2>
              <p>
                Quelques réponses pour prendre en main cette première version et
                utiliser le carnet Terrain dans de bonnes conditions.
              </p>
            </div>
            <div className={styles.faq}>
              {questions.map((question) => (
                <details key={question.title}>
                  <summary>{question.title}</summary>
                  <p>{question.text}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.cta} aria-labelledby="start-title">
          <div className={`${styles.container} ${styles.ctaInner}`}>
            <div>
              <p className={styles.eyebrow}>À vous de jouer</p>
              <h2 id="start-title">
                Votre prochain match
                <br />
                commence ici.
              </h2>
              <p>
                Créez votre compte, ajoutez votre équipe et préparez une
                première feuille de match. Prenez vos repères, à votre rythme.
              </p>
            </div>
            <a href="/register" className={styles.primary}>
              Créer mon espace <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <a className={styles.logo} href="/" aria-label="CoachFlow, accueil">
            <Brand />
          </a>
          <span>
            © {new Date().getFullYear()} CoachFlow · Un projet Quantum Code
          </span>
          <nav
            className={styles.footerLinks}
            aria-label="Liens de pied de page"
          >
            <a href="/login">Se connecter</a>
            <a href="https://www.quantum-code.fr/">
              Quantum Code <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
