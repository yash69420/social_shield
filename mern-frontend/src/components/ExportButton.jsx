import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/DropdownMenu";
import { exportToCSV, exportToExcel, exportToPDF } from "../utils/export";

const ExportButton = ({
  data,
  title = "Security Analysis",
  variant = "default",
  size = "default",
  className = "",
  allEmails = false,
}) => {
  const getExportData = () => {
    if (allEmails) {
      const storedResults = localStorage.getItem("email_analysis_results");
      return storedResults ? Object.values(JSON.parse(storedResults)) : [];
    }
    return data;
  };

  const handleExportCSV = () => {
    exportToCSV(
      getExportData(),
      `${title.toLowerCase().replace(/\s+/g, "-")}-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      getExportData(),
      `${title.toLowerCase().replace(/\s+/g, "-")}-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      getExportData(),
      title,
      `${title.toLowerCase().replace(/\s+/g, "-")}-${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-purple-500/20 ${className}`}
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[rgb(var(--background))] border border-[rgb(var(--border))] shadow-lg">
        <DropdownMenuItem
          onClick={handleExportCSV}
          className="flex items-center gap-2 hover:bg-[rgb(var(--primary))]/10 focus:bg-[rgb(var(--primary))]/10"
        >
          <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
          <span className="text-[rgb(var(--foreground))]">Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportExcel}
          className="flex items-center gap-2 hover:bg-[rgb(var(--primary))]/10 focus:bg-[rgb(var(--primary))]/10"
        >
          <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
          <span className="text-[rgb(var(--foreground))]">Export as Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportPDF}
          className="flex items-center gap-2 hover:bg-[rgb(var(--primary))]/10 focus:bg-[rgb(var(--primary))]/10"
        >
          <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
          <span className="text-[rgb(var(--foreground))]">Export as PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
