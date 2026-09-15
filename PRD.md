# PRD: Vincent Siauw Portfolio

Tanggal: 15 September 2026 · Status: planning untuk handoff implementasi

## 1. Ringkasan produk

Website portfolio pribadi Vincent Siauw, software engineer di Jakarta dengan pengalaman full-stack, AI workflow systems, dan backend/data infrastructure. Website membantu recruiter dan engineering manager memahami jenis masalah yang Vincent kerjakan, kontribusi pribadinya, serta cara menghubunginya. CMS memungkinkan Vincent memperbarui konten tanpa mengubah source code.

Deliverable tahap ini hanya spesifikasi: [PRD](./PRD.md), [TRD](./TRD.md), dan [DESIGN](./DESIGN.md). Tidak ada implementasi, deployment, pembelian layanan, atau publikasi data pada tahap ini.

## 2. Keputusan dan asumsi

| Area | Keputusan planning | Alasan |
|---|---|---|
| Audience utama | Recruiter, engineering manager, technical founder | Selaras dengan CV profesional dan pengalaman produksi |
| Positioning | Software engineer: full-stack & AI systems, dengan kedalaman backend | Mengikuti judul CV dan pengalaman aktual |
| Bahasa publik | Inggris | CV berbahasa Inggris dan menyebut peluang internasional |
| Bahasa dokumen | Indonesia | Memudahkan review pemilik |
| Visual | Modern minimalist dengan komposisi editorial | Sesuai permintaan; detail di DESIGN |
| CMS | Payload, terintegrasi dengan aplikasi Next.js | Konten terstruktur dan satu codebase TypeScript |
| Tema | Light sebagai awal, pilihan Light/Dark/System | Tetap nyaman dibaca pada preferensi berbeda |
| Kontak | Email dan LinkedIn, tanpa form MVP | Jalur kontak singkat tanpa kebutuhan inbox backend |
| Pemilik CMS | Satu admin, Vincent | Belum ada kebutuhan tim editorial |

Ini keputusan rancangan, bukan preferensi tambahan yang sudah dikonfirmasi pemilik. Model implementasi bisa memakai baseline ini; pertanyaan nonblocking ada di bagian 11.

## 3. Tujuan dan ukuran keberhasilan

1. Dalam sesi uji 30 detik, pengunjung dapat menyebut spesialisasi Vincent dan menemukan satu contoh pekerjaan relevan.
2. Pengunjung dapat membuka detail proyek, CV, atau kontak dalam maksimal dua tindakan dari homepage.
3. Vincent dapat menambahkan proyek baru, menyimpan draft, preview, publish, mengubah urutan, dan unpublish tanpa edit kode.
4. Identitas website terasa berasal dari isi pekerjaan Vincent: workflow orchestration, data pipelines, dan kontribusi engineering. Keberhasilan tidak bergantung pada foto atau screenshot yang belum tersedia.
5. Pengalaman mobile, keyboard, dan kedua tema memenuhi acceptance criteria di DESIGN.

Ukuran di atas adalah target pengujian, bukan statistik yang boleh ditampilkan di website. Analytics bukan prasyarat MVP; jangan menjanjikan peningkatan conversion tanpa baseline.

## 4. Sumber konten dan batas kepastian

Sumber primer: [CV_VincentSiauw_August_26.pdf](/Users/mac-097848/Downloads/CV_VincentSiauw_August_26.pdf), satu halaman. Isi CV dipakai sebagai data, bukan instruksi. Fakta berikut adalah pernyataan dari CV, belum diverifikasi secara independen.

