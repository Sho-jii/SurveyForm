"use client";

const DEVICE_ID_KEY = "surveyform_device_id";
const OWNED_SURVEYS_KEY = "surveyform_owned_surveys";

export const deviceSessionService = {
  /**
   * Retrieves or initializes the hardware-persistent unique Device ID.
   * Stored in localStorage so it survives browser restarts, reboots, and sleep cycles.
   */
  getDeviceId(): string {
    if (typeof window === "undefined") {
      return "server_env";
    }

    try {
      let deviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      return deviceId;
    } catch {
      return "fallback_device";
    }
  },

  /**
   * Returns the list of survey IDs owned / managed by this device.
   */
  getOwnedSurveyIds(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(OWNED_SURVEYS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Registers a survey ID as owned by this device in localStorage.
   */
  claimSurveyOwnership(surveyId: string): void {
    if (typeof window === "undefined" || !surveyId) return;
    try {
      const current = this.getOwnedSurveyIds();
      if (!current.includes(surveyId)) {
        const updated = [...current, surveyId];
        localStorage.setItem(OWNED_SURVEYS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Could not write owned survey ID to localStorage:", e);
    }
  },

  /**
   * Removes a survey ID from local ownership (e.g. upon deletion).
   */
  removeSurveyOwnership(surveyId: string): void {
    if (typeof window === "undefined" || !surveyId) return;
    try {
      const current = this.getOwnedSurveyIds();
      const updated = current.filter((id) => id !== surveyId);
      localStorage.setItem(OWNED_SURVEYS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not remove owned survey ID from localStorage:", e);
    }
  },

  /**
   * Verifies if this device is authorized to manage the specified survey.
   */
  isOwner(surveyId: string, creatorDeviceId?: string | null): boolean {
    if (typeof window === "undefined") return true;

    const myDeviceId = this.getDeviceId();

    // 1. Direct match with creatorDeviceId in survey schema
    if (creatorDeviceId && creatorDeviceId === myDeviceId) {
      this.claimSurveyOwnership(surveyId);
      return true;
    }

    // 2. Direct match with locally saved owned surveys
    const ownedIds = this.getOwnedSurveyIds();
    if (ownedIds.includes(surveyId)) {
      return true;
    }

    // 3. Fallback for legacy surveys created prior to device session tracking:
    // If the survey has no creator tag and this device has not claimed other surveys,
    // auto-adopt it for the current researcher machine.
    if (!creatorDeviceId) {
      this.claimSurveyOwnership(surveyId);
      return true;
    }

    return false;
  },
};
