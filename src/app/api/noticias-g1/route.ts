import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://g1.globo.com/rss/g1/meio-ambiente/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const xml = await res.text();
    const items = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    let idx = 0;

    while ((m = regex.exec(xml)) !== null && items.length < 5) {
      const block = m[1];
      const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
      const subtitleMatch =
        block.match(/<atom:subtitle>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/atom:subtitle>/) ||
        block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      const dateMatch = block.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/);
      const imgMatch = block.match(/url=["'](https:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);

      if (titleMatch && linkMatch) {
        const rawLink = linkMatch[1].trim();
        // Validação de segurança: apenas links HTTPS válidos
        if (!/^https:\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+$/.test(rawLink)) {
          continue;
        }

        const sanitizeText = (txt: string) =>
          txt
            .replace(/<[^>]+>/g, "")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .trim();

        const rawDesc = subtitleMatch ? subtitleMatch[1] : "";
        const cleanDesc = sanitizeText(rawDesc);
        const cleanTitle = sanitizeText(titleMatch[1]);

        let dataFormatada = "";
        if (dateMatch) {
          try {
            const d = new Date(dateMatch[1]);
            dataFormatada = d.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            dataFormatada = dateMatch[1];
          }
        }

        const safeImg = imgMatch && /^https:\/\//i.test(imgMatch[1]) ? imgMatch[1] : undefined;

        items.push({
          id: `g1-${idx++}`,
          titulo: cleanTitle,
          introducao: cleanDesc.slice(0, 220) + (cleanDesc.length > 220 ? "..." : ""),
          data_publicacao: dataFormatada,
          link: rawLink,
          fonte: "clima",
          fonteNome: "G1 Meio Ambiente & Clima",
          categoria: "clima",
          imagemUrl: safeImg,
        });
      }
    }

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

