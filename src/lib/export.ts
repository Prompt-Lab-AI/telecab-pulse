import * as XLSX from 'xlsx';
import { VendaData } from '@/lib/sheets';

export function exportToExcel(vendas: VendaData[], filename = 'telecab-vendas.xlsx') {
  const wsData = vendas.map(v => ({
    Data: v.data,
    PAP: v.papId,
    Produto: v.produto,
    Cidade: v.cidade,
    Visitas: v.visitas,
    Vendas: v.vendas,
    'Valor Total': v.valorTotal,
    Instalado: v.instalado,
    NPS: v.nps,
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
  XLSX.writeFile(wb, filename);
}
