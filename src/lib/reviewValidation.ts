import type { VenueReviewInput } from "@/types/reviews";

export interface ReviewValidationResult {
  errors: Record<string, string>;
  isValid: boolean;
}

export function validateReviewInput(input: VenueReviewInput): ReviewValidationResult {
  const errors: Record<string, string> = {};
  const body = input.body.trim();
  const title = input.title?.trim() ?? "";

  if (input.rating < 1 || input.rating > 5) {
    errors.rating = "Choose a rating from 1 to 5.";
  }

  if (!body) {
    errors.body = "Write a short review.";
  } else if (body.length < 10) {
    errors.body = "Review must be at least 10 characters.";
  } else if (body.length > 1000) {
    errors.body = "Review must be 1000 characters or fewer.";
  }

  if (title.length > 80) {
    errors.title = "Title must be 80 characters or fewer.";
  }

  if (input.visitDate) {
    const visitDate = new Date(`${input.visitDate}T00:00:00`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (Number.isNaN(visitDate.getTime())) {
      errors.visitDate = "Enter a valid visit date.";
    } else if (visitDate > today) {
      errors.visitDate = "Visit date cannot be in the future.";
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
