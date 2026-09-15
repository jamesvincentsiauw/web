# DESIGN: Vincent Siauw Portfolio

## Update implementasi: background animasi

Permintaan pemilik setelah implementasi: tambahkan background grafis beranimasi pada light dan dark. Untuk background saja, batas MOTION 1 dan larangan loop di spesifikasi awal digantikan oleh animasi ambient yang dapat dipause. Konten tetap langsung terlihat dan tidak memakai scroll reveal.

Motif berupa ribbon garis melengkung, abstraksi aliran workflow/data systems, bukan diagram arsitektur aktual. Grafis ditempatkan di belakang konten dengan mask yang menenangkan area baca kiri, warna hijau mengikuti tema, dan opacity lebih rendah pada mobile. Animasi hanya mengubah transform dua grup SVG, tanpa canvas, dependency tambahan, atau event pointer/scroll. Kontrol Pause background tersedia setelah footer; reduced motion memakai gambar statis tanpa kontrol animasi. Animasi berhenti saat tab tersembunyi dan grafis disembunyikan saat print.

Tanggal: 15 September 2026 · Status: spesifikasi desain, bukan UI yang sudah dibangun

Terkait: [PRD](./PRD.md) · [TRD](./TRD.md)

## 1. Design read

Portfolio software engineer untuk recruiter dan engineering manager, dengan bahasa visual modern minimalist/editorial. **ENERGY 2 / RHYTHM 3 / MOTION 1.** Antislop diterapkan selama planning sesuai permintaan pengguna.

Karakter: tenang, presisi, berpengalaman, mudah dibaca. Halaman memberi ruang besar pada pernyataan utama, lalu mengajak pembaca memeriksa pekerjaan aktual. Ritme berubah melalui komposisi teks, daftar karya, dan timeline, bukan dekorasi bergantian.

**Motif identitas:** catatan engineering dengan pasangan label pendek dan penjelasan spesifik: Context / Contribution / Decision / Outcome. Motif ini muncul di preview proyek, detail studi kasus, dan ringkasan pengalaman. Kekhasan berasal dari masalah workflow dan data yang Vincent kerjakan.

Skill rujukan: [antislop](/Users/mac-097848/.codex/plugins/cache/claude-cowork/antislop/3.2.7/skills/antislop/SKILL.md) dan [minimalist-ui](/Users/mac-097848/.agents/skills/minimalist-ui/SKILL.md). Gunakan arah warna/typography minimalist; template bento, faux window, ambient gradients, dan reveal massal dalam skill minimalist tidak dipakai karena tidak punya kebutuhan konten dan bertentangan dengan filter antislop untuk brief ini. Tidak ada instalasi skill atau perubahan AGENTS.md yang diperlukan untuk handoff dokumen ini.

## 2. Prinsip komposisi

1. Headline menunjukkan bidang kerja, bukan slogan seperti “Turning ideas into reality”.
2. Proyek dibaca sebagai kontribusi engineering; tampilkan peran dan masalah sebelum daftar teknologi.
3. Mayoritas konten berupa teks dan whitespace. Media hanya masuk jika membantu memahami sistem atau hasil.
4. Setiap viewport memiliki focal point: headline, judul proyek utama, atau heading narasi aktif.
5. Daftar pengalaman mempertahankan tanggal dan engagement yang akurat, termasuk periode bersamaan.
6. Desktop dan mobile mempunyai hierarki konten yang sama; mobile mengubah susunan kolom.

## 3. Sistem visual

### Warna

| Token | Light | Dark | Penggunaan |
|---|---|---|---|
| canvas | `#F7F6F3` | `#171916` | Latar utama hangat |
| surface | `#FFFFFF` | `#20231F` | Form, menu, media frame jika perlu |
| text | `#242722` | `#F1F2ED` | Heading dan body |
| muted | `#5D6259` | `#B1B8AC` | Metadata yang tetap terbaca |
| accent | `#365C42` | `#B7D0A7` | Tautan penting dan fokus |
| divider | `#DADDD4` | `#42483E` | Pemisah noninteraktif |
| control-border | `#7A8074` | `#87907E` | Input outline dan batas kontrol penting |
| danger | `#A52B2B` | `#FFB4AB` | Error form; selalu disertai teks |

