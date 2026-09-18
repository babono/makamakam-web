import type { Metadata } from "next";
import { SiteFooter, SiteHeader, Plaque } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Apa yang disimpan Makamakam, di mana, dan apa yang tidak pernah dikumpulkan.",
};

/**
 * Written to match what the app actually does. Every claim here is checkable in
 * the source: no analytics SDK, no notification entitlement, no network call on
 * any screen but the cemetery search.
 */
const sections = [
  {
    title: "Ringkasnya",
    body: [
      "Makamakam tidak punya akun untuk peziarah, tidak memasang alat pelacak, dan tidak menampilkan iklan.",
      "Catatan pribadi, catatan kunjungan, dan foto yang Anda ambil tersimpan di ponsel Anda sendiri.",
      "Aplikasi bekerja penuh tanpa jaringan. Satu-satunya bagian yang memerlukan internet adalah pencarian pemakaman lain di peta.",
    ],
  },
  {
    title: "Lokasi",
    body: [
      "Izin lokasi dipakai untuk dua hal: menuntun Anda ke makam, dan memastikan Anda benar-benar berada di pemakaman saat membuka tuntunan ziarah atau membaca kenangan.",
      "Lokasi Anda diproses di dalam ponsel dan tidak dikirim ke server kami. Kami tidak menyimpan riwayat perjalanan Anda.",
      "Izin diminta saat pertama kali Anda meminta petunjuk jalan — bukan saat aplikasi dibuka, dan bukan untuk mencari nama.",
    ],
  },
  {
    title: "Yang Anda tulis",
    body: [
      "Catatan pribadi hanya ada di ponsel Anda. Tidak dikirim ke keluarga, tidak ke kami, tidak ke mana pun.",
      "Kenangan untuk keluarga memang dimaksudkan untuk dibaca orang lain, dan dikirim bersama nama serta hubungan yang Anda tulis. Keluarga yang memegang catatan makam dapat menampilkan atau menghapusnya.",
      "Nama dan hubungan yang Anda isi di Pengaturan disimpan di ponsel ini saja, dan dipakai untuk menandatangani apa yang Anda kirim.",
    ],
  },
  {
    title: "Foto",
    body: [
      "Foto nisan dan foto almarhum berasal dari survei lapangan, diambil dengan izin pengurus pemakaman dan keluarga.",
      "Foto yang Anda ambil sendiri lewat mode lapangan tersimpan di ponsel Anda.",
      "Keluarga yang memegang catatan makam dapat meminta penghapusan foto atau kenangan melalui alamat di bawah.",
    ],
  },
  {
    title: "Pencarian pemakaman di peta",
    body: [
      "Saat Anda mengetik nama pemakaman atau kota, kata yang Anda ketik dikirim ke layanan peta Apple untuk dicarikan hasilnya. Nama almarhum tidak pernah ikut dikirim.",
      "Pencarian nama almarhum berlangsung sepenuhnya di dalam ponsel, atas data yang sudah dibawa aplikasi.",
    ],
  },
  {
    title: "Yang tidak kami kumpulkan",
    body: [
      "Tidak ada analitik, tidak ada SDK pihak ketiga, tidak ada identitas iklan.",
      "Tidak ada pemberitahuan. Aplikasi tidak akan mengingatkan Anda untuk berziarah, termasuk pada hari wafat.",
      "Tidak ada angka kunjungan yang dijumlah atau diperingkat, di dalam aplikasi maupun di tempat lain.",
    ],
  },
  {
    title: "Halaman admin",
    body: [
      "Halaman admin di situs ini dipakai pengurus untuk memutakhirkan data makam. Masuk dengan Apple, dan hanya alamat yang sudah didaftarkan yang diizinkan.",
      "Catatan makam — nama, letak, penanda, foto nisan — memang dimaksudkan untuk dibaca umum di dalam aplikasi.",
    ],
  },
  {
    title: "Hubungi kami",
    body: [
      "Untuk koreksi data, penghapusan foto atau kenangan, atau pertanyaan apa pun tentang halaman ini: halo@makamakam.com.",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-10">
        <h1 className="pt-6 font-[family-name:var(--font-serif)] text-4xl">Kebijakan Privasi</h1>
        <p className="mt-3 text-ink-soft">Berlaku sejak 15 September 2026.</p>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <Plaque key={section.title}>
              <h2 className="font-[family-name:var(--font-serif)] text-2xl">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.body.map((line) => (
                  <li key={line} className="text-sm leading-relaxed text-ink-soft">
                    {line}
                  </li>
                ))}
              </ul>
            </Plaque>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
