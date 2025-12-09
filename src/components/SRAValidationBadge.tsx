'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { getOrganization } from "@/lib/getSettings";

interface SRAValidationBadgeProps {
  websiteUrl?: string;
}

const SRAValidationBadge: React.FC<SRAValidationBadgeProps> = ({
  websiteUrl,
}) => {
  const [website, setWebsite] = useState("");
  const [today, setToday] = useState("");

  // Fixed SRA constants for Osbourne Pinner
  const sraNumber = "083082065";
  const logoAlt = "EnglishColour";
  const logoFile = "Default.png";

  // Format date in UK style: 9 December 2025
  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    setToday(now.toLocaleDateString("en-GB", options));
  }, []);

  // Fetch organization domain from database
  useEffect(() => {
    async function loadDomain() {
      let domain = websiteUrl;

      if (!domain) {
        try {
          const org = await getOrganization();
          domain = org?.domains?.[0] || "/";
        } catch {
          domain = "/";
        }
      }

      // Normalize domain format
      if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
        domain = `https://${domain}`;
      }
      if (!domain.endsWith("/")) {
        domain += "/";
      }
      setWebsite(domain);
    }
    loadDomain();
  }, [websiteUrl]);

  // Convert string to 3-digit padded decimal format
  const toDecimal = (str: string): string =>
    str
      .split("")
      .map((c) => c.charCodeAt(0).toString(10).padStart(3, "0"))
      .join("");

  if (!website) return null;

  // Build SRA validation URL
  const validationString = `${sraNumber}+${toDecimal(logoAlt)}+${toDecimal(logoFile)}+${toDecimal(website)}`;
  const validationUrl = `https://www.sra.org.uk/validation?${validationString}&UGxEQk3X8u9ULZ%2bhoSXp9oWyEd2kRo7CfHZP4eInbrU%3d`;

  return (
    <a
      href={validationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-[200px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      aria-label="Click to verify with the Solicitors Regulation Authority"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Image
            src="https://cdn.jsdelivr.net/gh/lawfirm-badges/sra-2025@master/SRA-Regulated-140.webp"
            width={56}
            height={56}
            alt="SRA Regulated logo"
            className="rounded"
          />
        </div>

        <div className="text-left">
          <p className="text-xs font-semibold text-gray-900 leading-tight">
            Regulated by the
            <br />
            <span className="text-blue-600 font-bold">Solicitors Regulation Authority</span>
          </p>
          <p className="mt-1.5 text-[10px] leading-tight text-gray-600">
            {today}
          </p>
        </div>
      </div>
    </a>
  );
};

export default SRAValidationBadge;