Palette dominan netral dengan satu aksen hijau redup. Hijau dipilih untuk membedakan tindakan penting tanpa memberi kesan dashboard neon. Danger hanya muncul pada state error, bukan dekorasi.

Tautan dalam paragraf selalu bergaris bawah, jadi makna tidak bergantung pada warna. Divider bukan satu-satunya tanda suatu kontrol bisa diklik. Rasio aktual token dan pasangan pemakaian harus diverifikasi saat implementasi, termasuk saat hover/focus.

Tema awal Light jika tidak ada preferensi tersimpan. Theme control menawarkan Light, Dark, System dengan label yang terbaca screen reader. Pilihan disimpan lokal; System mengikuti OS. Atur tema sebelum paint untuk menghindari flash dan validasi hydration.

### Typography

| Fungsi | Typeface | Ukuran desktop / mobile | Weight / line-height |
|---|---|---|---|
| Hero dan judul detail | Newsreader | 68–80 / 40–48px | 400 / 1.05–1.12 |
| Section heading | Newsreader | 40–48 / 30–34px | 400 / 1.15 |
| Project list title | Geist Sans | 28–32 / 24–28px | 500 / 1.2 |
| Body | Geist Sans | 18 / 16px | 400 / 1.6 |
| Navigation / controls | Geist Sans | 14–16 / 14–16px | 500 / 1.4 |
| Metadata | Geist Sans, tabular numerals untuk tanggal | 13–14 / 13–14px | 400 / 1.5 |
| Code, jika ada | system monospace | 14 / 13px | 400 / 1.6 |

Newsreader membawa karakter editorial pada teks yang dibaca sebagai tulisan profesional. Geist Sans dipakai untuk label/isi teknis yang padat dan netral, dengan dua weight cukup. Hindari all-caps dengan tracking lebar. Hero boleh tracking -0.025em, body normal. Batasi paragraf ke 60–70 karakter per baris. Nama/font bukan alasan meniru produk tertentu.

### Grid, spacing, surface

- Max content width 1160px; reading column 720px.
- Gutter: 20px pada 320–639px, 32px pada 640–1023px, 48px di atasnya.
- Desktop menggunakan 12-column grid, gap 24px. Label/meta 3 kolom, isi 9 kolom.
- Hero vertikal 88–112px desktop, 48–64px mobile; tidak wajib memenuhi tinggi layar.
- Antarbagian utama 96px desktop / 64px mobile; antarparagraf 20–24px; antaritem kecil 12–16px.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96, 112.
- Radius: 0 untuk list rows, 4px untuk tombol/input, 8px untuk media. Tidak ada pill cards.
- Tidak ada shadow pada konten. Overlay menu boleh shadow kecil untuk menunjukkan lapisan, bukan memberi kesan semua konten mengambang.
- Lebar tombol mengikuti isi, tinggi minimum 44px. Primary button charcoal/light inverse; ordinary navigation berupa text links.

## 4. Homepage, urutan dan wireframe

Wireframe berikut menyatakan susunan. Bukan screenshot final atau implementasi.

```text
DESKTOP
┌─────────────────────────────────────────────────────────────────┐
│ Vincent Siauw              Work    About    Contact    Theme     │
├─────────────────────────────────────────────────────────────────┤
│ Software Engineer                                               │
│ Full-stack engineering for                                      │
│ AI workflows and data systems.                                  │
│                                                                 │
│ Intro dua kalimat                         Jakarta, Indonesia    │
│ View selected work   Download CV          GitHub · LinkedIn      │
│                                                                 │
│ Selected work                                                   │
│ Category / organization  AI Workflow Builder                     │
│                          Summary: masalah dan kontribusi        │
│                          Read case study                        │
│ ─────────────────────────────────────────────────────────────── │
│ Category / organization  E-commerce Data Infrastructure          │
│                          Summary dan Read case study            │
│                                      All projects               │
│                                                                 │
│ Experience              Jobkred          Role / dates           │
│                         Kontribusi singkat                      │
│                         Offerland        Role / dates           │
│                         Tokopedia        Role / dates           │
│                                                                 │
│ About                   Bio singkat, link ke halaman About      │
│                                                                 │
│ Contact                 Email Vincent     Copy email            │
│                         LinkedIn · GitHub                       │
│ Vincent Siauw · Jakarta                  Theme                   │
└─────────────────────────────────────────────────────────────────┘
```

