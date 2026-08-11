import logo from "#/assets/odissei-logo.png";
import { m } from "#/paraglide/messages";
import ParaglideLocaleSwitcher from "./LocaleSwitcher";

export default function Header() {
  return (
    <section className="relative overflow-hidden bg-white p-6">
      <div className="absolute right-4 top-4 md:right-6 md:top-6">
        <ParaglideLocaleSwitcher compact />
      </div>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        <img src={logo} alt="ODISSEI Portal logo" className="h-14 w-auto shrink-0" />
        <div className="max-w-3xl">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-950">
            {m.welcomeToTheOdisseiPortal()}
          </h1>
          <p className="mb-3 text-sm leading-5 text-zinc-600">{m.welcomeParagraph1()}</p>
          <p className="text-sm leading-5 text-zinc-600">{m.welcomeParagraph2()}</p>
        </div>
      </div>
    </section>
  );
}
