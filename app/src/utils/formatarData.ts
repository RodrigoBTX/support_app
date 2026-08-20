/**
 * Datas que vêm da API (colunas DATE/DATETIME do SQL Server) chegam como
 * texto ISO (ex: "2026-08-19T17:19:48.477Z"). Isto formata para dd-mm-aaaa,
 * o formato que se usa em todo o lado na app.
 */
export function formatarData(valor?: string | null): string {
  if (!valor) return '—';
  const d = new Date(valor);
  if (isNaN(d.getTime())) return String(valor);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const ano = d.getUTCFullYear();
  return `${dia}-${mes}-${ano}`;
}
