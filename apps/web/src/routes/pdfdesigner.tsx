// src/routes/pdf-designer/$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Designer, Viewer } from "@pdfme/ui";
import type { Template } from "@pdfme/common";
import { BLANK_A4_PDF } from "@pdfme/common";
import { text, image, barcodes, table, line } from "@pdfme/schemas";
import { useEffect, useRef, useState } from "react";
import { generate } from "@pdfme/generator";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import SimpleSelect, { type OptionSimpleSelect } from "@/components/simple-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

const plugins = {
  text,
  table,
  line,
  image,
  barcode: barcodes["code128"],
};

async function loadFont(path:string) {
  const response = await fetch(path);
  const arrayBuffer = await response.arrayBuffer();
  return arrayBuffer; // langsung kirim ArrayBuffer
}

const baseTemplate: Template = {
  "basePdf": {
      "width": 210,
      "height": 297,
      "padding": [
          10,
          10,
          10,
          10
      ]
  },
  "schemas": [
      [
          {
              "name": "field1",
              "type": "image",
              "width": 27.25,
              "height": 26.99,
              "rotate": 0,
              "content": "/al.png",
              "opacity": 1,
              "position": {
                  "x": 10,
                  "y": 10
              },
              "required": false
          },
          {
              "name": "field2",
              "type": "text",
              "width": 154.52,
              "height": 10.05,
              "rotate": 0,
              "content": "PERGURUAN ISLAM AL-AZHAR KELAPA GADING - SURABAYA",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 45.47999999999999,
                  "y": 12.65
              },
              "required": false,
              "alignment": "center",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "middle",
              "fontName" : "Poppins"
          },
          {
              "name": "field3",
              "type": "text",
              "width": 148.96,
              "height": 10.05,
              "rotate": 0,
              "content": "SMPI AL-AZHAR KELAPA GADING SURABAYA",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 47.04,
                  "y": 23.49
              },
              "required": false,
              "alignment": "center",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "middle"
          },
          {
              "name": "field4",
              "type": "line",
              "color": "#000000",
              "width": 189.71,
              "height": 0.53,
              "rotate": 0,
              "content": "",
              "opacity": 1,
              "position": {
                  "x": 10.03,
                  "y": 36.76
              },
              "readOnly": true,
              "required": false
          },
          {
              "head": [
                  "No",
                  "Dimensi",
                  "Predikat",
                  "Keterangan"
              ],
              "name": "table",
              "type": "table",
              "width": 184.68,
              "height": 43.75920000000001,
              "content": "[[\"1\",\"Rabaniyah\",\"SB\",\"Sangat Baik\"],[\"2\",\"Insaniyah\",\"SB\",\"Sangat Baik\"]]",
              "position": {
                  "x": 12.42,
                  "y": 84.34
              },
              "readOnly": false,
              "required": false,
              "showHead": true,
              "bodyStyles": {
                  "padding": {
                      "top": 5,
                      "left": 5,
                      "right": 5,
                      "bottom": 5
                  },
                  "fontName": "Roboto",
                  "fontSize": 13,
                  "alignment": "left",
                  "fontColor": "#000000",
                  "lineHeight": 1,
                  "borderColor": "#000000",
                  "borderWidth": {
                      "top": 0.3,
                      "left": 0.3,
                      "right": 0.3,
                      "bottom": 0.3
                  },
                  "backgroundColor": "",
                  "characterSpacing": 0,
                  "verticalAlignment": "middle",
                  "alternateBackgroundColor": "#f5f5f5"
              },
              "headStyles": {
                  "padding": {
                      "top": 5,
                      "left": 5,
                      "right": 5,
                      "bottom": 5
                  },
                  "fontName": "Roboto",
                  "fontSize": 13,
                  "alignment": "left",
                  "fontColor": "#ffffff",
                  "lineHeight": 1,
                  "borderColor": "#000000",
                  "borderWidth": {
                      "top": 0.3,
                      "left": 0.3,
                      "right": 0.3,
                      "bottom": 0.3
                  },
                  "backgroundColor": "#87CB42",
                  "characterSpacing": 0,
                  "verticalAlignment": "middle"
              },
              "tableStyles": {
                  "borderColor": "#000000",
                  "borderWidth": 0.3
              },
              "columnStyles": {},
              "headWidthPercentages": [
                  15,
                  25,
                  20,
                  40
              ]
          },
          {
              "name": "field6",
              "type": "text",
              "width": 75.67,
              "height": 7.14,
              "rotate": 0,
              "content": "A. Karakter Pengembangan",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 13.97,
                  "y": 75.09
              },
              "required": false,
              "alignment": "left",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field7",
              "type": "text",
              "width": 86.78,
              "height": 10.05,
              "rotate": 0,
              "content": "RAPOR DAN PROFILE PESERTA DIDIK",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 68.21,
                  "y": 40.16
              },
              "required": false,
              "alignment": "left",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field8",
              "type": "text",
              "width": 44.98,
              "height": 5.82,
              "rotate": 0,
              "content": "Nama Peserta Didik   :",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 12.12,
                  "y": 53.39
              },
              "required": false,
              "alignment": "left",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field9",
              "type": "text",
              "width": 44.98,
              "height": 6.88,
              "rotate": 0,
              "content": "Syifa Lusiani",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 59.75,
                  "y": 52.85
              },
              "required": false,
              "alignment": "left",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field8 copy",
              "type": "text",
              "width": 44.98,
              "height": 5.82,
              "rotate": 0,
              "content": "NISN                             :",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 12.59,
                  "y": 61.27
              },
              "required": false,
              "alignment": "left",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field9 copy",
              "type": "text",
              "width": 44.98,
              "height": 6.88,
              "rotate": 0,
              "content": "01110",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 60.75,
                  "y": 61.26
              },
              "required": false,
              "alignment": "left",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field8 copy 2",
              "type": "text",
              "width": 44.98,
              "height": 5.82,
              "rotate": 0,
              "content": "Kelas                            :",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 121.34,
                  "y": 54.13
              },
              "required": false,
              "alignment": "left",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field8 copy 3",
              "type": "text",
              "width": 44.98,
              "height": 5.82,
              "rotate": 0,
              "content": "Fase                             :",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 121.81,
                  "y": 62.01
              },
              "required": false,
              "alignment": "left",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field9 copy 2",
              "type": "text",
              "width": 24.34,
              "height": 6.88,
              "rotate": 0,
              "content": "A",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 173.28,
                  "y": 54.12
              },
              "required": false,
              "alignment": "right",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          },
          {
              "name": "field9 copy 3",
              "type": "text",
              "width": 24.34,
              "height": 6.88,
              "rotate": 0,
              "content": "IV",
              "opacity": 1,
              "fontSize": 13,
              "position": {
                  "x": 173.49,
                  "y": 63.06
              },
              "required": false,
              "alignment": "right",
              "fontColor": "#000000",
              "underline": false,
              "lineHeight": 1,
              "strikethrough": false,
              "backgroundColor": "",
              "characterSpacing": 0,
              "verticalAlignment": "top"
          }
      ]
  ],
  "pdfmeVersion": "5.4.5"
}


