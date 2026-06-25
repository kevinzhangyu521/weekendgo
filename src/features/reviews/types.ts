export type DestinationReview = {
  id: string;
  destinationId: string;
  userId: string;
  userName: string | null;
  userAvatarUrl: string | null;
  rating: number;
  content: string;
  suitableAge: "0-3" | "3-6" | "6-12" | "12+" | null;
  parkingRating: "easy" | "normal" | "hard" | null;
  toiletRating: "good" | "normal" | "poor" | null;
  safetyNote: string | null;
  recommend: boolean | null;
  visitDate: string | null;
  createdAt: string;
  isMine: boolean;
};
