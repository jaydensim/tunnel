export enum ApplicationGlobalState_CurrentWindowLegacyState {
  Undefined = 0,
  Loading = 1,
  New = 2,
  Recovered = 3,
  Operational = 4
}

export enum ApplicationGlobalState_SharedIDCacheType {
  Undefined = 0,
  LocalGenerated = 1,
  RemoteGenerated = 2,
  Paired = 3
}

export enum UIState_uiGlobalApplicationState {
  Undefined = 0,
  Loading = 1,
  Pairing = 2,
  RequiresAuthentication = 3,
  Operational = 4,
  Unpairing = 5
}

export enum UIState_uiGlobalNavbarState {
  Hidden = 0,
  Shown = 1
}

export enum SharedStatehandler_FileState {
  Loading = 0,
  Chunking = 1,
  Tunneling = 2,
  Rechunking = 3,
  Ready = 4,
  Cancelling = 5
}

export enum SharedStatehandler_DCSIGMSGTYPE {
  ACK = 2,
  DeleteFile = 9,
  NewSkeletonFile = 10,
  UpdateFileStatus = 11,
  UpdateFileData = 12,
  RequestForFileChunk = 22,
  FileChunk = 23
}

export interface CustomWindow extends Window {
  tunneldebug: any
}
