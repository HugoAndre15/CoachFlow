"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, Ellipsis, LayoutDashboard, PanelLeftClose, PanelLeftOpen,
  Radio, Search, Shield, Users, UsersRound,
} from "lucide-react";
import RosterDialog from "@/app/dashboard/joueurs/parts/RosterDialog";

const pages = [
  { name: "Vue d’équipe", short: "Équipe", keywords: "tableau de bord dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Matchs", short: "Matchs", href: "/dashboard/matchs", icon: CalendarDays },
  { name: "Direct", short: "Direct", href: "/dashboard/direct", icon: Radio },
  { name: "Joueurs", short: "Joueurs", keywords: "effectif", href: "/dashboard/joueurs", icon: Users },
  { name: "Mes équipes", short: "Équipes", href: "/dashboard/teams", icon: UsersRound },
  { name: "Mes clubs", short: "Clubs", href: "/dashboard/clubs", icon: Shield },
];
const mainPages = pages.slice(0, 4);
const management = pages.slice(4);

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
  const searchTerm = normalize(query);
  const filteredPages = pages.filter(page => normalize(page.name + " " + (page.keywords ?? "")).includes(searchTerm));
  const openMenu = () => { setQuery(""); setSearchOpen(true); };
  const entry = (page: typeof pages[number], compact = false, mobile = false) => (
    <Link key={page.href} href={page.href} className="nav-entry"
      aria-current={active(page.href) ? "page" : undefined} title={compact ? page.name : undefined}
      aria-label={page.name} onClick={() => setSearchOpen(false)}>
      <page.icon size={20} strokeWidth={1.8} aria-hidden="true" />
      {!compact && <span>{mobile ? page.short : page.name}</span>}
    </Link>
  );

  return (
    <>
      <aside className="workspace-rail" data-compact={collapsed}>
        <Link className="workspace-brand" href="/" aria-label="CoachFlow, accueil">
          <Shield size={27} strokeWidth={1.9} aria-hidden="true" />
          {!collapsed && <span>CoachFlow</span>}
        </Link>
        <nav aria-label="Navigation principale">
          {mainPages.map(page => entry(page, collapsed))}
          <hr />
          {management.map(page => entry(page, collapsed))}
        </nav>
        <div className="rail-tools">
          <button type="button" className="nav-entry" onClick={openMenu} aria-label="Rechercher une page" title="Rechercher une page">
            <Search size={19} aria-hidden="true" />{!collapsed && "Rechercher une page"}
          </button>
          <button type="button" className="nav-entry" onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"} title={collapsed ? "Agrandir le menu" : "Réduire le menu"}>
            {collapsed ? <PanelLeftOpen size={19} /> : <><PanelLeftClose size={19} />Réduire le menu</>}
          </button>
        </div>
      </aside>
      <nav className="workspace-bottom" aria-label="Navigation mobile">
        {mainPages.map(page => entry(page, false, true))}
        <button type="button" className="nav-entry" onClick={openMenu} aria-haspopup="dialog"
          aria-expanded={searchOpen} data-active={management.some(page => active(page.href))}>
          <Ellipsis size={20} aria-hidden="true" /><span>Plus</span>
        </button>
      </nav>
      {searchOpen && (
        <RosterDialog title="Navigation" onClose={() => setSearchOpen(false)}>
          <label className="workspace-search">
            <Search size={18} aria-hidden="true" />
            <input type="search" value={query} aria-label="Rechercher une page" placeholder="Rechercher une page"
              onChange={event => setQuery(event.target.value)} />
          </label>
          <nav className="workspace-links" aria-label="Toutes les pages">
            {filteredPages.map(page => entry(page))}
            {!filteredPages.length && <p>Aucune page trouvée.</p>}
          </nav>
        </RosterDialog>
      )}
    </>
  );
}
