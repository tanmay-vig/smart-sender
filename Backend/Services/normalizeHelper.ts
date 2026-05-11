export function normalizeXlsxData(data: any[]): any[] {
  return data.map((row: any) => {
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
      normalizedRow[key.toLowerCase()] = row[key];
    }
    return normalizedRow;
  });
} 