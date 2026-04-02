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
        throw new Error(t("messages.uploadFailed"));
      }

      const data = await res.json();
      const url = data.url ?? data.path ?? data.key;
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

      {userType === "CONTRACTOR" && (
        <section className="app-card space-y-4 p-4 sm:p-6">
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
                  <div key={contract.id} className="app-card-sm overflow-hidden">
                    <div className="h-40 w-full overflow-hidden border-b border-border/50 app-hero-placeholder">
                      {hero ? (
                        <img src={hero} alt={contract.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="app-hero-placeholder-inner h-full">
                          <img src="/favicon.svg" alt="" className="h-16 w-16 rounded-md opacity-90" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-4">
                      {isEditing ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-sm font-medium">{t("contracts.fields.title")}</label>
                            <input
                              className="app-input"
                              value={contractForm.title}
                              onChange={e => setContractForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-sm font-medium">{t("contracts.fields.description")}</label>
                            <textarea
                              rows={4}
                              className="min-h-[6rem] app-input"
                              value={contractForm.description}
                              onChange={e => setContractForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium">{t("contracts.fields.startDate")}</label>
                            <input
                              type="date"
                              className="app-input"
                              value={contractForm.startsAt}
                              onChange={e => setContractForm(prev => ({ ...prev, startsAt: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium">{t("contracts.fields.totalDays")}</label>
                            <input
                              type="number"
                              min="1"
                              className="app-input"
                              value={contractForm.totalDays}
                              onChange={e => setContractForm(prev => ({ ...prev, totalDays: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium">{t("contracts.fields.status")}</label>
                            <select
                              className="app-input"
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
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <button
                              type="button"
                              onClick={() => void saveContract(contract.id)}
                              disabled={savingContract}
                              className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground sm:w-auto"
                            >
                              {savingContract ? t("contracts.messages.saving") : t("contracts.actions.save")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingContractId(null)}
                              className="w-full rounded border px-3 py-2 text-sm sm:w-auto"
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
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <button
                              type="button"
                              onClick={() => startEditing(contract)}
                              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/40 sm:w-auto"
                            >
                                {t("contracts.actions.edit")}
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteContract(contract.id)}
                                className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 sm:w-auto"
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
