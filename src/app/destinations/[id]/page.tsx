import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Backpack, Bath, Car, ChevronLeft, Clock, MapPinned, ShieldCheck, Star, TentTree, Users } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { DestinationFeedbackButton } from "@/components/feedback/destination-feedback-button";
import { AuthActionHint } from "@/components/auth/auth-action-hint";
import { AddToPlanButton } from "@/components/plans/add-to-plan-button";
import { AmapNavigationButton } from "@/components/plans/amap-navigation-button";
import { ReviewForm } from "@/components/reviews/review-form";
import { getDestinationImage, hasUsableDestinationImage } from "@/features/destinations/images";
import {
  destinationDescription,
  destinationAgeRange,
  destinationBestFor,
  destinationDecisionTags,
  destinationDifficulty,
  destinationFamilyHighlight,
  destinationName,
  destinationPackingList,
  destinationRegion,
  destinationSafety,
  destinationSafetyTip,
  destinationScenario,
  destinationTripDuration
} from "@/features/destinations/presenter";
import { getAllDestinations } from "@/features/destinations/repository";
import { getMyProfile } from "@/features/profiles/repository";
import { getDestinationReviewsForUser } from "@/features/reviews/repository";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import { getLocale, pick } from "@/lib/i18n/server";

function formatDistance(distanceKm: number, locale: "en" | "zh") {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "\u8ddd\u79bb\u5f85\u8ba1\u7b97");
  return pick(locale, `About ${distanceKm}km away`, `\u7ea6 ${distanceKm}km`);
}

function reviewAgeLabel(value: string | null, locale: "en" | "zh") {
  if (!value) return null;
  const labels: Record<string, { en: string; zh: string }> = {
    "0-3": { en: "Age 0-3", zh: "适合0-3岁" },
    "3-6": { en: "Age 3-6", zh: "适合3-6岁" },
    "6-12": { en: "Age 6-12", zh: "适合6-12岁" },
    "12+": { en: "Age 12+", zh: "适合12岁+" }
  };
  return pick(locale, labels[value]?.en ?? value, labels[value]?.zh ?? value);
}

function reviewParkingLabel(value: string | null, locale: "en" | "zh") {
  if (!value) return null;
  const labels: Record<string, { en: string; zh: string }> = {
    easy: { en: "Easy parking", zh: "停车方便" },
    normal: { en: "Parking is okay", zh: "停车一般" },
    hard: { en: "Hard to park", zh: "停车较难" }
  };
  return pick(locale, labels[value]?.en ?? value, labels[value]?.zh ?? value);
}

function reviewToiletLabel(value: string | null, locale: "en" | "zh") {
  if (!value) return null;
  const labels: Record<string, { en: string; zh: string }> = {
    good: { en: "Toilet convenient", zh: "厕所方便" },
    normal: { en: "Toilet is okay", zh: "厕所一般" },
    poor: { en: "Few toilets", zh: "厕所较少" }
  };
  return pick(locale, labels[value]?.en ?? value, labels[value]?.zh ?? value);
}

