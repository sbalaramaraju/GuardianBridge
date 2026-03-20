export interface Location {
  lat: number;
  lng: number;
}

export interface Incident {
  id?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: Location;
  status: 'reported' | 'dispatched' | 'resolved';
  timestamp: any; // Firestore Timestamp
  reporterId: string;
  actions: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'reporter' | 'responder' | 'admin';
}
