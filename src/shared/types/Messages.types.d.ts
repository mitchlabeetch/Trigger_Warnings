/**
 * Message types for communication between extension contexts
 */
import type { MediaInfo } from './Provider.types';
import type { Warning, WarningSubmission } from './Warning.types';
import type { Profile, ProfileCreateInput, ProfileUpdateInput } from './Profile.types';
export type MessageType = 'GET_WARNINGS' | 'SUBMIT_WARNING' | 'VOTE_WARNING' | 'GET_ACTIVE_PROFILE' | 'SET_ACTIVE_PROFILE' | 'CREATE_PROFILE' | 'UPDATE_PROFILE' | 'DELETE_PROFILE' | 'GET_ALL_PROFILES' | 'PROFILE_CHANGED' | 'MEDIA_DETECTED' | 'SUBMIT_FEEDBACK';
export interface BaseMessage {
    type: MessageType;
    requestId?: string;
}
export interface GetWarningsMessage extends BaseMessage {
    type: 'GET_WARNINGS';
    videoId: string;
}
export interface SubmitWarningMessage extends BaseMessage {
    type: 'SUBMIT_WARNING';
    submission: WarningSubmission;
}
export interface VoteWarningMessage extends BaseMessage {
    type: 'VOTE_WARNING';
    triggerId: string;
    voteType: 'up' | 'down';
}
export interface GetActiveProfileMessage extends BaseMessage {
    type: 'GET_ACTIVE_PROFILE';
}
export interface SetActiveProfileMessage extends BaseMessage {
    type: 'SET_ACTIVE_PROFILE';
    profileId: string;
}
export interface CreateProfileMessage extends BaseMessage {
    type: 'CREATE_PROFILE';
    profile: ProfileCreateInput;
}
export interface UpdateProfileMessage extends BaseMessage {
    type: 'UPDATE_PROFILE';
    profileId: string;
    updates: ProfileUpdateInput;
}
export interface DeleteProfileMessage extends BaseMessage {
    type: 'DELETE_PROFILE';
    profileId: string;
}
export interface GetAllProfilesMessage extends BaseMessage {
    type: 'GET_ALL_PROFILES';
}
export interface ProfileChangedMessage extends BaseMessage {
    type: 'PROFILE_CHANGED';
    profileId: string;
}
export interface MediaDetectedMessage extends BaseMessage {
    type: 'MEDIA_DETECTED';
    media: MediaInfo;
}
export interface SubmitFeedbackMessage extends BaseMessage {
    type: 'SUBMIT_FEEDBACK';
    name?: string;
    email?: string;
    message: string;
}
export type Message = GetWarningsMessage | SubmitWarningMessage | VoteWarningMessage | GetActiveProfileMessage | SetActiveProfileMessage | CreateProfileMessage | UpdateProfileMessage | DeleteProfileMessage | GetAllProfilesMessage | ProfileChangedMessage | MediaDetectedMessage | SubmitFeedbackMessage;
export interface MessageResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
export type WarningsResponse = MessageResponse<Warning[]>;
export type ProfileResponse = MessageResponse<Profile>;
export type ProfilesResponse = MessageResponse<Profile[]>;
export type VoidResponse = MessageResponse<void>;
//# sourceMappingURL=Messages.types.d.ts.map