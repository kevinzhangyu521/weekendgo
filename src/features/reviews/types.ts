export type DestinationReview = {
  id: string;
  destinationId: string;
  userId: string;
  rating: number;
  content: string;
  visitDate: string | null;
  createdAt: string;
  isMine: boolean;
};
