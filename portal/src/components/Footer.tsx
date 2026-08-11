import cbs from "#/assets/cbs-brand.jpg";
import cd2 from "#/assets/cd2-logo.png";
import dans from "#/assets/DANS_Logo_RGB-medium.jpg";
import dataverse from "#/assets/DataverseNL-logo-1.png";
import hsn from "#/assets/HSN.png";
import liss from "#/assets/LISS-Panel-Logo-RGB_V2_LISS-geel-panel-byCenterdata.png";
import { m } from "#/paraglide/messages";

export function Footer() {
  return (
    <footer className="p-4 md:p-10 text-sm text-slate-500 flex flex-col gap-6 md:gap-10 lg:gap-16 items-center justify-center">
      <div className="max-w-3xl">
        <h2 className="mb-3 text-lg font-semibold text-zinc-700">{m.footerTitle()}</h2>
        <p className="mb-3 text-sm leading-5 text-zinc-600">{m.footerParagraph1()}</p>
        <p className="text-sm leading-5 text-zinc-600">{m.footerParagraph2()}</p>
      </div>
      <div className="flex gap-14 justify-center items-center flex-wrap">
        <img src={cbs} alt="CBS" className="h-20" />
        <img src={cd2} alt="CD2" className="h-20" />
        <img src={dans} alt="DANS" className="h-20" />
        <img src={dataverse} alt="DataverseNL" className="h-20" />
        <img src={hsn} alt="HSN" className="h-20" />
        <img src={liss} alt="LISS" className="h-20" />
      </div>
    </footer>
  );
}
