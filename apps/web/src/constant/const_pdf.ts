import { BLANK_A4_PDF } from "@pdfme/common";
import type { Template } from "@pdfme/common";
import type { OptionSimpleSelect } from "@/components/simple-select";

export const OptionsLayoutPDF: OptionSimpleSelect<Template['basePdf']>[] = [
  {
    label: 'A4 - Potrait',
    value: BLANK_A4_PDF,
  },
  {
    label: 'FOLIO - Potrait',
    value: {
      ...BLANK_A4_PDF,
      height: 330,
      width: 215,
    }
  },
  {
    label: 'Letter (US) - Potrait',
    value: {
      ...BLANK_A4_PDF,
      width: 216,
      height: 279
    }
  },
  {
    label: 'A4 - Landscape',
    value: {
      ...BLANK_A4_PDF,
      height: BLANK_A4_PDF.width,
      width: BLANK_A4_PDF.height,
    },
  },
  {
    label: 'FOLIO - Landscape',
    value: {
      ...BLANK_A4_PDF,
      height: 215,
      width: 330,
    }
  },
  {
    label: 'Letter (US) - Landscape',
    value: {
      ...BLANK_A4_PDF,
      width: 279,
      height: 216,
    }
  },
];
