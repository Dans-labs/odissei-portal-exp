import logo from "#/assets/odissei-logo-180.png";
import ParaglideLocaleSwitcher from "./LocaleSwitcher";

export default function Header() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="flex items-center max-w-[1600px] w-full mx-auto justify-between gap-4 px-4 py-2 md:gap-8 md:px-8 md:py-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ODISSEI Portal logo" className="h-14 w-auto shrink-0" />
          <h1 className="text-3xl font-bold text-cyan-700">ODISSEI Portal</h1>
        </div>
        <ParaglideLocaleSwitcher compact />
      </div>
    </section>
  );
}
