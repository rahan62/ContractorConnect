"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CityOption {
  id: string;
  plateCode: number;
  nameTr: string;
}

interface DistrictOption {
  id: string;
  nameTr: string;
}

export function ContractLocationFields({
  cityId,
  districtId,
  onCityChange,
  onDistrictChange,
  disabled
}: {
  cityId: string;
  districtId: string;
  onCityChange: (id: string) => void;
  onDistrictChange: (id: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("contractLocation");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    void fetch("/api/cities")
      .then(r => (r.ok ? r.json() : []))
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (!cityId) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    void fetch(`/api/cities/${cityId}/districts`)
      .then(r => (r.ok ? r.json() : []))
      .then(setDistricts)
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [cityId]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("fields.city")}</label>
        <select
          className="mt-1 app-input"
          required
          disabled={disabled}
          value={cityId}
          onChange={e => {
            onCityChange(e.target.value);
            onDistrictChange("");
          }}
        >
          <option value="">{t("fields.selectCity")}</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>
              {c.plateCode} — {c.nameTr}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("fields.district")}</label>
        <select
          className="mt-1 app-input"
          required
          disabled={disabled || !cityId || loadingDistricts}
          value={districtId}
          onChange={e => onDistrictChange(e.target.value)}
        >
          <option value="">{loadingDistricts ? t("fields.loadingDistricts") : t("fields.selectDistrict")}</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>
              {d.nameTr}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">{t("fields.districtHint")}</p>
      </div>
    </div>
  );
}