### Header

Nama sebagai text wordmark, tanpa logo rekaan. Header berada dalam document flow, tidak sticky pada MVP sehingga tidak menutupi anchor atau memakan layar mobile. Active page memiliki underline dan `aria-current`. Menu dropdown hanya untuk theme; navigasi utama tidak disembunyikan di mobile karena itemnya sedikit.

### Hero

Headline serif rata kiri menjadi focal point. Intro menggunakan copy dari PRD, maksimal dua kalimat. Identitas/lokasi sekunder disusun ke samping hanya saat ruang cukup. Tidak ada portrait placeholder, animated terminal, tech logo cloud, atau metrik besar tanpa konteks.

View selected work menuju `/#work` jika selected work tersedia. Jika proyek published ada tetapi tidak ada yang ditandai featured, tampilkan sampai tiga proyek pertama sebagai fallback. Jika tidak ada proyek published, ganti CTA menjadi View experience menuju `/#experience` dan sembunyikan section Work. Download CV muncul hanya untuk file publik valid.

### Selected work

Daftar editorial, maksimum tiga item. Setiap item berisi kategori/organisasi, judul, summary, dan link Read case study. Tidak ada fixed-height card. Item pertama boleh lebih lapang untuk menekankan prioritas manual. Media tidak diwajibkan; jika cover sudah tersedia dan relevan, letakkan di bawah summary tanpa mengubah item menjadi carousel.

### Experience

Label di kolom kiri, entri perusahaan di kanan. Homepage cukup role terbaru, tanggal, dan satu kontribusi utama per perusahaan. About menampilkan semua engagement. Data tidak diduplikasi di CMS.

### About singkat dan Contact

About memberi konteks pendek tentang cara bekerja yang didukung CV: technical decisions, code review, kolaborasi product/business. Link “More about my experience” menuju `/about`. Contact menampilkan email sebagai tautan dan tombol Copy email. Hindari slogan kolaborasi generik; heading cukup “Contact”.

## 5. Mobile composition

```text
320–639px
Vincent Siauw              Theme
Work       About       Contact

Software Engineer
Full-stack engineering
for AI workflows
and data systems.

Intro
Jakarta, Indonesia
View selected work
Download CV

Selected work
Category · Organization
Project title
Summary
Read case study
───────────────────────────────
Project berikutnya

Experience
Organization
Role
Dates
Contribution

About
Bio

Contact
Email (boleh wrap)
Copy email
LinkedIn · GitHub
```

Pada 640–1023px, gunakan dua kolom hanya jika isi tetap terbaca; metadata boleh di atas judul. Pada ≥1024px gunakan grid desktop. Hindari breakpoints yang bergantung pada nama device. Link/email/URL panjang memakai wrapping; code block boleh horizontal scroll lokal dengan label, bukan membuat seluruh halaman overflow.

Tidak ada hamburger, drawer, custom cursor, atau hover-only content di MVP. Header dua baris pada mobile tetap memberikan target sentuh 44px. Anchor memiliki scroll margin jika header diubah menjadi sticky pada iterasi berikutnya.

## 6. Projects index dan case study

### `/projects`

Heading “Work”, satu kalimat penjelas faktual, lalu daftar proyek. Struktur sama dengan selected work sehingga familiar. Metadata kategori berupa teks, bukan kumpulan badge. Tidak ada filter sampai volume konten membutuhkan. Setelah 12 item gunakan Previous/Next dengan page query yang valid dan navigasi keyboard. Page di luar rentang menghasilkan 404 atau redirect ke halaman valid secara konsisten; pilih 404 untuk baseline.

### `/projects/[slug]`

```text
Back to work

Project title
Summary

Organization  | Role | Period (jika tersedia)
Technology names, teks ringkas

Context       Masalah, pengguna, dan batasan
Contribution  Bagian yang Vincent kerjakan
Decision      Pilihan teknis serta tradeoff
Outcome       Hasil naratif / metrik dengan konteks

Media/caption berada dekat narasi terkait, jika tersedia
Source / Demo hanya jika ada URL
Next project (jika ada)                  Email Vincent
```

