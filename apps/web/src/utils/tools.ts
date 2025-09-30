import { toast } from "sonner";

export const handleCopyTemplate = async (data: Object) => {
    try {
      const text = JSON.stringify(data, null, 2);
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
