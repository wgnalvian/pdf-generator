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
    } as any,
  ]],
  sampledata: [],
};

export const Route = createFileRoute("/pdfdesigner")({
  component: PdfDesignerPage,
});

function PdfDesignerPage() {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [templatee, setTemplate] = useState<Template>(baseTemplate);
  const saveTemplateMutation = useMutation(trpc.saveTemplate.mutationOptions());

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
        template: newTemplate as any,
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
        template: newTemplate as any,
        plugins,
        inputs: (newTemplate.sampledata as any) || [],
      });
    }
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
      template: templatee,

    }).then(() => {
      toast.success("Template saved successfully");
    }).catch((error) => {
      toast.error(error.message);
    });
  };

  const handleDownload = async () => {
  
    const pdf = await generate({
      template: templatee as any,
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

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-4 bg-gray-200 flex justify-end">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Download PDF
        </button>
        <button
          onClick={handleSaveTemplate}
          className="px-4 py-2 bg-blue-500 text-white rounded ml-4"
        >
          Save Template
        </button>
      </div>
      <div className="flex-row flex">
        <div ref={containerRef} className="flex-1" />
        {/* <div ref={previewRef} className="flex-1" /> */}
      </div>
    </div>
  );
}
