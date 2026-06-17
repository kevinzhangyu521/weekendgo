import type { MetadataRoute } from "next";
import { hasUsableDestinationImage } from "@/features/destinations/images";
import { getAllDestinations } from "@/features/destinations/repository";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.qimeide.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const now = new Date();
  const destinations = (await getAllDestinations()).filter(hasUsableDestinationImage);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/destinations",
    "/map",
    "/weather",
    "/login",
    "/submit-spot"
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7
  }));

  const destinationRoutes: MetadataRoute.Sitemap = destinations.map((destination) => ({
    url: `${baseUrl}/destinations/${destination.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticRoutes, ...destinationRoutes];
}