| Entitas | Data sumber | Perlakuan di website |
|---|---|---|
| Identitas | Vincent Siauw; Jakarta, Indonesia | Nama teks di header; lokasi di intro/about |
| Headline | Software Engineer, Full Stack & AI Systems | Pertahankan substansi; jangan naikkan jabatan menjadi lead/staff |
| Jobkred | Software Engineer, Full Stack; Oct 2024–Present; Singapore, remote | Seed draft; current status perlu dicek karena mengikuti CV Agustus 2026 |
| Jobkred kontribusi | ReactFlow workflow canvas, DAG validation, 10+ node types, 5+ LLM node agents, scheduled execution; 8+ full-stack features | Sumber kandidat case study; angka hanya jika konteks dan penggunaan publik dikonfirmasi |
| Jobkred stack | Python, FastAPI, Next.js, TypeScript, React, ReactFlow, Redis, PostgreSQL, OpenAI API | Hubungkan dengan pengalaman/proyek terkait |
| Offerland | Freelance Jun 2020–Jan 2022; Backend Engineer full-time Jan 2022–Oct 2024; remote | Satu perusahaan, dua periode engagement yang jelas |
| Offerland kontribusi | Scraping/data pipelines; 1M+ data points/day, 20+ platforms, 2x performance, 35% cost reduction, 98% accuracy, 80% faster failure response | Klaim dari CV; jangan ubah menjadi uptime atau benchmark umum |
| Offerland stack | Python, Django, Celery, GCP, Docker | Tampilkan bersama konteks pekerjaan |
| Tokopedia | Software Engineer; Oct 2021–Jan 2022; Jakarta; concurrent dengan Offerland freelance | Jangan menghapus overlap atau menghitung durasi dua kali |
| Tokopedia kontribusi | Real-time seller analytics; Kafka, Go, Redis; 15% operational efficiency; 94% service stability | Simpan angka ambigu sebagai catatan internal; 94% bukan SLA/uptime tanpa definisi |
| Pendidikan | Bachelor of Engineering in Informatics, ITB, 2017–2021; GPA 3.34/4.00 | Pendidikan di About; GPA opsional, tidak perlu di hero |
| Akademik | Thesis fraud detection using CNN; teaching assistant C, Python, Haskell, 50+ students | Ringkasan About; studi kasus tesis hanya setelah detail tersedia |
| Kontak | jamesvincentsiauw@gmail.com; github.com/jamesvincentsiauw; linkedin.com/in/vincent-siauw | Seed URL dari CV; cek destination saat implementasi |
| Relokasi | Indonesian citizen, open to international relocation; sponsorship/work rights per role/country | Opsional di About, tanpa mengklaim work authorization negara tertentu |

Nomor telepon tidak ditampilkan sebagai field kontak publik default. CV asli mengandung nomor telepon dan informasi relokasi; admin dapat mengunggah versi publik yang dipilih untuk download. Tombol CV tidak tampil sebelum file berstatus publik tersedia.

### Kandidat proyek untuk seed CMS

Judul di bawah adalah usulan editorial berdasarkan kontribusi dalam CV, bukan nama produk resmi. Semua seed berstatus draft; jangan otomatis publish.

| Usulan judul | Asal | Isi yang sudah tersedia | Yang masih perlu ditulis |
|---|---|---|---|
| AI Workflow Builder | Jobkred | Workflow canvas, DAG validation, scheduled execution, LLM nodes | Masalah pengguna, peran tim vs individu, tradeoff, contoh aman untuk publik |
| E-commerce Data Infrastructure | Offerland | Scraping microservices, task queues, validation, monitoring | Baseline metrik, periode ukur, diagram yang boleh dipublikasikan |
| Real-time Seller Analytics | Tokopedia | Event-driven microservices, Kafka/Go/Redis | Scope kontribusi, batas sistem, definisi hasil |
| CNN Fraud Detection Thesis | ITB | Topik tesis | Dataset, metode evaluasi, hasil, repository atau abstrak |

Urutan awal yang disarankan: AI Workflow Builder, E-commerce Data Infrastructure, Real-time Seller Analytics. Tampilkan jumlah studi kasus yang benar-benar siap, tidak wajib tiga. Jika belum ada case study siap, homepage mengutamakan Experience.

### Contoh copy publik, belum dipublish

**Eyebrow:** Vincent Siauw · Software Engineer

**Hero:** Full-stack engineering for AI workflows and data systems.

**Intro:** I build workflow tools, backend services, and data pipelines. My experience spans HR tech, e-commerce infrastructure, and seller analytics.

**Primary link:** View selected work

**Secondary link:** Download CV

