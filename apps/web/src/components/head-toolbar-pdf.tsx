import React, { useState } from 'react';
import SimpleSelect from "./simple-select";
import type { Template } from "@pdfme/common";
import { OptionsLayoutPDF } from "@/constant/const_pdf";
import { handleCopyTemplate } from "@/utils/tools";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { generate } from "@pdfme/generator";
import { text, image, barcodes } from "@pdfme/schemas";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import TextInput from './text-input';


const plugins = {
  text,
  image,
  barcode: barcodes["code128"],
};

interface HeadToolbarPDFProps {
  template: Template,
  layoutPdf: Template['basePdf'],
  setLayoutPdf: React.Dispatch<Template['basePdf']>
}

export default function HeadToolbarPdf(props: HeadToolbarPDFProps) {
  const saveTemplateMutation = useMutation(trpc.saveTemplate.mutationOptions());
  const [templateName, setTemplateName] = useState<string>("");

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
    const pdf = await generate({
      template: props.template,
      plugins,
      inputs: [
        {
          logo: await loadImageAsBase64("/ijazah.jpg"),
          name: "",
        },
      ],
    });
    const blob = new Blob([pdf.buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName || "my-document"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = async () => {

    await saveTemplateMutation.mutateAsync({
      name: templateName || 'document',
      template: props.template,
    }).then(() => {
      toast.success("Template saved successfully");
    }).catch((error) => {
      toast.error(error.message);
    });
  };

  return (
    <div className="p-4 bg-gray-200 flex justify-between items-center">
      <div className="flex w-1/2 gap-2 items-center">
        <SimpleSelect<Template['basePdf']>
          label="Layout"
          options={OptionsLayoutPDF}
          value={props.layoutPdf}
          onChange={(val) => {
            props.setLayoutPdf(val);
          }}
          serialize={(val) => JSON.stringify(val)}
          deserialize={(val) => JSON.parse(val)}
        />
        <TextInput
          label="Template Name"
          value={templateName}
          onChange={setTemplateName}
          placeholder="Masukkan nama template..."
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
  );
}
