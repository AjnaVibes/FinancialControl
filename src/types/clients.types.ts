// src/types/clients.types.ts

export interface Client {
  id: number;
  name?: string | null;
  birthday?: Date | null;
  email?: string | null;
  address?: string | null;
  birthplace?: string | null;
  curp?: string | null;
  electorKey?: string | null;
  mobile?: string | null;
  phone?: string | null;
  fLastname?: string | null;
  mLastname?: string | null;
  state?: string | null;
  maritalStatus?: number | null;
  maritalRegistry?: number | null;
  street?: string | null;
  interiorNumber?: string | null;
  externalNumber?: string | null;
  suburb?: string | null;
  postalCode?: string | null;
  municipality?: string | null;
  near?: string | null;
  
  // Company data
  companyName?: string | null;
  companyStreet?: string | null;
  companyExternalNumber?: string | null;
  companyInteriorNumber?: string | null;
  companySuburb?: string | null;
  companyPostalCode?: string | null;
  companyPhone?: string | null;
  companyMunicipality?: string | null;
  companyState?: string | null;
  companyNear?: string | null;
  companyMobile?: string | null;
  job?: string | null;
  antiquity?: string | null;
  monthlyIncome?: bigint | null;
  additionalIncome?: bigint | null;
  fixedCosts?: number | null;
  bank?: string | null;
  gender?: string | null;
  affiliationNumber?: string | null;
  rfc?: string | null;
  isRented?: string | null;
  timeRented?: string | null;
  monthlyRent?: number | null;
  birthState?: string | null;
  isForeign?: boolean | null;
  createdBy?: number | null;
  workForeign?: boolean | null;
  companyRfc?: string | null;
  businessName?: string | null;
  adquisition?: string | null;
  companyBussiness?: string | null;
  maritalRegimen?: number | null;
  workingTimeStart?: Date | null;
  workingTimeEnd?: Date | null;
  location?: string | null;
  credit?: string | null;
  creditType?: string | null;
  passport?: string | null;
  ineNumber?: string | null;
  user?: number | null;
  
  // Timestamps
  createdAt?: Date | null;
  updatedAt?: Date | null;
  
  // Additional fields
  companyBusiness?: string | null;
  beneficiary?: number | null;
  completionDate?: Date | null;
  clientStatus?: number | null;
  idmex?: string | null;
  whatsappNumberId?: string | null;
  whatsappRecipientNumber?: string | null;
  messengerConversationId?: string | null;
  messengerRecipientId?: string | null;
  campaing?: number | null;
  externalId?: string | null;
  campaignFormDate?: Date | null;
  instagramId?: string | null;
  lastContact?: Date | null;
  changePhaseDate?: Date | null;
  lastPhipipelinePhase?: string | null;
  assignedAt?: Date | null;
  movePhaseBy?: number | null;
  nationality?: string | null;
}

export interface ClientSyncConfig {
  tableName: 'clients';
  primaryKey: 'id';
  timestampField: 'updated_at';
  batchSize?: number;
}