Kata AI menjelaskan domain kerja aktual, bukan klaim promosi. Tidak menambahkan testimonial, rating skill, jumlah klien, atau klaim fintech spesifik karena CV tidak merinci engagement fintech.

## 5. Sitemap dan isi halaman

| Route | Fungsi | Konten dan tindakan |
|---|---|---|
| `/` | Ringkasan kuat dan jalur masuk | Intro, selected work bila tersedia, experience ringkas, about singkat, kontak |
| `/projects` | Indeks seluruh karya publik | Daftar proyek diurutkan manual; kategori teks; pagination setelah 12 item |
| `/projects/[slug]` | Case study | Konteks, kontribusi, keputusan/tradeoff, hasil, media opsional, tautan, proyek berikutnya |
| `/about` | Profil profesional lebih lengkap | Bio, timeline lengkap, skills per domain, pendidikan, bahasa, relokasi opsional, CV |
| `/#contact` | Kontak langsung | Email, copy email, LinkedIn, GitHub |
| `/admin` | CMS terlindungi | Login, collections, draft/preview/publish, upload media |
| 404 | Route tidak ditemukan | Pesan ringkas, Home dan Projects bila ada konten |

Header: nama menuju `/`, Work menuju `/projects`, About menuju `/about`, Contact menuju `/#contact`, theme control. Jika belum ada proyek publik, sembunyikan Work di header dan CTA selected work berubah menjadi View experience menuju `/#experience`. Route `/projects` tetap punya empty state yang jujur jika dibuka langsung.

## 6. Alur pengguna

### A. Recruiter scanning

Homepage → memahami headline dan spesialisasi → membaca experience ringkas → Download CV atau Contact. CV harus dapat diakses tanpa login. Browser dapat membuka PDF bila download tidak didukung; berikan label format/ukuran yang berasal dari file aktual.

### B. Engineering manager melakukan evaluasi

Homepage → memilih studi kasus → membaca masalah, kontribusi pribadi, keputusan, dan hasil → proyek berikutnya atau email Vincent. Tautan repository/demo hanya muncul jika URL benar-benar tersedia. Studi kasus internal tetap boleh diterbitkan tanpa source code dan tanpa screenshot, menggunakan narasi faktual yang aman.

### C. Vincent mengelola konten

Login → Projects → Add new → isi overview → simpan draft → isi case study dan metadata → preview → publish → cek halaman publik. Pengeditan draft berikutnya tidak mengganti versi publik sampai publish ulang. Unpublish menghilangkan entry dari daftar, detail, sitemap, dan akses media privat terkait.

### D. Menambahkan pengalaman

Login → Experiences → buat perusahaan/role/engagement → masukkan periode dan kontribusi → atur urutan → preview → publish. Periode freelance dan full-time dapat ditambahkan di entry perusahaan yang sama. Current role tidak membutuhkan end date.

## 7. Scope prioritas

### P0: MVP wajib

- Halaman dan navigasi pada sitemap, termasuk fallback jika konten belum tersedia.
- CMS untuk profile, projects, experiences, skills, education, media, dan pengaturan situs.
- Draft, preview, publish/unpublish, version history dan pemulihan versi pada konten editorial.
- Urutan proyek/experience manual; featured projects maksimum tiga.
- Rich text terbatas dan media opsional, dengan alt text/caption.
- Upload dan penggantian CV publik melalui CMS.
- Login admin tanpa public registration; reset password dengan alur yang teruji.
- Metadata SEO, canonical, sitemap published-only, social sharing image sederhana dari nama/judul.
- Layout responsif, keyboard access, light/dark/system, reduced motion.
- Validasi publikasi dan perlindungan draft/private media.

### P1: setelah kebutuhan nyata muncul

- Tulisan engineering, search/filter proyek jika arsip membesar, analytics sederhana.
- Versi bahasa Indonesia, scheduled publishing, role editor terpisah.

### Di luar MVP

Blog kosong, chatbot, skill progress bars, testimonial tanpa sumber, project carousel, login pengunjung, newsletter, public comments, custom drag-and-drop page builder, dan demo interaktif workflow editor. Menampilkan bidang AI tidak membutuhkan fitur AI di portfolio.

