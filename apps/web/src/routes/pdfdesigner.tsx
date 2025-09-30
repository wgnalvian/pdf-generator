// src/routes/pdf-designer/$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Designer, Viewer } from "@pdfme/ui";
import type { Template } from "@pdfme/common";
import { BLANK_A4_PDF } from "@pdfme/common";
import { useEffect, useRef, useState } from "react";
import HeadToolbarPdf from "@/components/head-toolbar-pdf";
import {
  text,
  image,
  barcodes,
  table,
  line,
  ellipse,
  checkbox,
  date,
  dateTime,
  radioGroup,
  select,
  svg,
  time,
  multiVariableText,
  rectangle
} from "@pdfme/schemas";

const plugins = {
  text,
  image,
  table,
  line,
  ellipse,
  checkbox,
  date,
  dateTime,
  radioGroup,
  select,
  svg,
  time,
  multiVariableText,
  rectangle,
  ...barcodes,
}

const baseTemplate: Template = {
  basePdf: BLANK_A4_PDF,
  schemas: [[]],
  sampledata: [],
};

export const Route = createFileRoute("/pdfdesigner")({
  component: PdfDesignerPage,
});

function PdfDesignerPage() {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [template, setTemplate] = useState<Template>(baseTemplate);
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

  return (
    <div className="h-screen w-screen flex flex-col">
      <HeadToolbarPdf
        template={template}
        layoutPdf={layoutPdf}
        setLayoutPdf={setLayoutPdf}
      />
      <div className="flex-row flex">
        <div ref={containerRef} className="flex-1" />
        {/* <div ref={previewRef} className="flex-1" /> */}
      </div>
    </div>
  );
}