Body reading column 720px; desktop label kolom kiri menjadi jangkar visual. Mobile label menjadi heading di atas teks. Tidak ada sidebar table of contents untuk case study pendek. Hero proyek tetap lengkap ketika tanpa cover. Gambar berisi diagram harus punya caption yang membedakan diagram konseptual dari arsitektur aktual.

Khusus proyek Jobkred, narasi boleh mengangkat DAG validation dan node agents sesuai CV; jangan menggambar arsitektur detail yang tidak tersedia lalu menyebutnya production architecture. Ilustrasi konseptual baru harus diberi label dan ditinjau sebelum publish.

## 7. About

Urutan: bio → experience lengkap → skills berdasarkan domain → education → bahasa dan relokasi opsional → contact. Skills berupa daftar ringkas dua kolom desktop/satu kolom mobile, tanpa progress bars, ranking, atau tingkat “expert” yang diada-adakan.

Offerland punya subrows Freelance dan Full-time. Tokopedia mencantumkan concurrent engagement secara ringkas. Jangan menjumlahkan seluruh durasi sebagai total pengalaman karena periode overlap. Label “5+ years” dari CV tidak perlu jadi elemen besar; timeline lebih informatif.

## 8. CMS screens dan alur interaksi

Gunakan Payload Admin bawaan dengan label dan pengelompokan field yang baik. Public design tokens tidak mengharuskan redesign seluruh admin. Utamakan editing yang andal, aksesibilitas, dan konsistensi tombol Save draft / Preview / Publish.

```text
Projects > AI Workflow Builder              Draft
Overview | Case Study | Media & Links | SEO

Title, slug, summary, category, role
Content readiness dan internal source

Save draft         Preview         Publish
```

Collections list memperlihatkan title/company, status, updatedAt, featured, sortOrder. Admin mengubah order dengan field integer pada MVP; tidak perlu drag-and-drop custom. Project preview menggunakan layout public yang sama, ditambah banner “Draft preview” dan Exit preview.

Publish action menunjukkan validation error secara inline dan ringkasan atas. Unpublish/delete adalah tindakan admin dengan dialog konsekuensi singkat. Unsaved changes memberi peringatan sebelum meninggalkan editor. Restore version memulihkan draft untuk diperiksa.

## 9. Interaction contract

| Elemen | Aksi | State/aksesibilitas |
|---|---|---|
| Nama di header | Navigate `/` | Focus visible; active Home semantik bila relevan |
| Work / About / Contact | Route atau anchor dari PRD | Native link, bukan click div |
| View selected work | Scroll `/#work` | Hanya jika section tersedia |
| Download CV | Akses PDF public | Tampilkan format/ukuran aktual; hilang jika tidak tersedia |
| Read case study | `/projects/[slug]` | Accessible name menyertakan judul proyek |
| Email Vincent | `mailto:` alamat CV | Email juga terlihat sebagai teks |
| Copy email | Clipboard write | `aria-live=polite`: “Email copied”; fallback “Select and copy the email address” |
| Theme | Light/Dark/System | Label aktif jelas; keyboard native select atau menu aksesibel |
| Pagination | URL page sebelum/berikut | Nonexistent action dihilangkan, bukan link kosong |
| Retry | Coba muat ulang route | Tidak mengklaim sukses sebelum data dimuat |
| Preview exit | Keluar draft mode | Kembali ke route publik yang valid |

Project row tidak memakai nested link atau click handler pada seluruh container; judul dan explicit CTA boleh menunjuk tujuan sama, namun minimalkan duplicate tab stops dengan satu link utama per item bila implementasi memungkinkan.

## 10. Motion dan accessibility

MOTION 1: hanya transisi warna/underline/focus 120–160ms; tidak ada scroll reveal, pinning, parallax, text scramble, atau infinite animation. Konten langsung terlihat. `prefers-reduced-motion` menghapus transition nonessential; anchor scroll default tidak harus smooth.

