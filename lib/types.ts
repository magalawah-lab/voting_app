export interface Class {
  id: string;
  name: string;
  created_at: string;
}

export interface Election {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
  election_id: string | null;
  password: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  election_id: string | null;
  name: string;
  position: string | null;
  manifesto: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  election_id: string;
  student_id: string;
  candidate_id: string;
  position: string;
  voted_at: string;
}
