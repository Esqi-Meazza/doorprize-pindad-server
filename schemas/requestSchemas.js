const { z } = require('zod');

const nonEmptyString = z.string().trim().min(1);
const positiveInteger = z.coerce.number().int().positive();

const adminLoginSchema = z.object({
  username: nonEmptyString.max(100),
  password: z.string().min(1).max(255),
}).strict();

const participantCredentialsSchema = z.object({
  nip: nonEmptyString.max(50),
  tgl_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir harus berformat YYYY-MM-DD'),
}).strict();

const userLogoutSchema = z.object({
  id_user: positiveInteger,
}).strict();

const spinSessionSchema = z.object({
  id_kelompok: positiveInteger,
  nama_kelompok: nonEmptyString.max(150),
  jumlah_slot: z.coerce.number().int().nonnegative(),
  mode: nonEmptyString.max(50),
}).strict();

const spinActionSchema = z.object({
  id_kelompok: positiveInteger,
}).strict();

const pageNumber = z.coerce.number().int().min(1).default(1);
const pageLimit = z.coerce.number().int().min(1).max(100).default(10);
const searchText = z.string().trim().max(100).optional().default('');

const pagedPesertaSchema = z.object({
  page: pageNumber,
  limit: pageLimit,
  search: searchText,
  divisi: z.string().trim().max(50).optional().default(''),
}).strict();

const pagedPemenangSchema = z.object({
  page: pageNumber,
  limit: pageLimit,
  search: searchText,
  hadiah: z.string().trim().max(50).optional().default(''),
}).strict();

const pagedHadiahSchema = z.object({
  page: pageNumber,
  limit: pageLimit,
  search: searchText,
  tipe: z.string().trim().max(50).optional().default(''),
}).strict();

const pagedKelompokSchema = z.object({
  page: pageNumber,
  limit: pageLimit,
  search: searchText,
  tipe: z.string().trim().max(50).optional().default(''),
  status: z.string().trim().max(50).optional().default(''),
}).strict();

module.exports = {
  adminLoginSchema,
  participantCredentialsSchema,
  userLogoutSchema,
  spinSessionSchema,
  spinActionSchema,
  pagedPesertaSchema,
  pagedPemenangSchema,
  pagedHadiahSchema,
  pagedKelompokSchema,
};
