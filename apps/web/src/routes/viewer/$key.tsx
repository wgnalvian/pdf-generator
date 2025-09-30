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
import type { UserPreview } from "../../../../server/src/types";

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

export const Route = createFileRoute("/viewer/$key")({
  component: PdfDesignerPage,
});

function PdfDesignerPage() {
  const { key } = Route.useParams();
  const userQuery = useQuery(trpc.getUserByKey.queryOptions({ key }));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [templatee, setTemplate] = useState<Template>(baseTemplate);
  const [isOpenModalPassword, setIsOpenModalPassword] = useState(false);
  const validatePasswordByKey = useMutation(trpc.validatePasswordByKey.mutationOptions());
  const [password, setPassword] = useState("");
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

    setIsOpenModalPassword((userQuery.data as any).isHavePassword);
    setTemplate(newTemplate);
    if (containerRef.current) {
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
          field1: "data:image/png;base64,iVBORw0K...", // logo sekolah
          field2: "PERGURUAN ISLAM AL-AZHAR KELAPA GADING - SURABAYA",
          field3: "SMPI AL-AZHAR KELAPA GADING SURABAYA",
          field4: "", // ini line, jadi bisa kosong
          table: [
            ["1", "Rabaniyah", "SB", "Sangat Baik"],
            ["2", "Insaniyah", "SB", "Sangat Baik"],
          ],
          field6: "A. Karakter Pengembangan",
          field7: "RAPOR DAN PROFILE PESERTA DIDIK",
          field8: "Nama Peserta Didik   :", 
          field9: "Syifa Lusiani",
          "field8 copy": "NISN                             :",
          "field9 copy": "01110",
          "field8 copy 2": "Kelas                            :",
          "field8 copy 3": "Fase                             :",
          "field9 copy 2": "A",
          "field9 copy 3": "IV",
        },
      ]
    });
    
    const blob = new Blob([pdf.buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "my-document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitPassword = async(e: React.FormEvent) => {
    e.preventDefault();
    await validatePasswordByKey.mutateAsync({ key, password })
    .then(() => {
      toast.success("Password is correct");
      setIsOpenModalPassword(false);
    }).catch((error) => {
      toast.error(error.message);
    })
  };

  if (userQuery.isLoading) {
    return <p className="p-4">Loading user...</p>;
  }

  if (userQuery.error) {
    return <p className="p-4 text-red-500">Failed: {userQuery.error.message}</p>;
  }

  return (
    <div className="h-screen w-screen flex flex-col relative">

      {/* Overlay Modal */}
      {isOpenModalPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Enter Password
            </h2>
            <form onSubmit={handleSubmitPassword}>
              <input
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
              />

              <div className="mt-4 flex justify-end gap-2">
                {/* <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button> */}
                <button
                  onClick={(e) => handleSubmitPassword(e)}
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-200 flex justify-end">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Download PDF
        </button>

      </div>
      <div className="flex-row flex">
        {/* <div ref={containerRef} className="flex-1" /> */}
        <div ref={previewRef} className="flex-1" />
      </div>
    </div>
  );
}
