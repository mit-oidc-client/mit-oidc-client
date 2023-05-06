export interface MessageType {
  sender: string;
  text: string;
  sig: string;
}

export interface DisplayedMessageType extends MessageType {
  id: number
  verifyStatus: 'unverified' | 'loading' | 'verified' | 'failed'
}