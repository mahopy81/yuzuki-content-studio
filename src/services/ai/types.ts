import type { LiveStreamType, Theme } from "@/types/content";

export type SlideTemplateType =
  | "cover"
  | "problem"
  | "deep_pain"
  | "reason"
  | "solution"
  | "steps"
  | "example"
  | "mistake"
  | "summary"
  | "cta";

export type GeneratedContentSet = {
  themeId: string;
  instagramCarousel: {
    title: string;
    slides: {
      templateType: SlideTemplateType;
      label?: string;
      title: string;
      body: string;
      note?: string;
      cta?: string;
    }[];
  };
  instagramCaption: {
    hook: string;
    body: string;
    cta: string;
    hashtags: string[];
  };
  instagramReel: {
    title: string;
    hook: string;
    script: string;
    cuts: string[];
    telops: string[];
    cta: string;
  };
  youtube: {
    title: string;
    thumbnailText: string;
    hook: string;
    outline: string[];
    script: string;
    description: string;
    cta: string;
  };
  youtubeLives: {
    title: string;
    liveStreamType: LiveStreamType;
    thumbnailText: string;
    theme: string;
    purpose: string;
    targetAudience: string;
    scheduledDate?: string;
    startTime?: string;
    estimatedDurationMinutes: number;
    openingGreeting: string;
    openingHook: string;
    outline: string[];
    sections: {
      title: string;
      estimatedMinutes: number;
      talkingPoints: string[];
      script: string;
    }[];
    chatTopics: string[];
    commentPickupPoints: string[];
    questionsForViewers: string[];
    interactiveIdeas: string[];
    workContent?: string;
    explanationItems?: string[];
    announcement: string;
    cta: string;
    endingScript: string;
    clipIdeas: string[];
    repurposeIdeas: string[];
  }[];
  note: {
    title: string;
    lead: string;
    headings: string[];
    body: string;
    cta: string;
  };
  threads: {
    posts: string[];
  };
  x: {
    posts: string[];
  };
};

export type GenerateContentInput = {
  theme: Theme;
};
