import cbs from "#/assets/cbs-brand.jpg";
import cd2 from "#/assets/cd2-logo.png";
import dans from "#/assets/DANS_Logo_RGB-medium.jpg";
import dataverse from "#/assets/DataverseNL-logo-1.png";
import hsn from "#/assets/HSN.png";
import liss from "#/assets/LISS-Panel-Logo-RGB_V2_LISS-geel-panel-byCenterdata.png";
import { m } from "#/paraglide/messages";

export default function Footer() {
  return (
    <footer className="text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
      <div className="max-w-3xl p-4 md:p-10 ">
        <h2 className="mb-3 text-lg font-semibold">{m.footerTitle()}</h2>
        <p className="mb-3 text-sm">{m.footerParagraph1()}</p>
        <p className="text-sm">{m.footerParagraph2()}</p>
      </div>
      <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />
      <div className="flex gap-8 md:gap-14 justify-center items-center flex-wrap p-4 md:p-10">
        <img src={cbs} alt="CBS" className="h-14 md:h-20" />
        <img src={cd2} alt="CD2" className="h-14 md:h-20" />
        <img src={dans} alt="DANS" className="h-14 md:h-20" />
        <img src={dataverse} alt="DataverseNL" className="h-14 md:h-20" />
        <img src={hsn} alt="HSN" className="h-14 md:h-20" />
        <img src={liss} alt="LISS" className="h-14 md:h-20" />
      </div>
    </footer>
  );
}
