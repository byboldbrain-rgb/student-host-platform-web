export type LostItemStatus = "available" | "claimed" | "delivered";

export interface LostItem {
  id: string;
  governorate: string;
  university: string;
  faculty: string | null;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  found_location: string | null;
  found_date: string | null;
  holder_name: string;
  holder_phone: string | null;
  holder_email: string | null;
  status: LostItemStatus;
  created_at: string;
}

export interface University {
  id: string;
  governorate: string;
  name: string;
  created_at: string;
}