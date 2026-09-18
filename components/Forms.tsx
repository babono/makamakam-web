import type { Cemetery, Grave } from "@/lib/types";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" className="rounded bg-grass px-4 py-2 text-sm text-plaque">
      {children}
    </button>
  );
}

export function DangerButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" className="rounded border border-engraved px-4 py-2 text-sm text-engraved">
      {children}
    </button>
  );
}

export function CemeteryFields({ cemetery }: { cemetery?: Cemetery }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" defaultValue={cemetery?.id ?? ""} />
      <div className="sm:col-span-2">
        <Field label="Nama pemakaman">
          <input name="name" defaultValue={cemetery?.name} required />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Alamat">
          <input name="address" defaultValue={cemetery?.address} required />
        </Field>
      </div>
      <Field
        label="Lintang"
        hint="Enam desimal disimpan; paling banyak lima yang layak dipercaya (±1 m)."
      >
        <input name="latitude" type="number" step="0.000001" defaultValue={cemetery?.latitude ?? ""} required />
      </Field>
      <Field label="Bujur">
        <input name="longitude" type="number" step="0.000001" defaultValue={cemetery?.longitude ?? ""} required />
      </Field>
      <Field label="Radius kehadiran (meter)" hint="Sejauh mana masih dihitung berada di pemakaman.">
        <input name="radiusMeters" type="number" step="1" defaultValue={cemetery?.radiusMeters ?? 120} required />
      </Field>
      <Field label="Blok yang disurvei">
        <input name="surveyedSection" defaultValue={cemetery?.surveyedSection ?? "A"} required />
      </Field>
      <Field label="Jumlah baris">
        <input name="rows" type="number" step="1" defaultValue={cemetery?.rows ?? 6} required />
      </Field>
      <Field label="Petak per baris">
        <input name="plotsPerRow" type="number" step="1" defaultValue={cemetery?.plotsPerRow ?? 5} required />
      </Field>
      <Field label="Arah baring makam (derajat)" hint="0 = utara. Dipakai menggambar makam sebagai persegi panjang, bukan titik.">
        <input name="graveBearing" type="number" step="1" defaultValue={cemetery?.graveBearing ?? ""} />
      </Field>
      <div className="sm:col-span-2">
        <Field
          label="Sudut pagar (x,y per baris, meter dari gerbang)"
          hint="Ditelusuri dengan meteran mengelilingi pagar. Bentuk tembok adalah petunjuk terkuat di denah — orang mencocokkan bentuk, bukan titik."
        >
          <textarea
            name="boundary"
            rows={4}
            defaultValue={(cemetery?.boundary ?? []).map((pair) => pair.join(", ")).join("\n")}
            placeholder={"0, 0\n50.8, 18.4\n42.6, 38.8"}
          />
        </Field>
      </div>
    </div>
  );
}

const faiths = ["islam", "hindu", "kristen", "katolik", "buddha", "konghucu", "other"];

export function GraveFields({ grave, cemeteryId }: { grave?: Grave; cemeteryId: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" defaultValue={grave?.id ?? ""} />
      <input type="hidden" name="cemeteryId" defaultValue={cemeteryId} />

      <div className="sm:col-span-2">
        <Field label="Nama seperti tertulis di nisan">
          <input name="name" defaultValue={grave?.name} required />
        </Field>
      </div>
      <Field label="Nama ayah" hint="Tanpa bin/binti — aplikasi menambahkannya dari jenis kelamin.">
        <input name="fatherName" defaultValue={grave?.fatherName ?? ""} />
      </Field>
      <Field label="Jenis kelamin">
        <select name="gender" defaultValue={grave?.gender ?? ""}>
          <option value="">Tidak tercatat</option>
          <option value="m">Laki-laki</option>
          <option value="f">Perempuan</option>
        </select>
      </Field>
      <Field label="Tahun lahir">
        <input name="birthYear" type="number" step="1" defaultValue={grave?.birthYear ?? ""} />
      </Field>
      <Field label="Tanggal wafat" hint="yyyy-mm-dd, seperti tertulis di nisan.">
        <input name="deathDate" defaultValue={grave?.deathDate ?? ""} placeholder="2023-05-08" />
      </Field>
      <Field label="Agama" hint="Kosongkan bila survei tidak bisa memastikannya. Jangan menebak dari nama.">
        <select name="religion" defaultValue={grave?.religion ?? ""}>
          <option value="">Tidak tercatat</option>
          {faiths.map((faith) => (
            <option key={faith} value={faith}>
              {faith}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Blok">
        <input name="section" defaultValue={grave?.section ?? "A"} required />
      </Field>
      <Field label="Baris">
        <input name="row" type="number" step="1" defaultValue={grave?.row ?? 1} required />
      </Field>
      <Field label="Petak">
        <input name="plot" type="number" step="1" defaultValue={grave?.plot ?? 1} required />
      </Field>
      <Field label="Lintang">
        <input name="latitude" type="number" step="0.000001" defaultValue={grave?.latitude ?? ""} required />
      </Field>
      <Field label="Bujur">
        <input name="longitude" type="number" step="0.000001" defaultValue={grave?.longitude ?? ""} required />
      </Field>
      <Field
        label="Jarak ke timur dari gerbang (m)"
        hint="Diukur dengan meteran, bukan GPS. Inilah yang dipakai menggambar denah."
      >
        <input name="x" type="number" step="0.1" defaultValue={grave?.x ?? ""} />
      </Field>
      <Field label="Jarak ke utara dari gerbang (m)">
        <input name="y" type="number" step="0.1" defaultValue={grave?.y ?? ""} />
      </Field>
      <Field label="Arah baring nisan (derajat)" hint="Kosongkan bila tidak diukur — akan mengikuti arah umum pemakaman.">
        <input name="bearing" type="number" step="1" defaultValue={grave?.bearing ?? ""} />
      </Field>

      <div className="sm:col-span-2">
        <Field
          label="Penanda"
          hint="Satu kalimat yang menjembatani beberapa meter terakhir. Tulis apa yang dilihat mata, bukan arah mata angin."
        >
          <textarea name="landmark" rows={3} defaultValue={grave?.landmark ?? ""} required />
        </Field>
      </div>
      <Field label="Penjaga catatan (keluarga inti)">
        <input name="stewardName" defaultValue={grave?.stewardName ?? ""} />
      </Field>
      <div className="sm:col-span-2">
        <Field
          label="Riwayat hidup (Markdown)"
          hint="Ditulis keluarga, dibaca di aplikasi. Paragraf, judul dengan #, daftar dengan -. Boleh dikosongkan — kebanyakan makam memang tidak punya."
        >
          <textarea name="profileMarkdown" rows={8} defaultValue={grave?.profileMarkdown ?? ""} />
        </Field>
      </div>
      <Field label="Siapa yang boleh membaca dinding" hint="Sebagian keluarga tidak menginginkan dinding sama sekali, dan itu hak mereka.">
        <select name="wallVisibility" defaultValue={grave?.wallVisibility ?? "open"}>
          <option value="open">Terbuka untuk siapa pun</option>
          <option value="family">Hanya keluarga</option>
          <option value="closed">Ditutup</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input
          type="checkbox"
          name="verified"
          defaultChecked={grave?.verified ?? false}
          className="h-4 w-4"
        />
        Sudah dicek di lokasi
      </label>
    </div>
  );
}
