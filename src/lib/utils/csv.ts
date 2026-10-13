import { FeedbackItem, Project } from '@/types';

/**
 * Sanitizes a string to prevent CSV formula injection (CSV/Spreadsheet Injection).
 * Any cell value starting with dangerous formula triggers (=, +, -, @, \t, \r)
 * is prepended with a single quote (') so that spreadsheet applications (Excel,
 * Google Sheets, LibreOffice) treat it as pure text instead of an executable expression.
 */
export function sanitizeForCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Check if string starts with formula characters
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r'];
  const startsWithFormula = formulaTriggers.some((trigger) => str.startsWith(trigger));

  let safeStr = str;
  if (startsWithFormula) {
    safeStr = `'${str}`;
  }

  // RFC-4180 escaping: if value contains quote, comma, newline, or we added a leading quote
  if (
    safeStr.includes('"') ||
    safeStr.includes(',') ||
    safeStr.includes('\n') ||
    safeStr.includes('\r') ||
    safeStr.startsWith("'")
  ) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }

  return safeStr;
}

export interface FeedbackExportRow {
  projectTitle: string;
  projectCategory: string;
  feedbackTitle: string;
  comment: string;
  reviewer: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

export function generateFeedbackCsv(
  items: FeedbackItem[],
  projectsMap: Record<string, Project> = {}
): string {
  const headers = [
    'Project Title',
    'Project Category',
    'Feedback Title',
    'Feedback Comment',
    'Reviewer',
    'Category',
    'Priority',
    'Status',
    'Created Date',
  ];

  const headerRow = headers.map(sanitizeForCsv).join(',');

  const rows = items.map((item) => {
    const project = item.project || projectsMap[item.project_id];
    const projectTitle = project?.title || 'Unknown Project';
    const projectCategory = project?.category || 'N/A';
    const reviewer = item.reviewer_name || 'Anonymous';
    const createdDate = item.created_at
      ? new Date(item.created_at).toISOString().split('T')[0]
      : '';

    return [
      sanitizeForCsv(projectTitle),
      sanitizeForCsv(projectCategory),
      sanitizeForCsv(item.title),
      sanitizeForCsv(item.comment),
      sanitizeForCsv(reviewer),
      sanitizeForCsv(item.category),
      sanitizeForCsv(item.priority),
      sanitizeForCsv(item.status),
      sanitizeForCsv(createdDate),
    ].join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