Skip to content pada fokus pertama. Focus ring 2px dengan offset 3px, warna accent yang kontras. Tab order mengikuti DOM/visual; link aktif dengan Enter, button dengan Enter/Space. Label form eksplisit, error dikaitkan dengan field, feedback tidak hanya warna. Dialog CMS mengembalikan fokus ke pemicu dan bisa ditutup Escape sesuai konteks.

Uji normal text ≥4.5:1, large text ≥3:1 (24px regular atau sekitar 18.7px bold), komponen/focus ≥3:1. Font kecil muted tetap minimal 13px; jangan mengecilkan metadata agar muat. Uji zoom 200% dan teks panjang pada kedua tema.

## 11. Empty, loading, error

| State | Presentasi |
|---|---|
| Tidak ada proyek publik | Homepage melewati Work; index: “Case studies will be added here. You can read my experience in the meantime.” dengan About link |
| Hanya satu proyek | Tampilkan satu item normal; tanpa carousel, pagination, atau next project palsu |
| Tidak ada cover | Teks menggunakan seluruh area yang disediakan, tanpa ruang gambar kosong |
| Route loading | Pesan pendek “Loading…” pada area isi; header tetap stabil jika layout sudah tersedia |
| Fetch error | “This page could not be loaded.” + Retry dan Home; bukan empty state |
| 404 | “Page not found.” + Home, Work bila ada |
| CV belum ada | Tidak ada tombol download |
| Upload/Save admin gagal | Inline explanation, retry, dan indikator unsaved |

## 12. Keputusan antislop dan alasannya

| Keputusan | Alasan |
|---|---|
| Headline editorial serif + body sans | Memberi focal point kuat sambil menjaga narasi teknis mudah dibaca |
| Warm canvas, hijau hanya untuk tindakan | Membuat hierarki tenang tanpa tampilan neon developer template |
| Project list dengan role/context | Bukti kerja Vincent lebih penting daripada dekorasi kartu |
| Label/narasi berulang | Menjadikan kontribusi dan keputusan engineering mudah dibandingkan |
| Ruang vertikal bervariasi | Memisahkan intro, bukti kerja, dan detail tanpa semua section terasa sama |
| Nama sebagai text wordmark | Identitas sudah tersedia tanpa membuat logo/foto fiktif |
| Media opsional, selalu terkait isi | CV belum menyediakan screenshot; teks harus tetap menjadi desain yang selesai |
| Motion minimal | Pengunjung membutuhkan pembacaan cepat dan kontrol, bukan showcase animasi |
| Tidak ada FAQ/testimonial/metrics strip | Tidak ada data yang mendukung section tersebut |
| Theme choice | Mendukung preferensi membaca tanpa memaksakan dark aesthetic |

## 13. Planning review dan gate implementasi

Review ini memeriksa spesifikasi, bukan build atau visual browser. Tidak ada klaim bahwa UI sudah diklik, dirender, atau lolos Lighthouse.

- PASS spesifikasi konten: PRD bagian 4 memetakan fakta CV, usulan judul, dan data yang belum ada; seed draft mencegah placeholder dianggap final.
- PASS spesifikasi navigasi: bagian 4–9 memetakan setiap kontrol ke route, anchor, atau tindakan, termasuk kondisi elemen disembunyikan.
- PASS spesifikasi identity/purpose: ENERGY 2 / RHYTHM 3 / MOTION 1, motif label/narasi, dan alasan tiap keputusan tercatat di bagian 1 dan 12.
- PASS spesifikasi resilience: bagian 5, 9–11 mencakup mobile, keyboard, kedua tema, empty/loading/error dan missing media.
- PASS spesifikasi akses konten: TRD bagian 4–5 memisahkan draft, published, preview, dan media visibility.
- BELUM DIUJI runtime: kontras hasil render, overflow, click-through, console, screen reader, performa, dan admin lifecycle. Wajib diuji model implementasi sesuai TRD bagian 9.

Output implementasi harus menyertakan bukti ringkas: route yang dibuka, tindakan yang dicoba, viewport/tema yang diuji, dan hasil. Spesifikasi yang lengkap tidak menggantikan pengujian produk yang berjalan.
