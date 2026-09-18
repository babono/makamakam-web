import { SiteFooter, SiteHeader, Plaque } from "@/components/Shell";

const pillars = [
  {
    title: "Temukan",
    english: "Locate",
    body:
      "Cari satu nama, lalu berjalan. Denah blok, arah, dan jarak — sampai beberapa meter terakhir, yang ditempuh dengan mata lewat foto nisan dan satu kalimat penanda.",
  },
  {
    title: "Ziarah",
    english: "Tend",
    body:
      "Doa dan bacaan dalam Arab, Latin, dan artinya, mengikuti agama yang tercatat untuk almarhum. Bunga yang Anda tabur adalah bunga sungguhan; aplikasi hanya mencatat bahwa itu terjadi.",
  },
  {
    title: "Kenangan",
    english: "Gather",
    body:
      "Cerita yang hanya dipegang lingkaran luar — teman sekolah, tetangga lama — sampai kepada keluarga. Ditulis dari mana saja; dibaca di pemakaman.",
  },
];

const principles = [
  "Tidak ada pemberitahuan. Aplikasi ini tidak akan pernah mengingatkan Anda untuk berziarah.",
  "Tidak ada angka. Kunjungan dan bunga tidak dijumlah, tidak diperingkat.",
  "Tidak ada yang ditambahkan ke makam. Tidak ada plakat, tidak ada kode, tidak ada apa pun yang dipasang.",
  "Tidak ada bunga digital dan tidak ada pembelian apa pun.",
  "Tidak ada ziarah virtual. Aplikasi ini tidak menggantikan kedatangan.",
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-5">
        <section className="py-10 sm:py-16">
          <p className="eyebrow">iOS · Bahasa Indonesia &amp; English</p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-serif)] text-4xl leading-tight sm:text-5xl">
            Menemukan makam yang tidak pernah ditunjukkan kepada Anda.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Sepupu, teman lama, tetangga, rekan kerja. Merasa kehilangan, tidak punya peran, tidak
            tahu di mana makamnya, dan sungkan bertanya. Makamakam menuntun Anda ke satu makam,
            memberi tahu apa yang bisa dilakukan setibanya di sana, dan meneruskan apa yang Anda
            ingat kepada keluarga yang mungkin belum pernah mendengarnya.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded bg-ink px-4 py-2 text-sm text-plaque">
              Segera di TestFlight
            </span>
            <a
              href="#tiga-pilar"
              className="rounded border border-grass px-4 py-2 text-sm text-grass-deep hover:bg-grass-pale/30"
            >
              Apa yang dilakukannya
            </a>
          </div>
        </section>

        <section id="tiga-pilar" className="grid gap-4 py-6 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <Plaque key={pillar.title}>
              <p className="eyebrow">{pillar.english}</p>
              <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{pillar.body}</p>
            </Plaque>
          ))}
        </section>

        <section className="py-10">
          <Plaque className="sm:p-8">
            <p className="eyebrow">Aturan yang memandu seluruh aplikasi</p>
            <p className="mt-3 font-[family-name:var(--font-serif)] text-3xl">
              Kata-kata bisa menempuh jarak. Perbuatan tidak.
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
              Doa yang diucapkan sendirian di sebuah kamar sama sahnya dengan yang diucapkan di
              samping makam, jadi kata-kata boleh ditulis dari mana saja. Menabur bunga, berdoa di
              petaknya, membaca apa yang ditinggalkan orang lain — itu perbuatan, dan perbuatan
              perlu badan yang hadir di tempat.
            </p>
          </Plaque>
        </section>

        <section className="py-6">
          <h2 className="font-[family-name:var(--font-serif)] text-2xl">
            Yang tidak dilakukan aplikasi ini
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {principles.map((line) => (
              <li key={line} className="plaque flex gap-3 p-4 text-sm leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-grass" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="py-10">
          <Plaque className="sm:p-8">
            <h2 className="font-[family-name:var(--font-serif)] text-2xl">Untuk juru kunci dan pengurus</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
              Data makam berasal dari survei lapangan yang dilakukan dengan izin pengurus dan desa
              adat, lalu dibawa di dalam aplikasi supaya tetap bekerja tanpa jaringan. Pemutakhiran
              dilakukan lewat halaman admin, bukan lewat pihak ketiga.
            </p>
          </Plaque>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
