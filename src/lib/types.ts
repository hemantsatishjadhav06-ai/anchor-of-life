export type Lang = 'en' | 'hi';

export interface Video {
  video_id: string;
  title: string;
  url: string;
  duration_sec: number | null;
  language: string | null;
  word_count: number | null;
  published_at: string | null;
  series: string | null;
  thumbnail_url: string;
}

export interface Segment {
  id: number;
  video_id: string;
  seg_idx: number;
  start_sec: number;
  end_sec: number;
  text: string;
}

export interface Citation {
  video_id: string;
  title: string;
  url: string;
  start_sec: number;
  end_sec: number;
  quote: string;
  series: string | null;
}

export interface AnswerLens {
  inner: boolean;     // psychological / inner-work framing
  jyotish: boolean;   // astrological framing
  practice: boolean;  // remedy / action / ritual
}

export interface AnswerEnvelope {
  answer_md: string;          // markdown body, may include {{cite:N}} markers
  primary_citation_index: number;
  citations: Citation[];      // numbered, primary first
  lens: AnswerLens;
  related_topics: string[];   // community labels
  language: Lang;
  total_mentions: number;     // "spoken about N times"
  composer_model: string;
}

export interface Concept {
  id: string;
  label: string;
  community_id: number | null;
  community_label: string | null;
  source_video_ids: string[];
  degree: number;
}

export interface Topic {
  community_id: number;
  label: string;
  size: number;
  cohesion: number;
  top_concepts: Concept[];
  video_ids: string[];
}
