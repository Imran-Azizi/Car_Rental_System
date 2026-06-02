"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getKabulMonthOptions, getKabulMonthValue } from "@/lib/utils";

export default function MonthSelector({
  className = "",
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedMonth = searchParams?.get("month") || getKabulMonthValue();
  const options = useMemo(() => {
    const items = getKabulMonthOptions(12);
    const searchValue = searchParams?.get("month");
    if (searchValue && !items.some((item) => item.value === searchValue)) {
      items.unshift({ value: searchValue, label: searchValue });
    }
    return items;
  }, [searchParams]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const month = event.currentTarget.value;
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (month) {
      params.set("month", month);
    } else {
      params.delete("month");
    }

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        htmlFor="month-selector"
        className="text-[11px] font-semibold text-slate-500 hidden sm:inline"
      >
        ماه
      </label>
      <select
        id="month-selector"
        value={selectedMonth}
        onChange={handleChange}
        className="rounded-xl border border-amber-200 bg-white/95 text-amber-900 text-sm px-3 py-2 shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
