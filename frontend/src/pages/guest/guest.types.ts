export interface FriendContribution {
  id: string;
  name: string;
  avatar: string | null;
  date: string;
  text: string;
  image: string | null;
}

export interface SharedMemory {
  date: string;
  text: string;
  image: string | null;
  ownerName: string;
  friendContributions: FriendContribution[];
}