export default async function DestinationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id }] = await Promise.all([getLocale(), params]);
  const isZh = locale === "zh";
  const [user, profile, allDestinationsRaw] = await Promise.all([getCurrentUser(), getMyProfile(), getAllDestinations()]);
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const destinationRaw = allDestinationsRaw.find((item) => item.id === id) ?? null;

  if (!destinationRaw || !hasUsableDestinationImage(destinationRaw)) notFound();

  const [destination] = withDistanceFromCity([destinationRaw], homeCity);
  const related = withDistanceFromCity(
    allDestinationsRaw
      .filter((item) => item.id !== destination.id && (item.scenario === destination.scenario || item.city === destination.city))
      .slice(0, 3),
    homeCity
  );
  const decisionTags = destinationDecisionTags(destination, locale);
  const packingList = destinationPackingList(destination, locale);
  const { reviews, myReview } = await getDestinationReviewsForUser(destination.id, user?.id);
  const heroImage = getDestinationImage(destination);
  const loginHref = `/login?next=${encodeURIComponent(`/destinations/${destination.id}`)}`;

  return (
    <main className="min-h-screen bg-slate-50 pb-28 md:pb-12">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Link href="/destinations" className="interactive-text-link mb-4 inline-flex items-center gap-1 text-sm text-slate-600">
          <ChevronLeft className="h-4 w-4" />
          {pick(locale, "Back to destinations", "\u8fd4\u56de\u76ee\u7684\u5730\u5217\u8868")}
        </Link>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-64 overflow-hidden bg-slate-100 md:h-96">
            <img
              src={heroImage.src}
              alt={destinationName(destination, locale)}
              fetchPriority="high"
              decoding="async"
              className="interactive-image h-full w-full object-cover"
            />
          </div>
          <div className="space-y-4 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {destinationScenario(destination, locale)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {destinationDifficulty(destination, locale)}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
                {destinationSafety(destination, locale)}
              </span>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{destinationName(destination, locale)}</h1>
              <DestinationFeedbackButton destinationName={destinationName(destination, locale)} />
            </div>
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-800">{destinationFamilyHighlight(destination, locale)}</p>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 lg:grid-cols-[auto_minmax(240px,1fr)_auto_auto] lg:items-center">
              <div className="flex flex-wrap items-center gap-3">
                <FavoriteButton destinationId={destination.id} initialIsLoggedIn={Boolean(user)} />
                <AddToPlanButton destinationId={destination.id} locale={locale} />
              </div>
              <AuthActionHint text={pick(locale, "Sign in to save destinations and add them to your weekend plan.", "\u767b\u5f55\u540e\u53ef\u6536\u85cf\u5730\u70b9\u3001\u52a0\u5165\u5468\u672b\u8ba1\u5212")} />
              <div className="hidden md:block">
                <AmapNavigationButton
                  destination={destination}
                  label={pick(locale, "Navigate", "\u7acb\u5373\u5bfc\u822a")}
                  isSignedIn={Boolean(user)}
                  loginHref={loginHref}
                  signedOutLabel={pick(locale, "Sign in to navigate", "\u767b\u5f55\u540e\u5bfc\u822a")}
                />
              </div>
              <span className="text-sm text-slate-600 lg:text-right">{pick(locale, "Save or add to plan", "\u6536\u85cf\u6216\u52a0\u5165\u8ba1\u5212")}</span>
            </div>
            <p className="text-slate-600">{destinationDescription(destination, locale)}</p>
            <div className="flex flex-wrap gap-2">
              {decisionTags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "Region", "\u7701\u5e02")}</p>
                <p className="mt-1 font-medium">{destinationRegion(destination, locale)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "Distance", "\u8ddd\u79bb")}</p>
                <p className="mt-1 font-medium">{formatDistance(destination.distanceKm, locale)}</p>
                <p className="mt-1 text-xs text-slate-500">{pick(locale, `From ${homeCity}`, `\u6309\u5e38\u4f4f\u57ce\u5e02\u300c${homeCity}\u300d\u8ba1\u7b97`)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "Suitable age", "\u9002\u5408\u5e74\u9f84")}</p>
                <p className="mt-1 font-medium">{destinationAgeRange(destination, locale)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "Rating", "\u8bc4\u5206")}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-medium">
                  <Star className="h-4 w-4 fill-current text-amber-500" />
                  {destination.rating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <h2 className="mb-2 inline-flex items-center gap-2 text-base font-semibold text-emerald-950">
              <Users className="h-4 w-4" />
              {pick(locale, "Best for", "\u9002\u5408\u8c01\u53bb")}
            </h2>
            <p className="text-sm leading-6 text-emerald-900">{destinationBestFor(destination, locale)}</p>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h2 className="mb-2 inline-flex items-center gap-2 text-base font-semibold text-sky-950">
              <Clock className="h-4 w-4" />
              {pick(locale, "Suggested time", "\u5efa\u8bae\u6e38\u73a9\u65f6\u957f")}
            </h2>
            <p className="text-sm leading-6 text-sky-900">{destinationTripDuration(destination, locale)}</p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <h2 className="mb-2 inline-flex items-center gap-2 text-base font-semibold text-amber-950">
              <AlertTriangle className="h-4 w-4" />
              {pick(locale, "Main reminder", "\u4e3b\u8981\u63d0\u9192")}
            </h2>
            <p className="text-sm leading-6 text-amber-900">{destinationSafetyTip(destination, locale)}</p>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <TentTree className="h-4 w-4" />
              {pick(locale, "Facilities", "\u8bbe\u65bd\u4fe1\u606f")}
            </h2>
            <div className="space-y-2 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2">
                <Car className="h-4 w-4" />
                {isZh ? (destination.hasParking ? "\u53ef\u505c\u8f66" : "\u505c\u8f66\u4f4d\u8f83\u5c11") : destination.hasParking ? "Parking available" : "Parking is limited"}
              </p>
              <p className="inline-flex items-center gap-2">
                <Bath className="h-4 w-4" />
                {isZh ? (destination.hasToilet ? "\u6709\u516c\u5171\u5395\u6240" : "\u5395\u6240\u8f83\u5c11") : destination.hasToilet ? "Public toilet available" : "Limited toilet access"}
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPinned className="h-4 w-4" />
                {pick(locale, "Suitable for half-day or full-day trips", "\u9002\u5408\u534a\u65e5\u6216\u4e00\u65e5\u5f80\u8fd4")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
            <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4" />
              {pick(locale, "Family Safety Notes", "\u4eb2\u5b50\u5b89\u5168\u63d0\u793a")}
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>{pick(locale, "Check weather and rain forecast before departure, especially for creek routes.", "\u51fa\u53d1\u524d\u8bf7\u68c0\u67e5\u5929\u6c14\u4e0e\u964d\u96e8\u60c5\u51b5\uff0c\u6d89\u6c34\u8def\u7ebf\u9700\u66f4\u8c28\u614e\u3002")}</li>
              <li>{pick(locale, "Keep young children in clear sight and use anti-slip shoes near water.", "\u4f4e\u9f84\u5b69\u5b50\u8bf7\u5168\u7a0b\u5728\u5bb6\u957f\u53ef\u89c6\u8303\u56f4\u5185\uff0c\u5efa\u8bae\u7a7f\u9632\u6ed1\u978b\u3002")}</li>
              <li>{pick(locale, "Carry water, sunscreen, and a small first-aid kit as a fixed checklist.", "\u8865\u6c34\u3001\u9632\u6652\u548c\u6025\u6551\u5305\u5efa\u8bae\u4f5c\u4e3a\u56fa\u5b9a\u6e05\u5355\u643a\u5e26\u3002")}</li>
            </ul>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <Backpack className="h-4 w-4" />
            {pick(locale, "Before Departure Checklist", "\u51fa\u53d1\u524d\u51c6\u5907\u6e05\u5355")}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {packingList.map((item) => (
              <div key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{pick(locale, "Real Family Experiences", "\u771f\u5b9e\u4eb2\u5b50\u4f53\u9a8c")}</h2>
              <p className="mt-1 text-sm text-slate-600">{pick(locale, "Short notes from families who have been there.", "\u6765\u81ea\u7528\u6237\u7684\u771f\u5b9e\u6e38\u73a9\u53cd\u9988\uff0c\u5e2e\u52a9\u522b\u7684\u5bb6\u5ead\u5c11\u8e29\u5751\u3002")}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {pick(locale, `${reviews.length} reviews`, `${reviews.length} \u6761\u4f53\u9a8c`)}
            </span>
          </div>

          <ReviewForm destinationId={destination.id} initialReview={myReview} isSignedIn={Boolean(user)} />

          <div className="mt-4 space-y-3">
            {reviews.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                {pick(locale, "No real experiences yet. Be the first family to share.", "\u6682\u65e0\u771f\u5b9e\u4f53\u9a8c\uff0c\u4f60\u53ef\u4ee5\u6210\u4e3a\u7b2c\u4e00\u4e2a\u5206\u4eab\u7684\u5bb6\u5ead\u3002")}
              </div>
            ) : (
              reviews.map((review) => {
                const tags = [
                  reviewAgeLabel(review.suitableAge, locale),
                  reviewParkingLabel(review.parkingRating, locale),
                  reviewToiletLabel(review.toiletRating, locale),
                  review.recommend === true ? pick(locale, "Would go again", "推荐再去") : review.recommend === false ? pick(locale, "Would not rush back", "不太推荐") : null
                ].filter(Boolean);

                return (
                  <article key={review.id} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-slate-300"}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {review.isMine ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">{"我的体验"}</span> : null}
                        {review.visitDate ? <span>{review.visitDate}</span> : null}
                      </div>
                    </div>
                    {tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {review.safetyNote ? (
                      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                        <span className="font-semibold">{pick(locale, "Safety note: ", "安全提醒：")}</span>
                        {review.safetyNote}
                      </p>
                    ) : null}
                    <p className="mt-3 leading-6">{review.content}</p>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900">{pick(locale, "Related Picks", "\u76f8\u5173\u63a8\u8350")}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {related.map((item) => {
              const image = getDestinationImage(item);
              return (
                <Link
                  key={item.id}
                  href={`/destinations/${item.id}`}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative h-28 overflow-hidden bg-slate-100">
                    <img
                      src={image.src}
                      alt={destinationName(item, locale)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-900">{destinationName(item, locale)}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {destinationRegion(item, locale)} - {formatDistance(item.distanceKm, locale)} - {pick(locale, "Rating", "\u8bc4\u5206")} {item.rating.toFixed(1)}
                  </p>
                </div>
                </Link>
              );
            })}
          </div>
        </section>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{destinationName(destination, locale)}</p>
            <p className="text-xs text-slate-500">{formatDistance(destination.distanceKm, locale)}</p>
          </div>
          <AmapNavigationButton
            destination={destination}
            label={pick(locale, "Navigate", "\u7acb\u5373\u5bfc\u822a")}
            className="h-11 shrink-0"
            isSignedIn={Boolean(user)}
            loginHref={loginHref}
            signedOutLabel={pick(locale, "Sign in to navigate", "\u767b\u5f55\u540e\u5bfc\u822a")}
          />
        </div>
      </div>
    </main>
  );
}