const optionLayoutPdf: OptionSimpleSelect<Template['basePdf']>[] = [
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

export const Route = createFileRoute("/pdfdesigner")({
  component: PdfDesignerPage,
});

function PdfDesignerPage() {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [template, setTemplate] = useState<Template>(baseTemplate);
  const saveTemplateMutation = useMutation(trpc.saveTemplate.mutationOptions());
  const [layoutPdf, setLayoutPdf] = useState<Template['basePdf']>(baseTemplate.basePdf);


  const handleTemplateChange = (newTemplate: Template) => {
    setTemplate(newTemplate);
    if (viewerRef.current) {
      viewerRef.current.updateTemplate(newTemplate);
    }
  };

  useEffect(() => {
    const init = async () => {
      const poppins = await loadFont("/tes.ttf");
      const roboto = await loadFont("/roboto.ttf");
      const newTemplate: Template = {
        ...baseTemplate,
        fonts: {   // ✅ di pdfme property-nya `fonts`, bukan `font`
          Poppins: {
            data: poppins,
            fallback: true,
          },
        },
      };

      setTemplate(newTemplate);

      if (containerRef.current) {
        const designer = new Designer({
          domContainer: containerRef.current,
          template: newTemplate as any,
          options: {
            lang: "en",
            mode: "designer",
            // font :{   // ✅ di pdfme property-nya `fonts`, bukan `font`
            //   Poppins: {
            //     data: poppins,
            //     fallback: true,
            //   },
            // },
          },
          plugins,
        });
        designer.onChangeTemplate((t) => handleTemplateChange(t));
        designer.updateOptions({ font : { 
          Poppins: { data: poppins, fallback: true } ,
          Roboto: { data: roboto, fallback: true } 
        } });
      }


      if (previewRef.current) {
        viewerRef.current = new Viewer({
          domContainer: previewRef.current,
          template: newTemplate as any,
          plugins,
          inputs: [{}],
        });
      }
    };

    init();
  }, []);

  async function loadImageAsBase64(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const handleSaveTemplate = async () => {

    await saveTemplateMutation.mutateAsync({
      name: `ijazah`,
      template: template,
    }).then(() => {
      toast.success("Template saved successfully");
    }).catch((error) => {
      toast.error(error.message);
    });
  };

  const handleDownload = async () => {

    const pdf = await generate({
      template: template,
      plugins,
      inputs: [
        {
          logo: await loadImageAsBase64("/ijazah.jpg"),
          name: "Syifa",
        },
      ],
    });
    const blob = new Blob([pdf.buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "my-document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyTemplate = async () => {
      try {
        const text = JSON.stringify(template, null, 2);
        // jika clipboard API tersedia
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // fallback: gunakan textarea & execCommand
          const ta = document.createElement("textarea");
          ta.value = text;
          // jangan tampilkan di UI
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        toast.success("Template JSON berhasil disalin ke clipboard");
      } catch (err: any) {
        console.error("Copy template failed:", err);
        toast.error("Gagal menyalin template: " + (err?.message || String(err)));
      }
    };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-4 bg-gray-200 flex justify-between items-center">
        <div className="w-1/2">
          <SimpleSelect<Template['basePdf']>
            label="Layout"
            options={optionLayoutPdf}
            value={layoutPdf}
            onChange={(val) => {
              setLayoutPdf(val);
            }}
            serialize={(val) => JSON.stringify(val)}
            deserialize={(val) => JSON.parse(val)}
          />
        </div>
        <div className="flex justify-end items-center w-1/2 gap-4">
          <button
            onClick={handleCopyTemplate}
            className="bg-white p-2 border border-black rounded text-black">
            <FontAwesomeIcon icon={faCopy} />
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Download PDF
          </button>
          <button
            onClick={handleSaveTemplate}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Save Template
          </button>
        </div>
      </div>
      <div className="flex-row flex">
        <div ref={containerRef} className="flex-1" />
        {/* <div ref={previewRef} className="flex-1" /> */}
      </div>
    </div>
  );
}
