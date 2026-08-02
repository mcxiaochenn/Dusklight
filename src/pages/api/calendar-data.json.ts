import { getCollection } from "astro:content";
import { getPostSlug } from "@/utils/abbrlink";

export async function GET() {
  const posts = (await getCollection("blog"))
    .filter((p) => !p.data.draft && !p.data.password)
    .map((p) => ({
      id: getPostSlug(p),
      title: p.data.title,
      date: p.data.date.toISOString().slice(0, 10),
    }));
  return new Response(JSON.stringify(posts), {
    headers: { "Content-Type": "application/json" },
  });
}
