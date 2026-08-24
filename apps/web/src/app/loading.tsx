import Image from "next/image";

export default function Loading() {
  return (
    <main className="loading brand-loading">
      <Image
        className="brand-mark"
        src="/brand/karol-mark.png"
        alt="Marca da Karolzinha"
        width={72}
        height={72}
        priority
      />
      <p>Preparando seu foco…</p>
    </main>
  );
}
