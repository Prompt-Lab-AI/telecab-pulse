import * as XLSX from 'xlsx';
import { SheetRow } from '@/lib/sheets';

export function exportToExcel(data: SheetRow[], filename = 'telecab-export') {
  if (!data.length) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
