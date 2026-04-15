"use client";

import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { uploadFileToStorage } from "@/lib/upload-client";

type UploadField =
  | "signatureAuthDocUrl"
  | "taxCertificateDocUrl"
  | "tradeRegistryGazetteDocUrl"
  | "logoUrl"
  | "bannerUrl";

export default function CompanyPage() {
  const t = useTranslations("company");

  const [form, setForm] = useState({
    companyName: "",
    bio: "",
    logoUrl: "",
    bannerUrl: "",
    companyTaxOffice: "",
    companyTaxNumber: "",
    authorizedPersonName: "",
    authorizedPersonPhone: "",
    signatureAuthDocUrl: "",
    taxCertificateDocUrl: "",
    tradeRegistryGazetteDocUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<UploadField | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/company");
      if (res.ok) {
        const data = await res.json();
        setForm({
          companyName: data.companyName ?? "",
          bio: data.bio ?? "",
          logoUrl: data.logoUrl ?? "",
          bannerUrl: data.bannerUrl ?? "",
          companyTaxOffice: data.companyTaxOffice ?? "",
          companyTaxNumber: data.companyTaxNumber ?? "",
          authorizedPersonName: data.authorizedPersonName ?? "",
          authorizedPersonPhone: data.authorizedPersonPhone ?? "",
          signatureAuthDocUrl: data.signatureAuthDocUrl ?? "",
          taxCertificateDocUrl: data.taxCertificateDocUrl ?? "",
          tradeRegistryGazetteDocUrl: data.tradeRegistryGazetteDocUrl ?? ""
        });
      }
      setLoading(false);
    }
    void load();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleFileChange(field: UploadField, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    const folder =
      field === "logoUrl" || field === "bannerUrl" ? "company-branding" : "company-documents";

    setUploadingField(field);
    setUploadError(null);

    try {
      const data = await uploadFileToStorage(file, folder);
      const url = data.url ?? data.key;
      if (!url) {
        throw new Error(t("messages.uploadFailed"));
      }

      update(field as keyof typeof form, url as never);
      setMessage(t("messages.fileUploaded"));
    } catch (err: any) {
      setUploadError(err.message ?? t("messages.uploadFailed"));
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setSaving(false);
    setMessage(res.ok ? t("messages.saved") : t("messages.saveFailed"));
  }

  if (loading) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="app-page space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="app-card space-y-4 p-4 sm:p-6">
        <div className="app-inset space-y-3">
          <h2 className="text-sm font-semibold">{t("brandingTitle")}</h2>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("companyName")}</label>
            <input
              className="mt-1 app-input"
              value={form.companyName}
              onChange={e => update("companyName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("bio")}</label>
            <textarea
              className="mt-1 min-h-[6rem] app-input"
              rows={4}
              value={form.bio}
              onChange={e => update("bio", e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium">{t("logo")}</label>
              <input
                type="file"
                className="mt-1 text-sm"
                onChange={e => handleFileChange("logoUrl", e.target.files)}
              />
              {form.logoUrl && (
                <img src={form.logoUrl} alt={t("logo")} className="mt-2 h-16 w-16 rounded border object-cover" />
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">{t("banner")}</label>
              <input
                type="file"
                className="mt-1 text-sm"
                onChange={e => handleFileChange("bannerUrl", e.target.files)}
              />
              {form.bannerUrl && (
                <img src={form.bannerUrl} alt={t("banner")} className="mt-2 h-20 w-full rounded border object-cover" />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("taxOffice")}</label>
            <input
              className="mt-1 app-input"
              value={form.companyTaxOffice}
              onChange={e => update("companyTaxOffice", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("taxNumber")}</label>
            <input
              className="mt-1 app-input"
              value={form.companyTaxNumber}
              onChange={e => update("companyTaxNumber", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("authorizedName")}</label>
            <input
              className="mt-1 app-input"
              value={form.authorizedPersonName}
              onChange={e => update("authorizedPersonName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("authorizedPhone")}</label>
            <input
              className="mt-1 app-input"
              value={form.authorizedPersonPhone}
              onChange={e => update("authorizedPersonPhone", e.target.value)}
            />
          </div>
        </div>

        <div className="app-inset space-y-3">
          <h2 className="text-sm font-semibold">{t("documentsTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("documentsHint")}</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">{t("signatureDoc")}</label>
              <input type="file" className="mt-1 text-sm" onChange={e => handleFileChange("signatureAuthDocUrl", e.target.files)} />
              {form.signatureAuthDocUrl && <a href={form.signatureAuthDocUrl} target="_blank" rel="noreferrer" className="block text-xs text-primary underline">{t("viewCurrentFile")}</a>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">{t("taxCertificateDoc")}</label>
              <input type="file" className="mt-1 text-sm" onChange={e => handleFileChange("taxCertificateDocUrl", e.target.files)} />
              {form.taxCertificateDocUrl && <a href={form.taxCertificateDocUrl} target="_blank" rel="noreferrer" className="block text-xs text-primary underline">{t("viewCurrentFile")}</a>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">{t("tradeRegistryGazetteDoc")}</label>
              <input type="file" className="mt-1 text-sm" onChange={e => handleFileChange("tradeRegistryGazetteDocUrl", e.target.files)} />
              {form.tradeRegistryGazetteDocUrl && <a href={form.tradeRegistryGazetteDocUrl} target="_blank" rel="noreferrer" className="block text-xs text-primary underline">{t("viewCurrentFile")}</a>}
            </div>
            {uploadingField && (
              <p className="text-xs text-muted-foreground">
                {uploadingField === "signatureAuthDocUrl"
                  ? t("uploadingSignature")
                  : uploadingField === "taxCertificateDocUrl"
                  ? t("uploadingTax")
                  : uploadingField === "tradeRegistryGazetteDocUrl"
                  ? t("uploadingGazette")
                  : uploadingField === "logoUrl"
                  ? t("uploadingLogo")
                  : t("uploadingBanner")}
                ...
              </p>
            )}
            {uploadError && <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
          </div>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </form>
    </section>
  );
}
