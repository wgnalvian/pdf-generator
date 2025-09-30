// src/routes/pdf-designer/$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Designer, Viewer } from "@pdfme/ui";
import type { Template } from "@pdfme/common";
import { BLANK_A4_PDF } from "@pdfme/common";
import { text, image, barcodes } from "@pdfme/schemas";
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
  image,
  barcode: barcodes["code128"],
};

const baseTemplate: Template = {
  basePdf: BLANK_A4_PDF,
  schemas: [[
    {
      type: "text",
      name: "placeholder",
      position: { x: 0, y: 0 },
      width: 1,
      height: 1,
    },
  ]],
  sampledata: [],
};

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

    const newTemplate = {
      ...baseTemplate,
    };

    setTemplate(newTemplate);
    if (containerRef.current) {
      console.log("containerRef.current2", containerRef.current);
      const designer = new Designer({
        domContainer: containerRef.current,
        template: {
          ...newTemplate,
          basePdf: layoutPdf,
        },
        options: {
          lang: "en",
          mode: "designer",
        },
        plugins,
      });
      designer.onChangeTemplate((t) => handleTemplateChange(t));
    }

    if (previewRef.current) {

      viewerRef.current = new Viewer({
        domContainer: previewRef.current,
        template: newTemplate,
        plugins,
        inputs: (newTemplate.sampledata) || [],
      });
    }
  }, [layoutPdf]);

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
