export interface SiteSettings {
  siteTitle: string;
  landingQuote: [string, string, string];
  landingSubtitle: string;
  aboutBio: string;
  aboutDetail: string;
  aboutMeta: { base: string; subject: string; pace: string; format: string };
  aboutImage: string;
}
