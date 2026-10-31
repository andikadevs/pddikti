// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Upstream PDDikti shapes (all fields optional — read defensively). */

export interface PtDetail {
  nama_pt?: string
  nm_singkat?: string
  kode_pt?: string
  status_pt?: string
  akreditasi_pt?: string
  status_akreditasi?: string
  kelompok?: string
  pembina?: string
  email?: string
  no_tel?: string
  no_fax?: string
  website?: string
  alamat?: string
  kode_pos?: string
  provinsi_pt?: string
  kab_kota_pt?: string
  kecamatan_pt?: string
  tgl_berdiri_pt?: string
  sk_pendirian_sp?: string
}

export interface PtRasio {
  rasio?: string
}

export interface PtMahasiswa {
  mean_jumlah_lulus?: number
  mean_jumlah_baru?: number
}

export interface PtStudyDuration {
  jenjang?: string
  mean_masa_studi?: number
}

export interface PtCost {
  range_biaya_kuliah?: string
}

export interface PtNameHistory {
  nama?: string
  tahun?: string | number
  keterangan?: string
}

export interface Prodi {
  kode_prodi?: string
  nama_prodi?: string
  akreditasi?: string
  jenjang_prodi?: string
  status_prodi?: string
  jumlah_dosen?: number
  jumlah_mahasiswa?: number
  rasio?: string
}

export interface Lecturer {
  id_sdm?: string
  nama_dosen?: string
  nidn?: string
  nuptk?: string
  pendidikan?: string
  status_aktif?: string
  status_pegawai?: string
  ikatan_kerja?: string
  nama_prodi?: string
  jenjang_prodi?: string
}

export interface LecturersResponse {
  count?: number
  semester?: string
  dosen?: Lecturer[]
}

export interface StudentHit {
  id?: string
  nama?: string
  nim?: string
  nama_pt?: string
  sinkatan_pt?: string
  nama_prodi?: string
}

export interface PtSearchHit {
  id?: string
  nama?: string
  nama_singkat?: string
  kode?: string
}
