// src/routes/pdf/$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Designer, Viewer } from "@pdfme/ui";
import type { Template } from "@pdfme/common";
import { BLANK_A4_PDF } from "@pdfme/common";
import { text, image, barcodes } from "@pdfme/schemas";
import { useEffect, useRef, useState } from "react";
import { generate } from "@pdfme/generator";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

const plugins = {
  text,
  image,
  barcode: barcodes["code128"],
};

const baseTemplate: Template = {
  basePdf: BLANK_A4_PDF,
  schemas: [[
    {
      type: "image",
      name: "logo",
      position: { x: 0, y: 0 },
      width: 200,
      height: 100,
    } as any,
    {
      type: "text",
      name: "name",
      position: { x: 0, y: 42 },
      width: 200,
      height: 10,
      alignment: "center",
      verticalAlignment: "middle",
    } as any,
  ]],
  sampledata: [],
};

export const Route = createFileRoute("/pdf/$id")({
  component: PdfPage,
});

function PdfPage() {
  const { id } = Route.useParams();
  const userQuery = useQuery(trpc.getUserById.queryOptions({ id }));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [templatee, setTemplate] = useState<Template>(baseTemplate);

  const handleTemplateChange = (newTemplate: Template) => {
    setTemplate(newTemplate);
    if (viewerRef.current) {
      viewerRef.current.updateTemplate(newTemplate);
    }
  };

  useEffect(() => {
    if (!userQuery.data) return;

    const newTemplate = {
      ...baseTemplate,
      sampledata: [
        {
          logo: "/ijazah.jpg",
          name: userQuery.data.name ?? "No Name",
        },
      ],
    };

    setTemplate(newTemplate);
    console.log("containerRef.current1");
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
  }, [userQuery.data]);

  async function loadImageAsBase64(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const handleDownload = async () => {
    if (!userQuery.data) return;
    const pdf = await generate({
      template: templatee as any,
      plugins,
      inputs: [
        {
          logo: await loadImageAsBase64("/ijazah.jpg"),
          name: userQuery.data.name ?? "No Name",
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

  if (userQuery.isLoading) {
    return <p className="p-4">Loading user...</p>;
  }

  if (userQuery.error) {
    return <p className="p-4 text-red-500">Failed: {userQuery.error.message}</p>;
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-2 bg-gray-200 flex justify-end">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Download PDF
        </button>
      </div>
      <div className="flex-row flex">
        <div ref={previewRef} className="flex-1" />
      </div>
    </div>
  );
}
