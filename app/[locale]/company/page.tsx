"use client";

import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";

interface CompanyContract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startsAt: string | null;
  totalDays: number | null;
  imageUrls: string | null;
  createdAt: string;
}

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
  const [userType, setUserType] = useState<string | null>(null);
  const [contracts, setContracts] = useState<CompanyContract[]>([]);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState({
    title: "",
    description: "",
    startsAt: "",
    totalDays: "",
    status: "DRAFT"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
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
        setUserType(data.userType ?? null);
        setContracts(data.contractsCreated ?? []);
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

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);

    setUploadingField(field);
    setUploadError(null);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await res.json();
      const url = data.url ?? data.path ?? data.key;
      if (!url) {
        throw new Error("Upload response did not contain file URL");
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

  function startEditing(contract: CompanyContract) {
    setEditingContractId(contract.id);
    setContractForm({
      title: contract.title,
      description: contract.description ?? "",
      startsAt: contract.startsAt ? contract.startsAt.slice(0, 10) : "",
      totalDays: contract.totalDays ? String(contract.totalDays) : "",
      status: contract.status
    });
  }

  async function saveContract(contractId: string) {
    setSavingContract(true);
    setMessage(null);

    const res = await fetch(`/api/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: contractForm.title,
        description: contractForm.description,
        startsAt: contractForm.startsAt || null,
        totalDays: contractForm.totalDays ? parseInt(contractForm.totalDays, 10) : null,
        status: contractForm.status
      })
    });

    setSavingContract(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.message ?? t("contracts.messages.updateFailed"));
      return;
    }

    const updated = await res.json();
    setContracts(prev =>
      prev.map(contract =>
        contract.id === contractId
          ? {
              ...contract,
              title: updated.title,
              description: updated.description,
              startsAt: updated.startsAt,
              totalDays: updated.totalDays,
              status: updated.status
            }
          : contract
      )
    );
    setEditingContractId(null);
    setMessage(t("contracts.messages.updated"));
  }

  async function deleteContract(contractId: string) {
    const confirmed = window.confirm(t("contracts.messages.confirmDelete"));
    if (!confirmed) return;

    const res = await fetch(`/api/contracts/${contractId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.message ?? t("contracts.messages.deleteFailed"));
      return;
    }

    setContracts(prev => prev.filter(contract => contract.id !== contractId));
    setMessage(t("contracts.messages.deleted"));
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-3 rounded-md border p-3">
          <h2 className="text-sm font-semibold">{t("brandingTitle")}</h2>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("companyName")}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.companyName}
              onChange={e => update("companyName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("bio")}</label>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
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
                <img src={form.logoUrl} alt="Logo" className="mt-2 h-16 w-16 rounded border object-cover" />
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
                <img src={form.bannerUrl} alt="Banner" className="mt-2 h-20 w-full rounded border object-cover" />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("taxOffice")}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.companyTaxOffice}
              onChange={e => update("companyTaxOffice", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("taxNumber")}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.companyTaxNumber}
              onChange={e => update("companyTaxNumber", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("authorizedName")}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.authorizedPersonName}
              onChange={e => update("authorizedPersonName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("authorizedPhone")}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.authorizedPersonPhone}
              onChange={e => update("authorizedPersonPhone", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-md border p-3">
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
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          </div>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </form>

      {userType === "CONTRACTOR" && (
        <section className="space-y-4 rounded-lg border bg-card p-4">
          <div>
            <h2 className="text-lg font-semibold">{t("contracts.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("contracts.hint")}
            </p>
          </div>

          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("contracts.empty")}</p>
          ) : (
            <div className="space-y-4">
              {contracts.map(contract => {
                const hero = contract.imageUrls?.split(";").filter(Boolean)[0];
                const isEditing = editingContractId === contract.id;

                return (
                  <div key={contract.id} className="overflow-hidden rounded-xl border">
                    <div className="h-40 w-full overflow-hidden border-b bg-slate-100">
                      {hero ? (
                        <img src={hero} alt={contract.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-slate-50">
                          <img src="/taseron_logo.png" alt="Taseron" className="h-16 w-16 rounded-md opacity-70" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-4">
                      {isEditing ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-sm font-medium">{t("contracts.fields.title")}</label>
                            <input
                              className="w-full rounded border px-3 py-2 text-sm"
                              value={contractForm.title}
                              onChange={e => setContractForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-sm font-medium">{t("contracts.fields.description")}</label>
                            <textarea
                              rows={4}
                              className="w-full rounded border px-3 py-2 text-sm"
                              value={contractForm.description}
                              onChange={e => setContractForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium">{t("contracts.fields.startDate")}</label>
                            <input
                              type="date"
                              className="w-full rounded border px-3 py-2 text-sm"
                              value={contractForm.startsAt}
                              onChange={e => setContractForm(prev => ({ ...prev, startsAt: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium">{t("contracts.fields.totalDays")}</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full rounded border px-3 py-2 text-sm"
                              value={contractForm.totalDays}
                              onChange={e => setContractForm(prev => ({ ...prev, totalDays: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium">{t("contracts.fields.status")}</label>
                            <select
                              className="w-full rounded border px-3 py-2 text-sm"
                              value={contractForm.status}
                              onChange={e => setContractForm(prev => ({ ...prev, status: e.target.value }))}
                            >
                              <option value="DRAFT">{t("contracts.statuses.DRAFT")}</option>
                              <option value="OPEN_FOR_BIDS">{t("contracts.statuses.OPEN_FOR_BIDS")}</option>
                              <option value="ACTIVE">{t("contracts.statuses.ACTIVE")}</option>
                              <option value="COMPLETED">{t("contracts.statuses.COMPLETED")}</option>
                              <option value="CANCELLED">{t("contracts.statuses.CANCELLED")}</option>
                            </select>
                          </div>
                          <div className="flex items-end gap-2">
                            <button
                              type="button"
                              onClick={() => void saveContract(contract.id)}
                              disabled={savingContract}
                              className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                            >
                              {savingContract ? t("contracts.messages.saving") : t("contracts.actions.save")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingContractId(null)}
                              className="rounded border px-3 py-2 text-sm"
                            >
                              {t("contracts.actions.cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold">{contract.title}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {contract.description ?? t("contracts.noDescription")}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(contract)}
                                className="rounded border px-3 py-2 text-sm font-medium hover:bg-slate-50"
                              >
                                {t("contracts.actions.edit")}
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteContract(contract.id)}
                                className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
                              >
                                {t("contracts.actions.delete")}
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="rounded-full border px-3 py-1">
                              {t("contracts.badges.status")}: {t(`contracts.statuses.${contract.status}` as any)}
                            </span>
                            <span className="rounded-full border px-3 py-1">
                              {contract.startsAt
                                ? `${t("contracts.badges.start")}: ${new Date(contract.startsAt).toLocaleDateString()}`
                                : t("contracts.badges.noStart")}
                            </span>
                            <span className="rounded-full border px-3 py-1">
                              {contract.totalDays
                                ? `${contract.totalDays} ${t("contracts.badges.days")}`
                                : t("contracts.badges.noDuration")}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
