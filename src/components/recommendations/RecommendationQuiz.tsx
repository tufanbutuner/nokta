import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { DEFAULT_CITY, getCityOptions } from "@/lib/cities";
import { Separator } from "@/components/ui/separator";
import { FEATURE_OPTIONS, PRICE_OPTIONS, VIBE_OPTIONS } from "@/lib/venueFilters";
import type { RecommendationOccasion, RecommendationPreferences } from "@/types/recommendations";
import type { PriceLevel, VenueVibe } from "@/types/venue";

const OCCASION_OPTIONS: { label: string; value: RecommendationOccasion | "any" }[] = [
  { label: "No preference", value: "any" },
  { label: "Solo", value: "solo" },
  { label: "Date", value: "date" },
  { label: "Small group", value: "small-group" },
  { label: "Big group", value: "big-group" },
  { label: "Watch football", value: "football" },
  { label: "Late night plan", value: "late-night" },
];

const DISTANCE_OPTIONS = [
  { label: "No preference", value: "none" },
  { label: "Nearby preferred", value: "nearby" },
  { label: "Nearest possible", value: "nearest" },
] as const;

const INITIAL_PREFERENCES: RecommendationPreferences = {
  city: DEFAULT_CITY,
  vibes: [],
  priceLevel: "any",
  occasion: "any",
  features: {
    indoor: false,
    outdoor: false,
    food: false,
    alcohol: false,
    openLate: false,
  },
  distancePreference: "none",
};

export function RecommendationQuiz({
  locationAvailable,
  onSubmit,
}: {
  locationAvailable: boolean;
  onSubmit: (preferences: RecommendationPreferences) => void;
}) {
  const [preferences, setPreferences] = useState<RecommendationPreferences>(INITIAL_PREFERENCES);

  function toggleVibe(vibe: VenueVibe) {
    setPreferences((current) => ({
      ...current,
      vibes: current.vibes.includes(vibe) ? current.vibes.filter((item) => item !== vibe) : [...current.vibes, vibe],
    }));
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6">
        <div>
          <p className="text-sm text-muted-foreground">Find my spot</p>
          <h1 className="mt-2 text-4xl font-semibold">Tell us what tonight needs.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Answer a few quick questions and we’ll rank venues using the local Sheesha guide.</p>
        </div>

        <Separator />

        <section className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recommend-city">
            Where are you looking?
          </label>
          <Select
            id="recommend-city"
            value={preferences.city}
            onChange={(event) => setPreferences({ ...preferences, city: event.target.value })}
            options={getCityOptions({ activeOnly: true })}
            className="w-full md:max-w-xs"
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">What kind of vibe do you want?</h2>
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map((option) => {
              const selected = preferences.vibes.includes(option.value);
              return (
                <Button key={option.value} type="button" variant={selected ? "default" : "outline"} size="sm" onClick={() => toggleVibe(option.value)}>
                  {option.label}
                </Button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="recommend-budget">
              What is your budget?
            </label>
            <Select
              id="recommend-budget"
              value={String(preferences.priceLevel)}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  priceLevel: event.target.value === "all" ? "any" : (Number(event.target.value) as PriceLevel),
                })
              }
              options={[{ label: "Any budget", value: "all" }, ...PRICE_OPTIONS.filter((option) => option.value !== "all")]}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="recommend-occasion">
              Who are you going with?
            </label>
            <Select
              id="recommend-occasion"
              value={preferences.occasion}
              onChange={(event) => setPreferences({ ...preferences, occasion: event.target.value as RecommendationPreferences["occasion"] })}
              options={OCCASION_OPTIONS}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="recommend-distance">
              Do you want somewhere close?
            </label>
            <Select
              id="recommend-distance"
              value={preferences.distancePreference}
              onChange={(event) => setPreferences({ ...preferences, distancePreference: event.target.value as RecommendationPreferences["distancePreference"] })}
              options={[...DISTANCE_OPTIONS]}
              className="w-full"
            />
            {preferences.distancePreference !== "none" && !locationAvailable ? (
              <p className="text-xs text-muted-foreground">Use your location to include distance in recommendations.</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">What features matter?</h2>
          <div className="flex flex-wrap gap-2">
            {FEATURE_OPTIONS.map((option) => {
              const selected = preferences.features[option.value];
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      features: { ...preferences.features, [option.value]: !selected },
                    })
                  }
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </section>

        <Button size="default" onClick={() => onSubmit(preferences)}>
          Show recommendations
        </Button>
      </CardContent>
    </Card>
  );
}
