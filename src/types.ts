
export type Role = 'अध्यक्षा' | 'सचिव' | 'खजिनदार' | 'सदस्य' | string;

export interface Member {
  id: string;
  name: string;
  role: Role;
  monthlySaving: number;
  joinedAt: string;
}

export interface Meeting {
  id: string;
  date: string;
  note?: string;
  totalCollection: number;
}

export interface MeetingRecord {
  id: string;
  meetingId: string;
  memberId: string;
  memberName: string;
  loan: number;
  interest: number;
  saving: number;
  total: number;
}

export interface AppSettings {
  appName: string;
  interestRate: number;
  monthlySaving: number;
  theme: string;
}
