import { createFileRoute } from "@tanstack/react-router"
// src/routes/pdf/$id.tsx
import { Designer, Viewer } from "@pdfme/ui";
import type { Template } from "@pdfme/common";
import { BLANK_A4_PDF } from "@pdfme/common";
import { text, image, barcodes } from "@pdfme/schemas";
import { use, useEffect, useRef, useState } from "react";
import { generate } from "@pdfme/generator";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

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

interface QParamsToken {
  q?: string;
}

export const Route = createFileRoute("/pdf/$id")({
  component: PdfPage,
});

function PdfPage() {
  const { id } = Route.useParams();
  const searchParams = Route.useSearch();
  const token = (searchParams as QParamsToken)?.q || '';
  // const userQuery = useQuery(trpc.getUserById.queryOptions({ id }));
  const userQuery = useQuery(trpc.getIsValidView.queryOptions({
    token: token,
    idUser: id,
  }));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [templatee, setTemplate] = useState<Template>(baseTemplate);
  const [password, setPassword] = useState("");
  const [isOpenModalPassword, setIsOpenModalPassword] = useState(false);
  const validatePasswordByKey = useMutation(trpc.validatePasswordByKey.mutationOptions());
  const router = useRouter()
  const createTemplateSession = useMutation(trpc.createTemplateSessions.mutationOptions(
    {
      onSuccess: () => {
        toast.success("Access granted");
      },
      onError: (error) => {
        toast.error(error.message);
        if (error.message.includes('reached the maximum number')) {
          router.history.back()
        }
      }
    }
  ));

  const handleTemplateChange = (newTemplate: Template) => {
    setTemplate(newTemplate);
    if (viewerRef.current) {
      viewerRef.current.updateTemplate(newTemplate);
    }
  };

  useEffect(() => {
    if (!userQuery.data) return;

    if (!userQuery.data.isHavePassword) {
      handleCreateTemplateSession();
    }

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
    console.log("containerRef.current1");
    if (containerRef.current) {
      console.log("containerRef.current2", containerRef.current);
      const designer = new Designer({
        domContainer: containerRef.current,
        template: newTemplate,
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

  const handleCreateTemplateSession = () => {
    createTemplateSession.mutate({
      token: token,
    });
  };

  const handleSubmitPassword = async(e: React.FormEvent) => {
    e.preventDefault();
    await validatePasswordByKey.mutateAsync({ key : token, password })
    .then(() => {
      toast.success("Password is correct");
      handleCreateTemplateSession();
      setIsOpenModalPassword(false);
    }).catch((error) => {
      toast.error(error.message);
    })
  };

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
