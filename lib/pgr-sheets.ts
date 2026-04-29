import type { PGREntry } from './pgr-types';

const SHEET_NAME = 'Pretty Good Race';
const HEADERS = ['Wave', 'Badge 1', 'Badge 2', 'Badge 3', 'Egypt', 'Caribbean', 'Hollywood', 'Australia', 'Finish Order'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSheetsClient(sheetId: string): { sheets: any; sheetId: string } {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set');
  if (!sheetId) throw new Error('Sheet ID not configured — set it in Settings');

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credJson),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return { sheets: google.sheets({ version: 'v4', auth }), sheetId };
}

async function ensureTab(sheetId: string) {
  const { sheets } = getSheetsClient(sheetId);

  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing: string[] = meta.data.sheets?.map((s: any) => s.properties?.title) ?? [];

  if (!existing.includes(SHEET_NAME)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `'${SHEET_NAME}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

export async function appendEntriesToSheet(sheetId: string, entries: PGREntry[]) {
  await ensureTab(sheetId);
  const { sheets } = getSheetsClient(sheetId);

  const rows = entries.map(e => [
    e.wave,
    e.badges[0] ?? '',
    e.badges[1] ?? '',
    e.badges[2] ?? '',
    e.egypt,
    e.caribbean,
    e.hollywood,
    e.australia,
    e.order,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `'${SHEET_NAME}'!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });
}
