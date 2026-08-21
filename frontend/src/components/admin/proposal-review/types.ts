export type ReviewSection =
  | "overview"
  | "documents"
  | "internalDocuments"
  | "comments";

export interface SampleDocument {
  name: string;
  pages: number;
  size: string;
  title: string;
  updated: string;
}
