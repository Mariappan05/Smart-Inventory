export type KpiCard = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
};

export type ProductStatus = {
  id: string;
  name: string;
  location: string;
  status: "online" | "maintenance" | "offline";
  lastService: string;
  uptime: string;
  imageUrl?: string;
};

export type ProcessCard = {
  id: string;
  name: string;
  total: number;
  completed: number;
  pending: number;
  icon?: string;
  color?: string;
};

export type RecentRecord = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  imageUrl?: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  timestamp: string;
  tag: string;
  imageUrl?: string;
  movedBy?: string | null;
  movedByImageUrl?: string;
};

export type AlertItem = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
};

export type DashboardData = {
  kpis: KpiCard[];
  processCards: ProcessCard[];
  recentRecords: RecentRecord[];
  activities: ActivityItem[];
  alerts: AlertItem[];
};