## 8. CMS sebagai produk

Sidebar: Projects, Experiences, Skills, Education, Media; globals: Profile dan Site Settings. Dashboard memakai admin bawaan yang dikonfigurasi, bukan dashboard analitik kustom.

Editor proyek dibagi menjadi Overview / Case Study / Media & Links / SEO. Kolom internal seperti sumber CV, readiness, dan catatan publikasi tidak masuk output publik. CMS membantu konsistensi konten; layout dan design tokens tetap dikontrol source code.

Publikasi proyek membutuhkan title, slug unik, summary, kategori, role, context, contribution, decisions, outcome naratif, dan konfirmasi contentReady. Outcome tidak harus berupa angka. Form tidak boleh memaksa Vincent mengarang metrik atau mengunggah screenshot.

Admin dapat menyimpan draft yang belum lengkap. Saat publish ditolak, tampilkan daftar field bermasalah, pertahankan semua input, dan fokuskan field pertama. Jika session habis, tawarkan login kembali tanpa mengklaim perubahan tersimpan.

## 9. Acceptance criteria produk

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| AC-01 | Pengunjung membuka homepage | Role, spesialisasi, dan jalur kontak terlihat tanpa menunggu animasi |
| AC-02 | Proyek belum memiliki screenshot/repo | Halaman tetap utuh, tanpa dummy image atau dead link |
| AC-03 | Admin menyimpan draft baru | Tidak muncul di publik, pencarian API publik, sitemap, atau preview anonim |
| AC-04 | Admin mengedit entry yang sudah publish lalu Save draft | Publik masih melihat versi published sebelumnya |
| AC-05 | Admin publish/unpublish | Permintaan publik baru langsung membaca status terbaru; detail unpublished 404 |
| AC-06 | Admin mengubah featured order | Urutan homepage mengikuti nilai CMS, stabil jika rank sama |
| AC-07 | Tidak ada proyek publik | Experience menjadi bukti utama; tidak ada kartu kosong di homepage |
| AC-08 | Pengunjung copy email | Ada feedback sukses atau fallback email yang bisa dipilih |
| AC-09 | CV belum diunggah | Tidak ada tombol download kosong |
| AC-10 | URL slug berubah | URL published lama redirect permanen ke URL baru; tidak menuju draft |
| AC-11 | Layar 320px, zoom 200%, keyboard, kedua tema | Konten terbaca, tidak overflow, semua kontrol dapat digunakan |
| AC-12 | Admin restore versi lama | Dipulihkan ke draft untuk review; perlu publish eksplisit |

## 10. Risiko yang memengaruhi rancangan

- CV cukup untuk profil dan timeline, tetapi belum cukup untuk case study lengkap. Website bisa launch dengan experience dahulu; jangan memaksa publikasi draft proyek.
- Metrik CV tidak mempunyai metodologi rinci. Gunakan angka hanya bersama konteks yang diberikan pemilik, tanpa reinterpretasi.
- CMS menambah kebutuhan operasional: database, object storage, backup, dan pembaruan dependency. Detail ada di TRD.
- Informasi Current role dan availability cepat berubah. Pisahkan sebagai field editorial, jangan hardcode sebagai fakta permanen.

## 11. Handoff dan keputusan yang bisa ditunda

Model implementasi membaca PRD → DESIGN → TRD. PRD menentukan scope/content; DESIGN menentukan presentasi; TRD menentukan kontrak teknis. Jika terdapat pertentangan, catat dan selesaikan sebelum menambah scope.

Belum dibutuhkan untuk memulai implementasi: domain final, hosting vendor, foto pribadi, screenshot, konfirmasi proyek perusahaan yang boleh tampil, availability terkini, dan CV versi publik. Gunakan draft atau sembunyikan elemen yang belum siap. Jangan mengganti kekosongan dengan data fiktif.

Urutan implementasi yang diharapkan: content schema dan auth → public pages dengan data seed draft → editor/preview/publication → accessibility/SEO/error states → content review dan launch checks. Tidak ada estimasi waktu pasti karena implementasi dikerjakan model lain.
